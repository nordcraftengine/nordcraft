import { expect, type Page } from '@playwright/test'
import {
  API_RESPONSE_DELAY_MS,
  API_RESPONSE_ITEMS,
  FIXTURE_ROUTES_ENV,
} from '../fixtures/constants'

export const openFixture = async (page: Page, fixture: string) => {
  const usesFixtureRoutes = process.env[FIXTURE_ROUTES_ENV] === '1'

  if (usesFixtureRoutes) {
    // The backend fixture project only serves the fixtures themselves. Mock the
    // API used by the API state fixtures so they can run against the backend too.
    await page.route('**/api/files*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, API_RESPONSE_DELAY_MS))
      await route.fulfill({ json: { items: API_RESPONSE_ITEMS } })
    })
  }

  await page.goto(
    usesFixtureRoutes
      ? `/${encodeURIComponent(fixture)}`
      : `/?fixture=${encodeURIComponent(fixture)}`,
  )
  // Wait for the runtime createRoot to complete and mount into #App
  await page.waitForFunction(
    () => window.__toddle?.isPageLoaded === true || window.__e2e?.error,
    null,
    { timeout: 10_000 },
  )
  const error = await page.evaluate(() => window.__e2e?.error ?? null)
  expect(error).toBeNull()
}
