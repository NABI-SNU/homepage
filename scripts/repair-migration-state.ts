import 'dotenv/config'

import { createStoragePool } from '../src/utilities/storageDatabase'

type MigrationRow = {
  batch: number
  created_at: string
  id: number
  name: string | null
}

const pool = createStoragePool()

const main = async () => {
  const selectResult = await pool.query<MigrationRow>(
    `
      SELECT id, name, batch, created_at
      FROM payload_migrations
      WHERE batch = -1
      ORDER BY created_at DESC
    `,
  )

  if (selectResult.rows.length === 0) {
    console.log('[migrate:repair] No dev-push migration markers found.')
    return
  }

  console.log('[migrate:repair] Removing dev-push migration markers:')
  for (const row of selectResult.rows) {
    console.log(
      `- id=${row.id} name=${row.name ?? '(unnamed)'} batch=${row.batch} created_at=${row.created_at}`,
    )
  }

  const deleteResult = await pool.query(
    `
      DELETE FROM payload_migrations
      WHERE batch = -1
    `,
  )

  console.log(`[migrate:repair] Removed ${deleteResult.rowCount ?? 0} marker row(s).`)
  console.log('[migrate:repair] You can now run `pnpm migrate` again.')
}

main()
  .catch((error) => {
    console.error('[migrate:repair] Failed to repair migration state:', error)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
