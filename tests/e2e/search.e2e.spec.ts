import { expect, test } from '@playwright/test'

test.describe('Search interactions', () => {
  test('posts search clear does not re-apply stale query', async ({ page }) => {
    await page.goto('http://localhost:3000/posts', {
      waitUntil: 'domcontentloaded',
    })

    const postsSearchInput = page.getByRole('textbox', { name: 'Search posts' })
    const query = 'playwright-posts-search-regression'

    await postsSearchInput.fill(query)
    await expect(page).toHaveURL(new RegExp(`/posts\\?q=${query}$`))

    await page.getByRole('link', { name: 'Clear search' }).click()

    await expect(page).toHaveURL(/\/posts\/?$/)
    await expect(postsSearchInput).toHaveValue('')

    // Ensure debounced state does not push the previous query back into the URL.
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(/\/posts\/?$/)
    await expect(postsSearchInput).toHaveValue('')
  })

  test('global search updates and clears q param', async ({ page }) => {
    await page.goto('http://localhost:3000/search', {
      waitUntil: 'domcontentloaded',
    })

    const globalSearchInput = page.getByRole('textbox', { name: 'Search' })
    const query = 'playwright-global-search'

    await globalSearchInput.fill(query)
    await expect(page).toHaveURL(new RegExp(`/search\\?q=${query}$`))

    await globalSearchInput.fill('')
    await expect(page).toHaveURL(/\/search\/?$/)
  })
})
