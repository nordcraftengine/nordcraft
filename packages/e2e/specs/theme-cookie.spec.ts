import { expect, test } from '@playwright/test'
import { openFixture } from './open-fixture'

test.describe('Theme cookie signal', () => {
  test('registers a single cookieStore change listener across the application', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const orig = cookieStore.addEventListener.bind(cookieStore)
      window.__cookieChangeListeners = 0
      cookieStore.addEventListener = (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
      ) => {
        if (type === 'change') {
          window.__cookieChangeListeners =
            (window.__cookieChangeListeners ?? 0) + 1
        }
        return orig(type, listener, options)
      }
    })

    await openFixture(page, 'theme-cookie')

    const listenerCount = await page.evaluate(
      () => window.__cookieChangeListeners,
    )
    expect(listenerCount).toBe(1)
  })

  test('initializes theme from existing nc-theme cookie', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'nc-theme',
        value: 'dark',
        url: 'http://127.0.0.1:4173',
      },
    ])

    await openFixture(page, 'theme-cookie')

    await expect(page.locator('html')).toHaveAttribute('data-nc-theme', 'dark')
    await expect(page.getByTestId('theme-value')).toHaveText('dark')
    await expect(page.getByTestId('child-theme-value')).toHaveText('dark')
  })

  test('reactively updates theme when nc-theme cookie is modified or removed via cookieStore', async ({
    page,
  }) => {
    await openFixture(page, 'theme-cookie')

    await expect(page.locator('html')).not.toHaveAttribute('data-nc-theme')
    await expect(page.getByTestId('theme-value')).toHaveText('none')
    await expect(page.getByTestId('child-theme-value')).toHaveText('none')

    // Simulate external cookieStore change
    await page.evaluate(() =>
      cookieStore.set({ name: 'nc-theme', value: 'sepia' }),
    )

    await expect(page.locator('html')).toHaveAttribute('data-nc-theme', 'sepia')
    await expect(page.getByTestId('theme-value')).toHaveText('sepia')
    await expect(page.getByTestId('child-theme-value')).toHaveText('sepia')

    // Simulate external cookieStore deletion
    await page.evaluate(() => cookieStore.delete('nc-theme'))

    await expect(page.locator('html')).not.toHaveAttribute('data-nc-theme')
    await expect(page.getByTestId('theme-value')).toHaveText('none')
    await expect(page.getByTestId('child-theme-value')).toHaveText('none')
  })

  test('updates theme and persists nc-theme cookie via setTheme action', async ({
    page,
  }) => {
    await openFixture(page, 'theme-cookie')

    // Set dark theme via action
    await page.getByTestId('set-dark-button').click()

    await expect(page.locator('html')).toHaveAttribute('data-nc-theme', 'dark')
    await expect(page.getByTestId('theme-value')).toHaveText('dark')
    await expect(page.getByTestId('child-theme-value')).toHaveText('dark')

    const darkCookie = await page.evaluate(
      async () => (await cookieStore.get('nc-theme'))?.value,
    )
    expect(darkCookie).toBe('dark')

    // Switch to light theme via action
    await page.getByTestId('set-light-button').click()

    await expect(page.locator('html')).toHaveAttribute('data-nc-theme', 'light')
    await expect(page.getByTestId('theme-value')).toHaveText('light')
    await expect(page.getByTestId('child-theme-value')).toHaveText('light')

    const lightCookie = await page.evaluate(
      async () => (await cookieStore.get('nc-theme'))?.value,
    )
    expect(lightCookie).toBe('light')

    // Clear theme via action
    await page.getByTestId('clear-theme-button').click()

    await expect(page.locator('html')).not.toHaveAttribute('data-nc-theme')
    await expect(page.getByTestId('theme-value')).toHaveText('none')
    await expect(page.getByTestId('child-theme-value')).toHaveText('none')
  })

  test('ignores cookie changes for unrelated cookie names', async ({
    page,
  }) => {
    await openFixture(page, 'theme-cookie')

    // Set initial theme
    await page.getByTestId('set-dark-button').click()
    await expect(page.locator('html')).toHaveAttribute('data-nc-theme', 'dark')

    // Set unrelated cookie
    await page.evaluate(() =>
      cookieStore.set({ name: 'unrelated-session', value: 'token-123' }),
    )

    // Ensure theme is unaffected
    await expect(page.locator('html')).toHaveAttribute('data-nc-theme', 'dark')
    await expect(page.getByTestId('theme-value')).toHaveText('dark')

    // Delete unrelated cookie
    await page.evaluate(() => cookieStore.delete('unrelated-session'))

    // Ensure theme is still unaffected
    await expect(page.locator('html')).toHaveAttribute('data-nc-theme', 'dark')
    await expect(page.getByTestId('theme-value')).toHaveText('dark')
  })

  test('safely cleans up active theme signal without errors on subsequent cookie changes', async ({
    page,
  }) => {
    await openFixture(page, 'theme-cookie')

    // Destroy active theme signal
    await page.getByTestId('destroy-theme-button').click()

    // Trigger cookie change on cookieStore when active signal is null
    await page.evaluate(() =>
      cookieStore.set({ name: 'nc-theme', value: 'high-contrast' }),
    )

    // Trigger cookie removal when active signal is null
    await page.evaluate(() => cookieStore.delete('nc-theme'))

    const error = await page.evaluate(() => window.__e2e?.error ?? null)
    expect(error).toBeNull()
  })
})
