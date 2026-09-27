import { expect, test } from '@playwright/test'

test('keeps the primary action above the mobile navigation', async ({ page }) => {
  await page.goto('/#/')
  const startButton = page.getByRole('button', { name: /start plan/i })
  const navigation = page.getByRole('navigation', { name: /primary/i })
  const startBox = await startButton.boundingBox()
  const navigationBox = await navigation.boundingBox()

  expect(startBox).not.toBeNull()
  expect(navigationBox).not.toBeNull()
  expect(startBox!.y + startBox!.height).toBeLessThan(navigationBox!.y)
})
