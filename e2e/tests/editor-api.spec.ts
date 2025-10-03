import { expect, test } from '@playwright/test'

test('can create, name, and delete an API', async ({ page }) => {
  await page.goto('/projects/toddle_e2e/branches/main/components/HomePage')

  // Create API
  const createApiButton = page.getByTestId('add-api')
  await createApiButton.waitFor({ state: 'visible' })
  await createApiButton.click()
  const endpointInput = page.getByTestId('api-url-input')
  await endpointInput.fill('https://example.com/api')
  await endpointInput.press('Enter')

  await expect(page.getByTestId('api-item')).toHaveCount(1)
  expect(page.getByText('My API')).toBeDefined()

  // Rename the API
  const apiElement = page.getByTestId('api-item')
  await apiElement.click({ button: 'right' })
  await page.getByText('Rename').click()
  await page.keyboard.type('My renamed API')
  await page.keyboard.press('Enter')
  expect(page.getByText('My Renamed API')).toBeDefined()

  // Delete the API
  await apiElement.click({ button: 'right' })
  await page.getByText('Delete').click()
  await expect(page.getByTestId('api-item')).toHaveCount(0)
})
