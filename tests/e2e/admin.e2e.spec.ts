import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { adminTestAccount, userTestAccount } from '../helpers/testAccounts'
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

test.describe('Non-admin admin visibility', () => {
  test('member admin hides sitewide collections and keeps self-service areas visible', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await login({
      page,
      user: userTestAccount,
    })

    await expect(page.getByRole('link', { name: 'Posts' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Wiki' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'People' })).toBeVisible()

    await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'News' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Research' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Activities' })).toHaveCount(0)
    await expect(page.getByText('Member workspace')).toBeVisible()

    await context.close()
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

  test('admin save response for contact global keeps updated text value stable after 30+ seconds', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await login({
      page,
      user: adminTestAccount,
    })

    await page.goto('http://localhost:3000/admin/globals/contactPage')

    const titleInput = page.locator('input[name="title"]').first()
    await expect(titleInput).toBeVisible()

    const originalTitle = await titleInput.inputValue()
    const editedTitle = `Admin Stable Save ${Date.now()}`

    try {
      await titleInput.fill(editedTitle)
      await expect(titleInput).toHaveValue(editedTitle)

      const saveResponsePromise = page.waitForResponse((response) => {
        return (
          response.request().method() === 'POST' &&
          response.status() === 200 &&
          response.url().includes('/api/globals/contactPage')
        )
      })

      await page
        .getByRole('button', { name: /^Save$/ })
        .first()
        .click()
      const saveResponse = await saveResponsePromise
      const savedGlobal = (await saveResponse.json().catch(() => null)) as { title?: string } | null
      expect(savedGlobal?.title).toBe(editedTitle)

      await page.waitForTimeout(32_000)
      await expect(titleInput).toHaveValue(editedTitle)
      await expect(page.getByText(/out of date/i)).toHaveCount(0)

      await page.reload()
      await expect(page.locator('input[name="title"]').first()).toHaveValue(editedTitle)
    } finally {
      const currentValue = await titleInput.inputValue().catch(() => originalTitle)
      if (currentValue !== originalTitle) {
        await titleInput.fill(originalTitle)

        const restoreResponsePromise = page.waitForResponse((response) => {
          return (
            response.request().method() === 'POST' &&
            response.status() === 200 &&
            response.url().includes('/api/globals/contactPage')
          )
        })

        await page
          .getByRole('button', { name: /^Save$/ })
          .first()
          .click()
        await restoreResponsePromise
      }
    }

    await context.close()
  })
})
