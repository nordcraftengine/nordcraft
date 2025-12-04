import { expect, test } from '@playwright/test'

test("includes 'Nordcraft' in title", async ({ page }) => {
  await page.goto('/projects/toddle_e2e/branches/main')
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Nordcraft/)

  // set the viewport size
  await page.setViewportSize({ width: 1920, height: 1080 })
})
