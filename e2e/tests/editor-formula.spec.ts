import { expect, test } from '@playwright/test'

test('can create, name, and delete a formula', async ({ page }) => {
  await page.goto('/projects/toddle_e2e/branches/main/components/HomePage')

  // Create formula
  const createFormulaButton = page.getByTestId('add-formula')
  await createFormulaButton.waitFor({ state: 'visible' })
  await createFormulaButton.click()
  const formulaInput = page.getByTestId('formula-name-input')
  await formulaInput.waitFor({ state: 'visible' })
  await formulaInput.fill('My Formula')
  await page.keyboard.press('Escape') // Close the overlay

  await expect(page.getByTestId('formula-item')).toHaveCount(1)
  expect(page.getByText('My Formula')).toBeDefined()

  // Delete the variable
  const formulaElement = page.getByTestId('formula-item')
  await formulaElement.click({ button: 'right' })
  await page.getByText('Delete').click()
  await expect(page.getByTestId('formula-item')).toHaveCount(0)
})
