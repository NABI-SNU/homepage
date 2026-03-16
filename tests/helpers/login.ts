import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Logs a user in via BetterAuth account page and verifies admin access.
 */
export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  await page.goto(serverURL)

  const signInResult = await page.evaluate(
    async ({ email, password }) => {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          callbackURL: '/account',
        }),
      })

      let body: Record<string, unknown> | null = null
      try {
        body = (await response.json()) as Record<string, unknown>
      } catch {
        body = null
      }

      return {
        body,
        ok: response.ok,
        status: response.status,
      }
    },
    { email: user.email, password: user.password },
  )

  if (!signInResult.ok) {
    throw new Error(
      `Better Auth sign-in failed with status ${signInResult.status}: ${JSON.stringify(signInResult.body)}`,
    )
  }

  await expect
    .poll(
      async () => {
        return await page.evaluate(async () => {
          const response = await fetch('/api/auth/get-session', {
            credentials: 'include',
          })

          const body = (await response.json().catch(() => null)) as {
            user?: { email?: string | null } | null
          } | null

          return body?.user?.email ?? null
        })
      },
      { timeout: 20_000 },
    )
    .toBe(user.email)

  await page.goto(`${serverURL}/admin`)
  await expect(page).toHaveURL(`${serverURL}/admin`)
}
