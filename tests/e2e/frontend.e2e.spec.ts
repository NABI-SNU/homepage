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
import {
  cleanupResearchScenario,
  seedResearchScenario,
  type SeededResearchScenario,
} from '../helpers/seedResearchScenario'
import {
  cleanupAnnouncementScenario,
  seedAnnouncementScenario,
  type SeededAnnouncementScenario,
} from '../helpers/seedAnnouncementScenario'

test.describe('Frontend', () => {
  test('can load homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/NABI/)
    const heading = page.locator('h1').first()
    await expect(heading).toContainText('NABI')
  })

  test('activities dropdown exposes announcements', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const activitiesButton = page.getByRole('button', { name: 'Activities' })
    await activitiesButton.hover()

    const announcementsLink = page
      .getByLabel('Main navigation')
      .getByRole('link', { name: 'Announcements' })
    await expect(announcementsLink).toBeVisible()
  })

  test('resources dropdown exposes wiki and book', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const resourcesButton = page.getByRole('button', { name: 'Resources' })
    await resourcesButton.hover()

    const wikiLink = page.getByLabel('Main navigation').getByRole('link', { name: 'Wiki' })
    await expect(wikiLink).toBeVisible()
    const bookLink = page.getByRole('link', { name: 'Book' })
    await expect(bookLink).toBeVisible()
    await expect(bookLink).toHaveAttribute('href', 'https://book.nabilab.org')
    await expect(bookLink).toHaveAttribute('target', '_blank')

    await page.goto('http://localhost:3000/wiki')
    await expect(page).toHaveURL('http://localhost:3000/wiki')
    await expect(page.getByRole('heading', { name: 'Connected concepts' })).toBeVisible()
  })

  test('can load wiki graph page', async ({ page }) => {
    await page.goto('http://localhost:3000/wiki/graph')
    await expect(page.getByRole('heading', { name: 'Global wiki graph' })).toBeVisible()
  })
})

test.describe('Announcements experience', () => {
  test.describe.configure({ timeout: 120_000 })

  let scenario: SeededAnnouncementScenario | null = null

  test.beforeAll(async () => {
    scenario = await seedAnnouncementScenario()
  })

  test.afterAll(async () => {
    if (!scenario) return
    await cleanupAnnouncementScenario(scenario)
  })

  test('announcements archive and detail pages render standalone collection entries', async ({
    page,
  }) => {
    if (!scenario) throw new Error('Scenario was not initialized')

    await page.goto('http://localhost:3000/announcements')
    await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible()
    await expect(page.getByText(scenario.announcementTitle)).toBeVisible()

    await page.goto(`http://localhost:3000/announcements/${scenario.announcementSlug}`, {
      timeout: 60_000,
    })
    await expect(page.getByRole('heading', { name: scenario.announcementTitle })).toBeVisible()
    await expect(page.getByText('Schedule update')).toBeVisible()
  })
})

test.describe('Post edit visibility @auth', () => {
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
    })
    await expect(page.getByRole('link', { name: 'Edit this post' })).toHaveCount(0)

    await page.goto('http://localhost:3000/account')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.fill('#account-email', scenario.authorEmail)
    await page.fill('#account-password', scenario.authorPassword)
    await page.locator('form').getByRole('button', { name: 'Log In' }).click()
    await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible({ timeout: 30_000 })

    await page.goto(`http://localhost:3000/posts/${scenario.authorPostSlug}`, {
      timeout: 60_000,
    })
    const editOwnPostLink = page.getByRole('link', { name: 'Edit this post' })
    await expect(editOwnPostLink).toBeVisible({ timeout: 15_000 })
    await expect(editOwnPostLink).toHaveAttribute(
      'href',
      `/admin/collections/posts/${scenario.authorPostID}`,
    )

    await page.goto(`http://localhost:3000/posts/${scenario.otherPostSlug}`, {
      timeout: 60_000,
    })
    await expect(page.getByRole('link', { name: 'Edit this post' })).toHaveCount(0)
  })
})

