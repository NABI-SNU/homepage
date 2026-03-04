import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { adminTestAccount } from '../helpers/testAccounts'
import {
  cleanupAuthoredPostScenario,
  seedAuthoredPostScenario,
  type SeededScenario,
} from '../helpers/seedAuthoredPostScenario'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: adminTestAccount })
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL(/\/admin\/collections\/users(?:\?.*)?$/)
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/posts/create')
    await expect(page).toHaveURL(/\/admin\/collections\/posts\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="title"]')
    await expect(editViewArtifact).toBeVisible()
  })
})

test.describe('Admin editor stability', () => {
  test.describe.configure({ timeout: 180_000 })

  let scenario: SeededScenario | null = null

  test.beforeAll(async () => {
    scenario = await seedAuthoredPostScenario()
  })

  test.afterAll(async () => {
    if (!scenario) return
    await cleanupAuthoredPostScenario(scenario)
  })

  test('non-admin can edit an authored post for 30+ seconds without mid-edit overwrite', async ({
    browser,
  }) => {
    if (!scenario) throw new Error('Scenario was not initialized')

    const context = await browser.newContext()
    const page = await context.newPage()

    await login({
      page,
      user: {
        email: scenario.authorEmail,
        password: scenario.authorPassword,
      },
    })

    await page.goto(`http://localhost:3000/admin/collections/posts/${scenario.authorPostID}`)
    const titleInput = page.locator('input[name="title"]')
    await expect(titleInput).toBeVisible()

    const editedTitle = `Stable Edit ${Date.now()}`
    await titleInput.fill(editedTitle)
    await expect(titleInput).toHaveValue(editedTitle)

    await page.waitForTimeout(32_000)
    await expect(titleInput).toHaveValue(editedTitle)
    await expect(page.getByText(/out of date/i)).toHaveCount(0)

    await context.close()
  })
})
