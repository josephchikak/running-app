import { expect, test } from '@playwright/test'

test('installs its release metadata and reopens the plan offline', async ({ page, context }) => {
  await page.goto('/#/')
  await expect(page).toHaveTitle(/Running Coach/)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /running/i)

  const manifestResponse = await page.request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBe(true)
  const manifest = await manifestResponse.json()
  expect(manifest.icons).toHaveLength(3)

  await page.getByRole('button', { name: /start plan/i }).click()
  await page.getByRole('button', { name: /back to today/i }).click()
  await page.evaluate(() => navigator.serviceWorker?.ready)
  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { name: /today/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /start workout/i })).toBeVisible()
})

test('exposes privacy, terms, storage notice, and a custom not-found page', async ({ page }) => {
  await page.goto('/#/privacy')
  await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible()
  await expect(page.getByText(/no tracking cookies/i)).toBeVisible()

  await page.goto('/#/terms')
  await expect(page.getByRole('heading', { name: /terms/i })).toBeVisible()

  await page.goto('/#/missing-page')
  await expect(page.getByText('404')).toBeVisible()
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible()
})
