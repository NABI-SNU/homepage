import { spawn } from 'node:child_process'
import process from 'node:process'
import dotenv from 'dotenv'

dotenv.config()

type CliOptions = {
  clean: boolean
  dryRun: boolean
}

const SOURCE_DATABASE_URL =
  process.env.SOURCE_DATABASE_URL?.trim() ||
  process.env.STORAGE_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  ''
const TARGET_DATABASE_URL =
  process.env.TARGET_DATABASE_URL?.trim() ||
  process.env.NEW_STORAGE_DATABASE_URL?.trim() ||
  process.env.NEW_DATABASE_URL?.trim() ||
  ''
const PG_DUMP_BIN = process.env.PG_DUMP_BIN?.trim() || 'pg_dump'
const PSQL_BIN = process.env.PSQL_BIN?.trim() || 'psql'
const USE_DOCKER_PGTOOLS = process.env.USE_DOCKER_PGTOOLS === 'true'
const PGTOOLS_DOCKER_IMAGE = process.env.PGTOOLS_DOCKER_IMAGE?.trim() || 'postgres:17'

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { clean: false, dryRun: false }

  for (const arg of argv) {
    if (arg === '--') {
      continue
    }

    if (arg === '--clean') {
      options.clean = true
      continue
    }

    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

function printHelp(): void {
  console.log(
    [
      'Usage: pnpm migrate:neon [--clean] [--dry-run]',
      '',
      'Environment variables:',
      '  SOURCE_DATABASE_URL   Optional source DB URL (defaults to STORAGE_DATABASE_URL)',
      '  TARGET_DATABASE_URL   Required target DB URL (or NEW_STORAGE_DATABASE_URL / NEW_DATABASE_URL)',
      '  PG_DUMP_BIN           Optional pg_dump binary path (default: pg_dump)',
      '  PSQL_BIN              Optional psql binary path (default: psql)',
      '  USE_DOCKER_PGTOOLS    If true, use Dockerized postgres client tools',
      '  PGTOOLS_DOCKER_IMAGE  Docker image for client tools (default: postgres:17)',
      '',
      'Flags:',
      '  --clean    Drop existing objects in target before restore (destructive)',
      '  --dry-run  Print the commands without running them',
    ].join('\n'),
  )
}

function redactConnectionString(value: string): string {
  try {
    const url = new URL(value)
    if (url.password) url.password = '***'
    return url.toString()
  } catch {
    return '<invalid-url>'
  }
}

function isLikelyNeon(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host.includes('neon.tech')
  } catch {
    return false
  }
}

function isSameDatabase(source: string, target: string): boolean {
  try {
    const sourceUrl = new URL(source)
    const targetUrl = new URL(target)

    return (
      sourceUrl.hostname === targetUrl.hostname &&
      sourceUrl.port === targetUrl.port &&
      sourceUrl.pathname === targetUrl.pathname &&
      sourceUrl.username === targetUrl.username
    )
  } catch {
    return false
  }
}

function waitForExit(child: ReturnType<typeof spawn>, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    child.once('error', (error) => {
      reject(new Error(`${name} failed to start: ${error.message}`))
    })

    child.once('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${name} exited with code ${String(code)}`))
    })
  })
}

class ProcessExitError extends Error {
  readonly processName: string
  readonly code: number
  readonly stderr: string

  constructor(processName: string, code: number, stderr: string) {
    super(`${processName} exited with code ${String(code)}`)
    this.processName = processName
    this.code = code
    this.stderr = stderr
  }
}

function isVersionMismatchError(stderr: string): boolean {
  const lowered = stderr.toLowerCase()
  return lowered.includes('server version') && lowered.includes('pg_dump version')
}

function buildCommand(
  useDocker: boolean,
  processName: 'pg_dump' | 'psql',
  args: string[],
): { command: string; commandArgs: string[] } {
  if (!useDocker) {
    const command = processName === 'pg_dump' ? PG_DUMP_BIN : PSQL_BIN
    return { command, commandArgs: args }
  }

  return {
    command: 'docker',
    commandArgs: ['run', '--rm', '-i', PGTOOLS_DOCKER_IMAGE, processName, ...args],
  }
}

async function commandAvailable(command: string, args: string[] = ['--version']): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'ignore' })
    child.once('error', () => resolve(false))
    child.once('close', (code) => resolve(code === 0))
  })
}

