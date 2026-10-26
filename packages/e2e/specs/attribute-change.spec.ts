import { expect, test } from '@playwright/test'
import { openFixture } from './open-fixture'

test('onAttributeChange actions see values written by earlier actions', async ({
  page,
}) => {
  await openFixture(page, 'attribute-change')

  await expect(page.getByTestId('step1')).toHaveText('initial')
  await expect(page.getByTestId('step2')).toHaveText('initial-derived')
  await expect(page.getByTestId('branched')).toHaveText('false')

  await page.getByTestId('change-attribute').click()

  await expect(page.getByTestId('step1')).toHaveText('updated')
  await expect(page.getByTestId('step2')).toHaveText('updated')
  await expect(page.getByTestId('branched')).toHaveText('true')
})
