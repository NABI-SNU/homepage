import { createAuthClient } from 'better-auth/react'
import { genericOAuthClient } from 'better-auth/client/plugins'

const resolveBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
}

export const authClient = createAuthClient({
  baseURL: resolveBaseURL(),
  plugins: [genericOAuthClient()],
})
