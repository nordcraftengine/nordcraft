import { expect, test } from '@playwright/test'
import { openFixture } from './open-fixture'

test.describe('API v2 state', () => {
  test('auto-fetches when the autoFetch formula becomes true', async ({
    page,
  }) => {
    await openFixture(page, 'api-state')

    await expect(page.getByTestId('files')).toHaveText('null')

    const responsePromise = page.waitForResponse((response) =>
      response.url().endsWith('/api/files'),
    )
    await page.getByTestId('start-fetch').click()
    const response = await responsePromise

    expect(response.ok()).toBe(true)
    await expect(page.getByTestId('files')).toHaveText('file1.json,file2.json')
  })

  test('onCompleted actions read the latest component state', async ({
    page,
  }) => {
    const requestPromise = page.waitForRequest((request) =>
      request.url().endsWith('/api/files'),
    )
    await openFixture(page, 'api-state-in-flight')
    await requestPromise

    // Update a variable while the API request is still in flight
    await page.getByTestId('update-other').click()

    await expect(page.getByTestId('combined-files')).toHaveText(
      'file1.json,file2.json',
    )
    await expect(page.getByTestId('combined-other')).toHaveText(
      'updated-while-in-flight',
    )
  })
})
