import { getFontCssUrl } from '@nordcraft/core/dist/styling/fonts'
import type { OldTheme, Theme } from '@nordcraft/core/dist/styling/theme'
import { getThemeCss } from '@nordcraft/core/dist/styling/theme'

/**
 * Insert (or replace) the theme stylesheet + the font stylesheet link in the canvas.
 *
 * Fonts are resolved exactly like on a published page: google fonts are loaded
 * through a stylesheet link built from family/weight/italic, while uploaded fonts
 * get an `@font-face` from their stored url (via `createFontFaces`).
 */
export const insertTheme = (
  parent: HTMLElement,
  themes: Record<string, OldTheme | Theme>,
) => {
  document.getElementById('theme-style')?.remove()
  const styleElem = document.createElement('style')
  styleElem.setAttribute('type', 'text/css')
  styleElem.setAttribute('id', 'theme-style')
  styleElem.innerHTML = getThemeCss(themes, {
    includeResetStyle: false,
    createFontFaces: true,
  })
  parent.appendChild(styleElem)

  // The canvas document is served by the same worker that mounts /.toddle,
  // so the default (relative) basePath resolves same-origin, just like on a page.
  // Legacy themes have no fonts to link - they only carry font family names.
  const fontCssUrl = getFontCssUrl({
    fonts: Object.values(themes).flatMap((theme) =>
      'breakpoints' in theme ? [] : theme.fonts,
    ),
  })?.swap
  const existingLink = document.getElementById('font-stylesheet')
  // Only touch the link when the fonts actually changed. Theme updates arrive
  // on every edit, and replacing the link each time unloads the font faces
  // until the stylesheet has been fetched again, which flickers the canvas.
  if (existingLink?.getAttribute('href') !== fontCssUrl) {
    existingLink?.remove()
    if (fontCssUrl) {
      const linkElem = document.createElement('link')
      linkElem.id = 'font-stylesheet'
      linkElem.rel = 'stylesheet'
      linkElem.href = fontCssUrl
      parent.appendChild(linkElem)
    }
  }
}
