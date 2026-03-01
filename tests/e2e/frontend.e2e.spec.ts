import { test, expect } from '@playwright/test'

import {
  cleanupAuthoredPostScenario,
  seedAuthoredPostScenario,
  type SeededScenario,
} from '../helpers/seedAuthoredPostScenario'

test.describe('Frontend', () => {
  test('can load homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/NABI/)
    const heading = page.locator('h1').first()
    await expect(heading).toContainText('NABI')
  })
})

test.describe('Post edit visibility', () => {
  test.describe.configure({ timeout: 120_000 })

  let scenario: SeededScenario | null = null

  test.beforeAll(async () => {
    scenario = await seedAuthoredPostScenario()
  })

  test.afterAll(async () => {
    if (!scenario) return
    await cleanupAuthoredPostScenario(scenario)
  })

  test('shows edit button only to an authenticated author on their own post', async ({ page }) => {
    if (!scenario) throw new Error('Scenario was not initialized')

    await page.goto(`http://localhost:3000/posts/${scenario.authorPostSlug}`, {
      timeout: 60_000,
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByRole('link', { name: 'Edit this post' })).toHaveCount(0)

    await page.goto('http://localhost:3000/account')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.fill('#account-email', scenario.authorEmail)
    await page.fill('#account-password', scenario.authorPassword)
    await page.locator('form').getByRole('button', { name: 'Log In' }).click()
    await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible({ timeout: 15_000 })

    await page.goto(`http://localhost:3000/posts/${scenario.authorPostSlug}`, {
      timeout: 60_000,
      waitUntil: 'domcontentloaded',
    })
    const editOwnPostLink = page.getByRole('link', { name: 'Edit this post' })
    await expect(editOwnPostLink).toBeVisible({ timeout: 15_000 })
    await expect(editOwnPostLink).toHaveAttribute('href', `/admin/collections/posts/${scenario.authorPostID}`)

    await page.goto(`http://localhost:3000/posts/${scenario.otherPostSlug}`, {
      timeout: 60_000,
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByRole('link', { name: 'Edit this post' })).toHaveCount(0)
  })
})
