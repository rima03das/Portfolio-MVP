import { expect, test } from '@playwright/test'

test('artist and viewer complete the portfolio workflow locally', async ({ page }) => {
  const remoteRequests: string[] = []
  page.on('request', (request) => {
    const hostname = new URL(request.url()).hostname
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
      remoteRequests.push(request.url())
    }
  })

  const adminUsername = 'studio-artist'
  const adminPassword = 'LocalPortfolioArtist123!'
  const artworkTitle = 'E2E Study Revised'
  const comment = 'The layered charcoal gives this piece a quiet energy.'

  await page.goto('/')
  const samples = page.locator('.sample-grid .artwork-card')
  await expect(samples).toHaveCount(3)
  const sampleTitles = await samples.locator('h2').allTextContents()
  expect(new Set(sampleTitles).size).toBe(3)
  await expect(samples.first().locator('.sample-comment')).toBeVisible()
  await expect.poll(() => samples.first().locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0)
  await page.reload()
  await expect(samples.locator('h2')).toHaveText(sampleTitles)

  await page.getByRole('link', { name: 'Set up artist account' }).click()
  await page.getByLabel('Username').fill(adminUsername)
  await page.getByLabel('Password').fill(adminPassword)
  await page.getByRole('button', { name: 'Create artist account' }).click()
  await expect(page).toHaveURL(/\/admin$/)

  await page.getByRole('link', { name: 'New artwork' }).click()
  await page.getByLabel('Title').fill('E2E Study')
  await page.getByLabel('Medium').selectOption({ label: 'Charcoal' })
  await page.getByLabel('Description').fill('A locally hosted charcoal study for the end-to-end workflow.')
  await page.getByRole('button', { name: 'Save artwork' }).click()

  let artworkRow = page.locator('.admin-artwork-row').filter({ hasText: 'E2E Study' })
  await expect(artworkRow).toBeVisible()
  await artworkRow.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Title').fill(artworkTitle)
  await page.getByRole('button', { name: 'Save artwork' }).click()

  artworkRow = page.locator('.admin-artwork-row').filter({ hasText: artworkTitle })
  await expect(artworkRow).toBeVisible()
  const sortedResults = page.waitForResponse((response) =>
    response.url().includes('/api/admin/artworks?')
    && new URL(response.url()).searchParams.get('sort') === 'title')
  await page.getByLabel('Sort').selectOption('title')
  await sortedResults
  await expect(page.locator('.admin-artwork-row')).toHaveCount(6)
  const sortedTitles = await page.locator('.admin-artwork-info h2').allTextContents()
  expect(sortedTitles).toEqual([...sortedTitles].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })))
  await page.getByLabel('Search').fill(artworkTitle)
  await page.getByLabel('Medium').selectOption({ label: 'Charcoal' })
  await page.getByLabel('Status').selectOption('UPLOADED')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(artworkRow).toBeVisible()
  const allStatusesResults = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/admin/artworks'
      && url.searchParams.get('medium') === 'Charcoal'
      && !url.searchParams.has('status')
  })
  await page.getByLabel('Status').selectOption('ALL')
  await allStatusesResults
  await artworkRow.getByRole('button', { name: 'Publish' }).click()
  await expect(artworkRow).toContainText('published')
  await artworkRow.getByRole('button', { name: 'Unpublish' }).click()
  await expect(artworkRow).toContainText('unpublished')

  await page.getByRole('link', { name: 'Gallery', exact: true }).click()
  await expect(page.getByRole('heading', { name: artworkTitle })).toHaveCount(0)

  await page.goto('/admin/artworks')
  artworkRow = page.locator('.admin-artwork-row').filter({ hasText: artworkTitle })
  await artworkRow.getByRole('button', { name: 'Publish' }).click()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByRole('link', { name: 'Gallery', exact: true }).click()
  await page.getByRole('button', { name: 'Charcoal', exact: true }).click()
  await expect(page.getByRole('heading', { name: artworkTitle })).toBeVisible()
  await page.getByRole('button', { name: 'All work', exact: true }).click()
  await page.getByRole('link', { name: `View ${artworkTitle}` }).click()
  await expect(page.getByRole('heading', { name: artworkTitle })).toBeVisible()

  const artworkPath = new URL(page.url()).pathname
  await page.getByRole('button', { name: '♡ Like' }).click()
  await expect(page).toHaveURL(/\/signin\?returnTo=/)
  await page.getByRole('link', { name: 'Create a viewer account' }).click()
  await expect(page).toHaveURL(/\/signup\?returnTo=/)
  await page.getByLabel('Username').fill(`visitor-${Date.now()}`)
  await page.getByLabel('Password').fill('LocalPortfolioViewer123!')
  await page.getByRole('button', { name: 'Create viewer account' }).click()
  await expect(page).toHaveURL(new RegExp(`${artworkPath.replace('/', '\\/')}$`))

  await page.getByRole('button', { name: '♡ Like' }).click()
  await expect(page.locator('.detail-stats')).toContainText('1 likes')
  await page.getByLabel('Leave a note').fill(comment)
  await page.getByRole('button', { name: 'Post comment' }).click()
  await expect(page.getByText(comment)).toBeVisible()
  await page.reload()
  await expect(page.locator('.detail-stats')).toContainText('1 likes')
  await expect(page.getByText(comment)).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.goto('/signin?returnTo=%2Fadmin')
  await page.getByLabel('Username').fill(adminUsername)
  await page.getByLabel('Password').fill(adminPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Quick actions' })).toBeVisible()
  await expect(page.locator('.metric-likes .metric-value')).toHaveText('1')

  await page.goto('/admin/artworks')
  artworkRow = page.locator('.admin-artwork-row').filter({ hasText: artworkTitle })
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('comments and engagement records')
    await dialog.accept()
  })
  await artworkRow.getByRole('button', { name: 'Delete' }).click()
  await expect(artworkRow).toHaveCount(0)
  await expect(remoteRequests).toEqual([])
})