test.describe('Account self-service @auth', () => {
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
    await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('link', { name: 'Open Admin' })).toBeVisible({ timeout: 30_000 })

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

test.describe('Wiki self-service actions @auth', () => {
  test.describe.configure({ timeout: 120_000 })

  let scenario: SeededWikiScenario | null = null

  test.beforeAll(async () => {
    scenario = await seedOwnedWikiScenario()
  })

  test.afterAll(async () => {
    if (!scenario) return
    await cleanupOwnedWikiScenario(scenario)
  })

  test('signed-in member sees create wiki on index and edit on all wiki pages', async ({
    page,
  }) => {
    if (!scenario) throw new Error('Scenario was not initialized')

    await page.goto('http://localhost:3000/account')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.fill('#account-email', scenario.ownerEmail)
    await page.fill('#account-password', scenario.ownerPassword)
    await page.locator('form').getByRole('button', { name: 'Log In' }).click()
    await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('link', { name: 'Open Admin' })).toBeVisible({ timeout: 30_000 })

    await page.goto('http://localhost:3000/wiki')
    await expect(page.getByRole('link', { name: 'Create wiki page' })).toBeVisible()
    await expect(page.getByText('Top Contributors')).toBeVisible()

    await page.goto(`http://localhost:3000/wiki/${scenario.ownerWikiSlug}`)
    await expect(page.getByRole('link', { name: 'Edit this wiki page' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create wiki page' })).toBeVisible()
    await expect(page.getByText(/Last edited by/i)).toHaveCount(0)

    await page.goto(`http://localhost:3000/wiki/${scenario.otherWikiSlug}`)
    await expect(page.getByRole('link', { name: 'Edit this wiki page' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create wiki page' })).toBeVisible()
    await expect(page.getByText(/Last edited by/i)).toHaveCount(0)
  })

  test('anonymous visitors cannot see wiki edit controls', async ({ page }) => {
    if (!scenario) throw new Error('Scenario was not initialized')

    await page.goto(`http://localhost:3000/wiki/${scenario.ownerWikiSlug}`)
    await expect(page.getByRole('link', { name: 'Edit this wiki page' })).toHaveCount(0)
  })
})

test.describe('Labs experience', () => {
  test.describe.configure({ timeout: 120_000 })

  let scenario: SeededResearchScenario | null = null

  test.beforeAll(async () => {
    scenario = await seedResearchScenario()
  })

  test.afterAll(async () => {
    if (!scenario) return
    await cleanupResearchScenario(scenario)
  })

  test('labs index surfaces notebook library entries', async ({ page }) => {
    if (!scenario) throw new Error('Scenario was not initialized')

    await page.goto('http://localhost:3000/labs')
    await expect(page.getByRole('heading', { name: 'Notebooks and notes' })).toBeVisible()
    await expect(page.getByText(scenario.researchTitle)).toBeVisible()
    await expect(page.getByText(/Notebook attached/i).first()).toBeVisible()
  })

  test('lab detail renders reading-first notebook view without legacy external actions', async ({
    page,
  }) => {
    if (!scenario) throw new Error('Scenario was not initialized')

    await page.goto(`http://localhost:3000/labs/${scenario.researchSlug}`, {
      timeout: 60_000,
      waitUntil: 'domcontentloaded',
    })

    await expect(page.getByRole('heading', { name: scenario.researchTitle })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Interactive reading view' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Source:/i })).toHaveAttribute(
      'href',
      `/api/labs/${scenario.researchSlug}/notebook?download=1`,
    )
    await expect(page.getByText('Demo Notebook')).toBeVisible()
    await expect(page.getByText('hello from the notebook', { exact: true })).toBeVisible()
    await expect(page.getByText('Interactive Plotly figure')).toBeVisible()
    await expect(page.getByTestId('notebook-plotly-figure')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download source notebook' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Open in Colab/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Open in Kaggle/i })).toHaveCount(0)
  })
})
