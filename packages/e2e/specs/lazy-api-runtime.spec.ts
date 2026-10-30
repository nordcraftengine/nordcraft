import { expect, test, type Page } from '@playwright/test'
import { openFixture } from './open-fixture'

const trackRequests = (page: Page) => {
  const requests = new Set<string>()
  page.on('request', (request) => {
    requests.add(new URL(request.url()).pathname)
  })
  return requests
}

test.describe('Lazy API runtime', () => {
  test('loads the API v2 runtime when the page uses API v2', async ({
    page,
  }) => {
    const requests = trackRequests(page)

    await openFixture(page, 'api-state')

    expect(requests).toContain('/_static/api-v2.main.esm.js')
    expect(requests).not.toContain('/_static/api-v1.main.esm.js')
  })

  test('does not load either API runtime for pages without APIs', async ({
    page,
  }) => {
    const requests = trackRequests(page)

    await openFixture(page, 'slots-core')

    expect(requests).not.toContain('/_static/api-v1.main.esm.js')
    expect(requests).not.toContain('/_static/api-v2.main.esm.js')
  })
})
