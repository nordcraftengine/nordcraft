import { expect, test } from '@playwright/test'
import { openFixture } from './open-fixture'

test.describe('Event handlers', () => {
  test('handles click events and performs state mutations via actions', async ({
    page,
  }) => {
    await openFixture(page, 'event-handlers-core')

    await expect(page.getByTestId('count-value')).toHaveText('0')
    await page.getByTestId('inc-button').click()
    await expect(page.getByTestId('count-value')).toHaveText('1')
    await page.getByTestId('inc-button').click()
    await expect(page.getByTestId('count-value')).toHaveText('2')
  })

  test('handles input events and accesses Event.target.value', async ({
    page,
  }) => {
    await openFixture(page, 'event-handlers-core')

    await page.getByTestId('text-input').fill('Playwright test input')
    await expect(page.getByTestId('typed-text')).toHaveText(
      'Playwright test input',
    )
  })

  test('handles double click events on DOM elements', async ({ page }) => {
    await openFixture(page, 'event-handlers-core')

    await expect(page.getByTestId('dbl-status')).toHaveText('false')
    await page.getByTestId('dbl-button').dblclick()
    await expect(page.getByTestId('dbl-status')).toHaveText('true')
  })

  test('handles custom component events emitted by child components', async ({
    page,
  }) => {
    await openFixture(page, 'event-handlers-core')

    await expect(page.getByTestId('custom-event-data')).toHaveText('none')
    await page.getByTestId('emit-event-btn').click()
    await expect(page.getByTestId('custom-event-data')).toHaveText(
      'hello from child event',
    )
  })
})
