import { expect, test } from '@playwright/test'
import { openFixture } from './open-fixture'

test.describe('Custom actions', () => {
  test('executes custom action v2 handlers and applies input arguments', async ({
    page,
  }) => {
    await openFixture(page, 'custom-actions')

    await expect(page.getByTestId('hash-result')).toHaveText('none')
    await page.getByTestId('run-hash').click()
    // "nordcraft" reversed is "tfarcdron"
    await expect(page.getByTestId('hash-result')).toHaveText('tfarcdron')

    // Change input and run again
    await page.getByTestId('hash-input').fill('hello')
    await page.getByTestId('run-hash').click()
    await expect(page.getByTestId('hash-result')).toHaveText('olleh')
  })

  test('triggers action events from within custom action handlers', async ({
    page,
  }) => {
    await openFixture(page, 'custom-actions')

    await expect(page.getByTestId('lifecycle-status')).toHaveText('false')
    await page.getByTestId('run-lifecycle').click()
    await expect(page.getByTestId('lifecycle-status')).toHaveText('true')
  })
})
