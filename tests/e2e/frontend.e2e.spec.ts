import { test, expect } from '@playwright/test'

import {
  cleanupAuthoredPostScenario,
  seedAuthoredPostScenario,
  type SeededScenario,
} from '../helpers/seedAuthoredPostScenario'
import {
  cleanupOwnedWikiScenario,
  seedOwnedWikiScenario,
  type SeededWikiScenario,
} from '../helpers/seedOwnedWikiScenario'

test.describe('Frontend', () => {
  test('can load homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/NABI/)
    const heading = page.locator('h1').first()
    await expect(heading).toContainText('NABI')
  })

  test('resources dropdown exposes wiki', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const resourcesButton = page.getByRole('button', { name: 'Resources' })
    await resourcesButton.hover()

    const wikiLink = page.getByRole('link', { name: 'Wiki' })
    await expect(wikiLink).toBeVisible()
    await wikiLink.click()

    await expect(page).toHaveURL('http://localhost:3000/wiki')
    await expect(page.getByRole('heading', { name: 'Connected concepts' })).toBeVisible()
  })

  test('can load wiki graph page', async ({ page }) => {
    await page.goto('http://localhost:3000/wiki/graph')
    await expect(page.getByRole('heading', { name: 'Global wiki graph' })).toBeVisible()
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
    await expect(editOwnPostLink).toHaveAttribute(
      'href',
      `/admin/collections/posts/${scenario.authorPostID}`,
    )

    await page.goto(`http://localhost:3000/posts/${scenario.otherPostSlug}`, {
      timeout: 60_000,
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByRole('link', { name: 'Edit this post' })).toHaveCount(0)
  })
})

test.describe('Account self-service', () => {
  test.describe.configure({ timeout: 120_000 })

  let scenario: SeededScenario | null = null

  test.beforeAll(async () => {
    scenario = await seedAuthoredPostScenario()
  })

  test.afterAll(async () => {
    if (!scenario) return
    await cleanupAuthoredPostScenario(scenario)
  })

  test('signed-in member sees self-service shortcuts and recent post entries', async ({ page }) => {
    if (!scenario) throw new Error('Scenario was not initialized')

    await page.goto('http://localhost:3000/account')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.fill('#account-email', scenario.authorEmail)
    await page.fill('#account-password', scenario.authorPassword)
    await page.locator('form').getByRole('button', { name: 'Log In' }).click()
    await expect(page.getByRole('link', { name: 'Open Admin' })).toBeVisible({ timeout: 15_000 })

    await expect(page.getByRole('link', { name: 'Create Post' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create Wiki Page' })).toBeVisible()
    await expect(page.getByText('Your account is ready for self-service editing.')).toBeVisible()
    await expect(page.getByText(/Recent Posts/i)).toBeVisible()
    await expect(
      page.getByText(scenario.authorPostSlug.replace(/-/g, ' '), { exact: false }),
    ).toHaveCount(0)
    await expect(page.getByText(/Author Post/i)).toBeVisible()
  })
})

test.describe('Wiki self-service actions', () => {
  test.describe.configure({ timeout: 120_000 })

  let scenario: SeededWikiScenario | null = null

  test.beforeAll(async () => {
    scenario = await seedOwnedWikiScenario()
  })

  test.afterAll(async () => {
    if (!scenario) return
    await cleanupOwnedWikiScenario(scenario)
  })

  test('signed-in member sees create wiki on index and edit only on owned wiki pages', async ({
    page,
  }) => {
    if (!scenario) throw new Error('Scenario was not initialized')

    await page.goto('http://localhost:3000/account')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.fill('#account-email', scenario.ownerEmail)
    await page.fill('#account-password', scenario.ownerPassword)
    await page.locator('form').getByRole('button', { name: 'Log In' }).click()
    await expect(page.getByRole('link', { name: 'Open Admin' })).toBeVisible({ timeout: 15_000 })

    await page.goto('http://localhost:3000/wiki')
    await expect(page.getByRole('link', { name: 'Create wiki page' })).toBeVisible()

    await page.goto(`http://localhost:3000/wiki/${scenario.ownerWikiSlug}`)
    await expect(page.getByRole('link', { name: 'Edit this wiki page' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create wiki page' })).toBeVisible()

    await page.goto(`http://localhost:3000/wiki/${scenario.otherWikiSlug}`)
    await expect(page.getByRole('link', { name: 'Edit this wiki page' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Create wiki page' })).toBeVisible()
  })
})
