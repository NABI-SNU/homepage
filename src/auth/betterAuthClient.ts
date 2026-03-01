import { createAuthClient } from 'better-auth/react'
import { genericOAuthClient } from 'better-auth/client/plugins'

const baseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const authClient = createAuthClient({
  baseURL,
  plugins: [genericOAuthClient()],
})
