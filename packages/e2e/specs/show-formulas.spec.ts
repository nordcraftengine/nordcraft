import { expect, test } from '@playwright/test'
import { openFixture } from './open-fixture'

test.describe('Show formulas (conditional rendering)', () => {
  test('conditionally mounts and unmounts DOM nodes based on boolean formulas', async ({
    page,
  }) => {
    await openFixture(page, 'show-formulas-core')

    await expect(page.getByTestId('banner')).toBeVisible()
    await expect(page.getByTestId('logged-out-notice')).toBeHidden()

    // Toggle off
    await page.getByTestId('toggle-vis').click()
    await expect(page.getByTestId('banner')).toBeHidden()
    await expect(page.getByTestId('logged-out-notice')).toBeVisible()

    // Toggle on again
    await page.getByTestId('toggle-vis').click()
    await expect(page.getByTestId('banner')).toBeVisible()
    await expect(page.getByTestId('logged-out-notice')).toBeHidden()
  })

  test('conditionally renders branches based on complex comparison formulas', async ({
    page,
  }) => {
    await openFixture(page, 'show-formulas-core')

    // Initial role is "guest"
    await expect(page.getByTestId('admin-section')).toBeHidden()
    await expect(page.getByTestId('user-section')).toBeHidden()

    // Switch to admin
    await page.getByTestId('set-admin').click()
    await expect(page.getByTestId('admin-section')).toBeVisible()
    await expect(page.getByTestId('user-section')).toBeHidden()

    // Switch to user
    await page.getByTestId('set-user').click()
    await expect(page.getByTestId('admin-section')).toBeHidden()
    await expect(page.getByTestId('user-section')).toBeVisible()
  })

  test('inserts dynamically shown element at the exact sibling position in DOM', async ({
    page,
  }) => {
    await openFixture(page, 'show-formula-sibling')

    // Initially middle element is hidden
    await expect(page.getByTestId('sibling-first')).toBeVisible()
    await expect(page.getByTestId('sibling-middle')).toBeHidden()
    await expect(page.getByTestId('sibling-last')).toBeVisible()

    // Show middle element
    await page.getByTestId('toggle-middle').click()
    await expect(page.getByTestId('sibling-middle')).toBeVisible()

    // Verify ordering in DOM: first -> middle -> last
    const order = await page
      .locator('[data-testid="root"] > div')
      .evaluateAll((divs) => divs.map((d) => d.getAttribute('data-testid')))

    expect(order).toEqual(['sibling-first', 'sibling-middle', 'sibling-last'])
  })
})
