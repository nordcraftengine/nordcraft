import { expect, type Page } from '@playwright/test'

export const openFixture = async (page: Page, fixture: string) => {
  await page.goto(`/?fixture=${encodeURIComponent(fixture)}`)
  await page.waitForFunction(() => window.__e2e?.ready || window.__e2e?.error)
  const error = await page.evaluate(() => window.__e2e?.error ?? null)
  expect(error).toBeNull()
}
