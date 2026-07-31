import type { FontFamily, Theme } from '@nordcraft/core/dist/styling/theme'
import { beforeEach, describe, expect, test } from 'bun:test'
import { insertTheme } from './theme'

const googleFont: FontFamily = {
  name: 'lora',
  family: 'Lora',
  provider: 'google',
  type: 'serif',
  variants: [
    {
      name: 'Lora 400',
      weight: '400',
      italic: false,
      url: 'https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJMkq1rGQ.woff2',
    },
  ],
}

const uploadedFont: FontFamily = {
  name: 'my-font',
  family: 'My Font',
  provider: 'upload',
  type: 'sans-serif',
  variants: [
    {
      name: 'My Font 500',
      weight: '500',
      italic: false,
      url: 'https://my-files.nordcraft.com/fonts/my-font-500.woff2',
    },
  ],
}

const theme = (fonts: FontFamily[]): Record<string, Theme> => ({
  theme: { fonts },
})

describe('insertTheme()', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  test('it inserts a theme style element and a font stylesheet link', () => {
    insertTheme(document.head, theme([googleFont, uploadedFont]))

    const styleElements = document.head.querySelectorAll('#theme-style')
    expect(styleElements.length).toBe(1)
    const linkElements =
      document.head.querySelectorAll<HTMLLinkElement>('#font-stylesheet')
    expect(linkElements.length).toBe(1)
    expect(linkElements[0].rel).toBe('stylesheet')
    // The same url a published page links to, built from family/weight/italic
    expect(linkElements[0].getAttribute('href')).toBe(
      '/.toddle/fonts/stylesheet/css2?display=swap&family=Lora%3Awght%40400&family=My+Font%3Awght%40500',
    )
  })

  test('it only creates font faces for uploaded fonts', () => {
    insertTheme(document.head, theme([googleFont, uploadedFont]))

    const css = document.getElementById('theme-style')!.innerHTML
    expect(css).toContain('font-family: "My Font";')
    expect(css).not.toContain('font-family: "Lora";')
    // The google font is never loaded from its stored url
    expect(css).not.toContain('fonts.gstatic.com')
    // ...but it still gets a style variable
    expect(css).toContain("--font-lora: 'Lora',serif;")
    // Uploaded fonts are still loaded from their stored url
    expect(css).toContain(
      'url("https://my-files.nordcraft.com/fonts/my-font-500.woff2") format("woff2")',
    )
  })

  test('it replaces both elements on a second call instead of duplicating them', () => {
    insertTheme(document.head, theme([googleFont]))
    insertTheme(
      document.head,
      theme([
        googleFont,
        { ...googleFont, name: 'inter', family: 'Inter' },
        uploadedFont,
      ]),
    )

    expect(document.head.querySelectorAll('#theme-style').length).toBe(1)
    expect(document.head.querySelectorAll('#font-stylesheet').length).toBe(1)
    // Both elements reflect the fonts of the latest theme data
    expect(
      document.getElementById('font-stylesheet')!.getAttribute('href'),
    ).toContain('family=Inter')
    expect(document.getElementById('theme-style')!.innerHTML).toContain(
      'font-family: "My Font";',
    )
  })

  test('it keeps the same link element when the fonts are unchanged', () => {
    insertTheme(document.head, theme([googleFont, uploadedFont]))
    const linkElement = document.getElementById('font-stylesheet')
    // A theme update that leaves the fonts alone, e.g. editing a color
    insertTheme(document.head, theme([googleFont, uploadedFont]))

    // Same element, so the stylesheet is never unloaded and refetched
    expect(document.getElementById('font-stylesheet')).toBe(linkElement)
  })

  test('it removes the font stylesheet link when the theme has no fonts', () => {
    insertTheme(document.head, theme([googleFont]))
    insertTheme(document.head, theme([]))

    expect(document.getElementById('font-stylesheet')).toBeNull()
    expect(document.querySelectorAll('#theme-style').length).toBe(1)
  })
})
