import { Pool as NeonServerlessPool, neonConfig } from '@neondatabase/serverless'
import type { Pool } from 'pg'
import * as nodePg from 'pg'

type PgDependency = typeof import('pg')

const STORAGE_DATABASE_URL_ENV = 'STORAGE_DATABASE_URL'
const LEGACY_DATABASE_URL_ENV = 'DATABASE_URL'
const STORAGE_DATABASE_USE_NEON_ENV = 'STORAGE_DATABASE_USE_NEON_SERVERLESS'

let warnedLegacyDatabaseURL = false
let configuredNeon = false

const parseBoolean = (value: string | undefined): boolean | undefined => {
  if (value === undefined) return undefined
  return value === 'true'
}

const isNeonHost = (connectionString: string): boolean => {
  try {
    const host = new URL(connectionString).hostname.toLowerCase()
    return host.includes('neon.tech')
  } catch {
    return false
  }
}

const configureNeonServerless = (): void => {
  if (configuredNeon) return

  neonConfig.fetchConnectionCache = true

  if (typeof globalThis.WebSocket !== 'undefined') {
    neonConfig.webSocketConstructor = globalThis.WebSocket
  }

  configuredNeon = true
}

export const getStorageDatabaseURL = (): string => {
  const storageDatabaseURL = process.env[STORAGE_DATABASE_URL_ENV]?.trim()
  if (storageDatabaseURL) return storageDatabaseURL

  const legacyDatabaseURL = process.env[LEGACY_DATABASE_URL_ENV]?.trim()
  if (legacyDatabaseURL) {
    if (!warnedLegacyDatabaseURL) {
      console.warn(
        `[db] ${LEGACY_DATABASE_URL_ENV} is deprecated. Migrate to ${STORAGE_DATABASE_URL_ENV}.`,
      )
      warnedLegacyDatabaseURL = true
    }
    return legacyDatabaseURL
  }

  return ''
}

export const shouldUseNeonServerlessPool = (connectionString: string): boolean => {
  const explicitValue = parseBoolean(process.env[STORAGE_DATABASE_USE_NEON_ENV])
  if (explicitValue !== undefined) return explicitValue
  return isNeonHost(connectionString)
}

export const getStoragePgDependency = (): PgDependency => {
  const connectionString = getStorageDatabaseURL()
  if (!connectionString || !shouldUseNeonServerlessPool(connectionString)) {
    return nodePg as PgDependency
  }

  configureNeonServerless()

  return {
    ...(nodePg as PgDependency),
    Pool: NeonServerlessPool,
  }
}

export const createStoragePool = (): Pool => {
  const connectionString = getStorageDatabaseURL()
  if (!connectionString) {
    throw new Error(
      `Missing ${STORAGE_DATABASE_URL_ENV}. Set ${STORAGE_DATABASE_URL_ENV} (preferred) or ${LEGACY_DATABASE_URL_ENV}.`,
    )
  }

  if (shouldUseNeonServerlessPool(connectionString)) {
    configureNeonServerless()
    return new NeonServerlessPool({
      connectionString,
    }) as unknown as Pool
  }

  return new nodePg.Pool({
    connectionString,
  })
}
