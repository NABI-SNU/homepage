import { createPayloadAuthClient } from '@delmaredigital/payload-better-auth/client'

const resolveBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    'http://localhost:3000'
  )
}

export const authClient = createPayloadAuthClient({
  baseURL: resolveBaseURL(),
})
