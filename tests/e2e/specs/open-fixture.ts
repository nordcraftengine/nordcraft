import { expect, type Page } from '@playwright/test'

export const openFixture = async (page: Page, fixture: string) => {
  await page.goto(`/?fixture=${encodeURIComponent(fixture)}`)
  // Wait for the runtime createRoot to complete and mount into #App
  await page.waitForFunction(
    () => window.__toddle?.isPageLoaded === true || window.__e2e?.error,
    null,
    { timeout: 10_000 },
  )
  const error = await page.evaluate(() => window.__e2e?.error ?? null)
  expect(error).toBeNull()
}
