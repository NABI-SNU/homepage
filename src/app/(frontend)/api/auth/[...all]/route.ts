import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/auth/betterAuth'

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth)
