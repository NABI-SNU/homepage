import 'dotenv/config'
import pg from 'pg'

const REQUIRED_INDEXES = [
  'activities_activity_type_idx',
  'activities_date_idx',
  'activities_status_activity_type_date_idx',
] as const

const connectionString = process.env.STORAGE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim()

if (!connectionString) {
  console.error('Missing STORAGE_DATABASE_URL (or fallback DATABASE_URL).')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString })

const main = async () => {
  const result = await pool.query<{ indexname: string }>(
    `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'activities'
    `,
  )

  const existing = new Set(result.rows.map((row) => row.indexname))
  const missing = REQUIRED_INDEXES.filter((indexName) => !existing.has(indexName))

  if (missing.length > 0) {
    console.error(`Missing required activities indexes: ${missing.join(', ')}`)
    process.exit(1)
  }

  console.log(`All required activities indexes are present: ${REQUIRED_INDEXES.join(', ')}`)
}

main()
  .catch((error) => {
    console.error('Failed to verify activities indexes:', error)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