async function runCopy(options: {
  clean: boolean
  dryRun: boolean
  useDocker: boolean
}): Promise<void> {
  const dumpArgs = ['--dbname', SOURCE_DATABASE_URL, '--format=plain', '--no-owner', '--no-privileges']

  if (options.clean) {
    dumpArgs.push('--clean', '--if-exists')
  }

  const restoreArgs = ['--dbname', TARGET_DATABASE_URL, '--set', 'ON_ERROR_STOP=1', '--single-transaction']

  const dumpCommand = buildCommand(options.useDocker, 'pg_dump', dumpArgs)
  const restoreCommand = buildCommand(options.useDocker, 'psql', restoreArgs)

  if (options.dryRun) {
    console.log(
      `${dumpCommand.command} ${dumpCommand.commandArgs.join(' ')} | ${restoreCommand.command} ${restoreCommand.commandArgs.join(' ')}`,
    )
    return
  }

  const pgDump = spawn(dumpCommand.command, dumpCommand.commandArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const psql = spawn(restoreCommand.command, restoreCommand.commandArgs, {
    stdio: ['pipe', 'inherit', 'pipe'],
  })

  let dumpStderr = ''
  let psqlStderr = ''

  pgDump.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    dumpStderr += text
    process.stderr.write(`[pg_dump] ${text}`)
  })

  psql.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    psqlStderr += text
    process.stderr.write(`[psql] ${text}`)
  })

  pgDump.stdout.pipe(psql.stdin)

  let dumpFailed = false
  let psqlFailed = false

  try {
    await waitForExit(pgDump, 'pg_dump')
  } catch {
    dumpFailed = true
  }

  try {
    await waitForExit(psql, 'psql')
  } catch {
    psqlFailed = true
  }

  if (dumpFailed) {
    throw new ProcessExitError('pg_dump', 1, dumpStderr)
  }

  if (psqlFailed) {
    throw new ProcessExitError('psql', 1, psqlStderr)
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))

  if (!SOURCE_DATABASE_URL) {
    throw new Error(
      'Missing source database URL: set SOURCE_DATABASE_URL, STORAGE_DATABASE_URL, or DATABASE_URL.',
    )
  }

  if (!TARGET_DATABASE_URL) {
    throw new Error(
      'Missing target database URL: set TARGET_DATABASE_URL, NEW_STORAGE_DATABASE_URL, or NEW_DATABASE_URL.',
    )
  }

  if (isSameDatabase(SOURCE_DATABASE_URL, TARGET_DATABASE_URL)) {
    throw new Error(
      'Source and target point to the same database. Use a different TARGET_DATABASE_URL.',
    )
  }

  if (!isLikelyNeon(SOURCE_DATABASE_URL)) {
    console.warn('Warning: SOURCE_DATABASE_URL does not look like a Neon host.')
  }

  if (!isLikelyNeon(TARGET_DATABASE_URL)) {
    console.warn('Warning: TARGET_DATABASE_URL does not look like a Neon host.')
  }

  console.log(`Source: ${redactConnectionString(SOURCE_DATABASE_URL)}`)
  console.log(`Target: ${redactConnectionString(TARGET_DATABASE_URL)}`)
  console.log(`Mode: ${options.clean ? 'clean restore' : 'non-destructive restore'}`)
  console.log(`Tools: ${USE_DOCKER_PGTOOLS ? `docker (${PGTOOLS_DOCKER_IMAGE})` : `${PG_DUMP_BIN} + ${PSQL_BIN}`}`)

  try {
    await runCopy({
      clean: options.clean,
      dryRun: options.dryRun,
      useDocker: USE_DOCKER_PGTOOLS,
    })
  } catch (error) {
    if (
      !USE_DOCKER_PGTOOLS &&
      error instanceof ProcessExitError &&
      error.processName === 'pg_dump' &&
      isVersionMismatchError(error.stderr)
    ) {
      const dockerAvailable = await commandAvailable('docker')

      if (!dockerAvailable) {
        throw new Error(
          [
            'pg_dump/server version mismatch detected.',
            'Install PostgreSQL 17 client tools and set PG_DUMP_BIN / PSQL_BIN,',
            'or install Docker and rerun with USE_DOCKER_PGTOOLS=true.',
          ].join(' '),
        )
      }

      console.warn(
        `Detected pg_dump/server version mismatch. Retrying with dockerized tools (${PGTOOLS_DOCKER_IMAGE}).`,
      )

      await runCopy({
        clean: options.clean,
        dryRun: options.dryRun,
        useDocker: true,
      })
    } else {
      throw error
    }
  }

  console.log('Migration copy completed.')
  console.log(
    'If this looks correct, switch STORAGE_DATABASE_URL to TARGET_DATABASE_URL for your app/runtime.',
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Migration failed: ${message}`)
  process.exit(1)
})
