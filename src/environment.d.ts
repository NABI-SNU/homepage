declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      STORAGE_DATABASE_URL: string
      DATABASE_URL?: string
      PAYLOAD_PUSH_SCHEMA?: string
      STORAGE_DATABASE_USE_NEON_SERVERLESS?: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      S3_PUBLIC_URL?: string
      S3_MEDIA_PREFIX?: string
      S3_ENDPOINT?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
