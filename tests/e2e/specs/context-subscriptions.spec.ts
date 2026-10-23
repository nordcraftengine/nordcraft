import { expect, test } from '@playwright/test'
import { openFixture } from './open-fixture'

test.describe('Context subscriptions', () => {
  test('subscribes to formulas exposed by a parent provider', async ({
    page,
  }) => {
    await openFixture(page, 'context-provider')

    await expect(page.getByTestId('subscribed-theme')).toHaveText('dark')
    await expect(page.getByTestId('subscribed-counter')).toHaveText('42')

    await page.getByTestId('set-light').click()
    await expect(page.getByTestId('subscribed-theme')).toHaveText('light')
  })

  test('triggers workflows on a context provider from a child consumer', async ({
    page,
  }) => {
    await openFixture(page, 'context-workflow')

    await expect(page.getByTestId('provider-message')).toHaveText('initial')
    await page.getByTestId('trigger-context-wf').click()
    await expect(page.getByTestId('provider-message')).toHaveText(
      'updated via context workflow',
    )
  })

  test('propagates context values deeply through intermediate components', async ({
    page,
  }) => {
    await openFixture(page, 'context-deep')

    await expect(page.getByTestId('deep-brand-name')).toHaveText('Nordcraft')
    await page.getByTestId('mutate-brand').click()
    await expect(page.getByTestId('deep-brand-name')).toHaveText(
      'Nordcraft Engine',
    )
  })
})
