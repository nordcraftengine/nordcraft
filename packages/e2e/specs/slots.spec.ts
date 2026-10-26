import { expect, test } from '@playwright/test'
import { openFixture } from './open-fixture'

test.describe('Slots', () => {
  test('renders projected slot content into child components', async ({
    page,
  }) => {
    await openFixture(page, 'slots-core')

    await expect(page.getByTestId('custom-body')).toHaveText('initial slotted')

    // Modifying dynamic state in parent updates slotted content inside child
    await page.getByTestId('change-slot-text').click()
    await expect(page.getByTestId('custom-body')).toHaveText(
      'updated slotted text!',
    )
  })

  test('renders fallback slot content when no projection is provided', async ({
    page,
  }) => {
    await openFixture(page, 'slots-core')

    await expect(page.getByTestId('fallback-placeholder')).toHaveText(
      'Fallback content',
    )
  })

  test('renders content into matching named slots and maintains default slot fallback', async ({
    page,
  }) => {
    await openFixture(page, 'slots-named')

    await expect(page.getByTestId('dialog-header')).toHaveText('Modal Title')
    await expect(page.getByTestId('dialog-footer')).toHaveText(
      'Modal Footer Action',
    )
    await expect(page.getByTestId('dialog-default-body')).toHaveText(
      'Default modal body',
    )
  })

  test('renders slotted components correctly when repeated inside a list', async ({
    page,
  }) => {
    await openFixture(page, 'slots-nested-repeat')

    await expect(page.getByTestId('slotted-0')).toHaveText('Col A')
    await expect(page.getByTestId('slotted-1')).toHaveText('Col B')
  })
})
