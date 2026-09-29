import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import type { OldTheme, Theme } from '@nordcraft/core/dist/styling/theme'
import {
  getThemeCss,
  getThemeEntries,
  renderThemeValues,
} from '@nordcraft/core/dist/styling/theme'
import { THEME_DATA_ATTRIBUTE } from '@nordcraft/core/dist/styling/theme.const'
import type { Signal } from '../signal/signal'
import { getThemeSignal } from '../utils/getThemeSignal'

export const getThemeCssBlocks = (theme: { key: string; value: Theme }) => {
  const cssBlocks: string[] = []
  if (theme.key === theme.value.default) {
    cssBlocks.push(
      renderThemeValues(
        `:host, :root`,
        getThemeEntries(theme.value, theme.key),
      ),
    )
  }
  if (theme.key === theme.value.defaultDark) {
    cssBlocks.push(
      renderThemeValues(
        `:host, :root`,
        getThemeEntries(theme.value, theme.key),
        '@media (prefers-color-scheme: dark)',
      ),
    )
  }
  if (theme.key === theme.value.defaultLight) {
    cssBlocks.push(
      renderThemeValues(
        `:host, :root`,
        getThemeEntries(theme.value, theme.key),
        '@media (prefers-color-scheme: light)',
      ),
    )
  }
  cssBlocks.push(
    renderThemeValues(
      `[${THEME_DATA_ATTRIBUTE}~="${theme.key}"]`,
      getThemeEntries(theme.value, theme.key),
    ),
  )
  return cssBlocks.join('\n')
}

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
}

let _themeRootSignal = null as Signal<string | null> | null
export function setupThemeSubscription(
  component: Component,
  dataSignal: Signal<ComponentData>,
  env: ToddleEnv,
) {
  _themeRootSignal?.destroy()
  _themeRootSignal = getThemeSignal(component, dataSignal, env)

  return _themeRootSignal
}
