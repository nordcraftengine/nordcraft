import { expect, test } from '@playwright/test'
import { openFixture } from './open-fixture'

test.describe('Repeat logic', () => {
  test('renders lists of primitive items and updates reactively on append/slice', async ({
    page,
  }) => {
    await openFixture(page, 'repeat-primitives')

    await expect(page.getByTestId('tag-0')).toHaveText('alpha')
    await expect(page.getByTestId('tag-1')).toHaveText('beta')
    await expect(page.getByTestId('tag-2')).toHaveText('gamma')

    await page.getByTestId('add-tag').click()
    await expect(page.getByTestId('tag-3')).toHaveText('delta')

    await page.getByTestId('remove-first').click()
    await expect(page.getByTestId('tag-0')).toHaveText('beta')
    await expect(page.getByTestId('tag-1')).toHaveText('gamma')
    await expect(page.getByTestId('tag-2')).toHaveText('delta')

    await page.getByTestId('reverse-tags').click()
    await expect(page.getByTestId('tag-0')).toHaveText('delta')
    await expect(page.getByTestId('tag-1')).toHaveText('gamma')
    await expect(page.getByTestId('tag-2')).toHaveText('beta')
  })

  test('maintains DOM identity and input state when reordering with repeatKey', async ({
    page,
  }) => {
    await openFixture(page, 'repeat-objects-order')

    // Type text into item 3's input before moving it
    await page.getByTestId('input-item-3').fill('item-3-typed-value')

    await page.getByTestId('move-to-front').click()

    // First card should now be item-3
    const firstCard = page
      .locator('[data-testid="items-container"] > div')
      .first()
    await expect(firstCard).toHaveAttribute('data-testid', 'item-3')
    // The input value must be preserved without re-creating DOM node
    await expect(page.getByTestId('input-item-3')).toHaveValue(
      'item-3-typed-value',
    )
  })

  test('re-evaluates conditional repeat items in correct order without corrupting DOM order', async ({
    page,
  }) => {
    await openFixture(page, 'repeat-conditional')

    // Initially all 4 tasks are visible: 1, 2, 3, 4
    await expect(page.getByTestId('task-1')).toBeVisible()
    await expect(page.getByTestId('task-2')).toBeVisible()
    await expect(page.getByTestId('task-3')).toBeVisible()
    await expect(page.getByTestId('task-4')).toBeVisible()

    // Filter to work tasks (tasks 1 and 3)
    await page.getByTestId('filter-work').click()
    await expect(page.getByTestId('task-1')).toBeVisible()
    await expect(page.getByTestId('task-2')).toBeHidden()
    await expect(page.getByTestId('task-3')).toBeVisible()
    await expect(page.getByTestId('task-4')).toBeHidden()

    // Filter back to all: order 1, 2, 3, 4 must be restored correctly
    await page.getByTestId('filter-all').click()
    const taskIds = await page
      .locator('[data-testid="tasks-list"] > div')
      .evaluateAll((divs) => divs.map((d) => d.getAttribute('data-testid')))
    expect(taskIds).toEqual(['task-1', 'task-2', 'task-3', 'task-4'])
  })

  test('supports nested repeats with parent ListItem context access', async ({
    page,
  }) => {
    await openFixture(page, 'repeat-nested')

    await expect(page.getByTestId('group-0')).toBeVisible()
    await expect(page.getByTestId('group-1')).toBeVisible()

    await expect(page.getByTestId('member-0-0')).toHaveText('Alice')
    await expect(page.getByTestId('member-0-1')).toHaveText('Bob')
    await expect(page.getByTestId('member-1-0')).toHaveText('Charlie')
    await expect(page.getByTestId('member-1-1')).toHaveText('Dana')
  })

  test('repeats over plain object entries with Key and Item', async ({
    page,
  }) => {
    await openFixture(page, 'repeat-object-entries')

    await expect(page.getByTestId('dt-role')).toHaveText('role')
    await expect(page.getByTestId('dd-role')).toHaveText('Admin')
    await expect(page.getByTestId('dt-status')).toHaveText('status')
    await expect(page.getByTestId('dd-status')).toHaveText('Active')
    await expect(page.getByTestId('dt-country')).toHaveText('country')
    await expect(page.getByTestId('dd-country')).toHaveText('Denmark')
  })
})
