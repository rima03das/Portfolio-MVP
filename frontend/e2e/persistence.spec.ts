import { expect, test } from '@playwright/test'

test('an anonymous artwork view is deduplicated across a refresh', async ({ page }) => {
  await page.goto('/')
  const sample = page.locator('.sample-grid .artwork-card').first()
  const artworkTitle = await sample.locator('h2').innerText()
  await sample.getByRole('link', { name: `View ${artworkTitle}` }).click()

  const viewCount = page.locator('.detail-stats span').filter({ hasText: 'views' })
  await expect(viewCount).toContainText('1 views')
  await page.reload()
  await expect(viewCount).toContainText('1 views')
})
