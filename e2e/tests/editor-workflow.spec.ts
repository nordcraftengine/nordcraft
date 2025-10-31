import { expect, test } from '@playwright/test'

test('can create, name, and delete a workflow', async ({ page }) => {
  await page.goto('/projects/toddle_e2e/branches/main/components/HomePage')

  // Create workflow
  const createWorkflowButton = page.getByTestId('add-workflow')
  await createWorkflowButton.waitFor({ state: 'visible' })
  await createWorkflowButton.click()
  const workflowNameInput = page.getByTestId('workflow-name-input')
  await workflowNameInput.fill('My Workflow')
  await workflowNameInput.press('Enter')
  await workflowNameInput.press('Escape') // Close the overlay

  await expect(page.getByTestId('workflow-item')).toHaveCount(1)
  expect(page.getByText('My Workflow')).toBeDefined()

  // Rename the workflow
  const workflowElement = page.getByTestId('workflow-item')
  await workflowElement.click()
  const workflowNameInputNew = page.getByTestId('workflow-name-input')
  await workflowNameInputNew.fill('My renamed Workflow')
  await workflowNameInputNew.press('Enter')
  await workflowNameInputNew.press('Escape') // Close the overlay
  expect(page.getByText('My Renamed Workflow')).toBeDefined()

  // Delete the workflow
  await workflowElement.click()
  await page.getByTestId('delete-workflow').click()
  await expect(page.getByTestId('workflow-item')).toHaveCount(0)
})
