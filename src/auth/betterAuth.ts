import { betterAuth } from 'better-auth'
import type { BetterAuthPlugin } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { createRequire } from 'module'
import type { Payload } from 'payload'

import { strictPayloadSessionResolutionOptions } from './payloadSessionPolicy'
import { syncBetterAuthUserToPayload } from './syncBetterAuthUserToPayload'
import { resolvePayloadUserFromSession } from './resolvePayloadUserFromSession'
import { createStoragePool } from '../utilities/storageDatabase'

const parseList = (value: string | undefined): string[] => {
  return (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const parseOptionalBool = (value: string | undefined): boolean | undefined => {
  if (value === undefined) return undefined
  return value === 'true'
}

const normalizeEmail = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const isProduction = process.env.NODE_ENV === 'production'
const isProductionBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
const authBaseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || ''
const baseURLUsesHTTPS = authBaseURL.startsWith('https://')
const configuredSecureCookies = parseOptionalBool(process.env.AUTH_USE_SECURE_COOKIES)
const useSecureCookies = isProduction
  ? configuredSecureCookies === undefined
    ? baseURLUsesHTTPS
    : configuredSecureCookies && baseURLUsesHTTPS
  : false
const githubConfigured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
)
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpSecure = process.env.SMTP_SECURE === 'true'

if (isProduction && !isProductionBuildPhase && !smtpConfigured) {
  throw new Error('[auth] SMTP credentials are required in production for email verification.')
}

const localDevelopmentOrigins = isProduction
  ? []
  : ['http://localhost:3000', 'http://127.0.0.1:3000']

const trustedOrigins = Array.from(
  new Set(
    [
      ...parseList(process.env.AUTH_TRUSTED_ORIGINS),
      process.env.NEXT_PUBLIC_SERVER_URL,
      process.env.BETTER_AUTH_URL,
      ...localDevelopmentOrigins,
    ].filter((entry): entry is string => Boolean(entry)),
  ),
)

const pool = createStoragePool()
const require = createRequire(import.meta.url)
const nodemailer = require('nodemailer') as {
  createTransport: (options: Record<string, unknown>) => {
    sendMail: (message: Record<string, unknown>) => Promise<unknown>
  }
}
const mailTransport = nodemailer.createTransport(
  smtpConfigured
    ? {
        host: process.env.SMTP_HOST,
        port: Number.isFinite(smtpPort) ? smtpPort : 587,
        secure: smtpSecure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
    : {
        jsonTransport: true,
      },
)
const mailFromAddress = process.env.SMTP_FROM_ADDRESS || 'no-reply@nabi.local'
const mailFromName = process.env.SMTP_FROM_NAME || process.env.APP_NAME || 'NABI Labs'

const plugins: BetterAuthPlugin[] = [nextCookies()]

let payloadPromise: Promise<Payload> | null = null

const getPayloadInstance = async (): Promise<Payload> => {
  if (!payloadPromise) {
    payloadPromise = (async () => {
      const [{ getPayload }, configModule] = await Promise.all([
        import('payload'),
        import('@payload-config'),
      ])
      return getPayload({ config: configModule.default })
    })()
  }

  return payloadPromise
}

const getBetterAuthUserForSession = async (
  userId: string,
): Promise<{ email: string | null; emailVerified: boolean; id: string } | null> => {
  try {
    const result = await pool.query<{ email: string | null; emailVerified: boolean }>(
      'SELECT "email", "emailVerified" FROM "user" WHERE "id" = $1 LIMIT 1',
      [userId],
    )

    const row = result.rows[0]
    if (!row) return null

    return {
      id: userId,
      email: normalizeEmail(row.email),
      emailVerified: row.emailVerified === true,
    }
  } catch (error) {
    console.error('[auth] Failed loading BetterAuth user during session create', error)
    return null
  }
}

export const auth = betterAuth({
  appName: process.env.APP_NAME || 'NABI Labs',
  basePath: '/api/auth',
  baseURL: authBaseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  trustedOrigins,
  account: {
    accountLinking: {
      trustedProviders: ['github', 'google'],
      allowDifferentEmails: false,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: isProduction,
  },
  emailVerification: {
    autoSignInAfterVerification: false,
    sendOnSignIn: isProduction,
    sendOnSignUp: isProduction,
    sendVerificationEmail: async ({ user, url }) => {
      const recipient = normalizeEmail(user.email)
      if (!recipient) return

      await mailTransport.sendMail({
        from: `${mailFromName} <${mailFromAddress}>`,
        to: recipient,
        subject: 'Verify your email for NABI Labs',
        text: `Verify your email address to continue: ${url}`,
        html: `<p>Verify your email address to continue.</p><p><a href="${url}">Verify Email</a></p><p>If the button does not work, copy and paste this URL:</p><p>${url}</p>`,
      })
    },
  },
  socialProviders: {
    ...(githubConfigured
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          },
        }
      : {}),
    ...(googleConfigured
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : {}),
  },
  advanced: {
    useSecureCookies,
  },
  plugins,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await syncBetterAuthUserToPayload({
            betterAuthUser: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          })
        },
      },
      update: {
        after: async (user) => {
          await syncBetterAuthUserToPayload({
            betterAuthUser: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          })
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const betterAuthUser = await getBetterAuthUserForSession(session.userId)
          if (!betterAuthUser) return false

          const payload = await getPayloadInstance()
          const payloadUser = await resolvePayloadUserFromSession({
            payload,
            betterAuthUser,
            ...strictPayloadSessionResolutionOptions,
          })

          if (!payloadUser) return false
        },
        after: async (session) => {
          await syncBetterAuthUserToPayload({
            betterAuthUserId: session.userId,
          })
        },
      },
    },
  },
})
