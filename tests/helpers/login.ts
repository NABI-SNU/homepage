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
  await page.goto(`${serverURL}/account`)

  const logInTab = page.getByRole('button', { name: 'Log In' })
  await logInTab.click()

  await page.fill('#account-email', user.email)
  await page.fill('#account-password', user.password)
  await page.getByRole('button', { name: 'Log In' }).last().click()

  await page.waitForURL(`${serverURL}/account`)
  const openAdminLink = page.getByRole('link', { name: 'Open Admin' })
  await expect(openAdminLink).toBeVisible({ timeout: 15000 })
  await openAdminLink.click()
  await expect(page).toHaveURL(`${serverURL}/admin`)

  const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
  await expect(dashboardArtifact).toBeVisible()
}
