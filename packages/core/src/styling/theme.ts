import type { CustomPropertyName } from '../component/component.types'
import { isDefined } from '../utils/util'
import { renderSyntaxDefinition, type CssSyntaxNode } from './customProperty'
import { RESET_STYLES } from './theme.const'

export interface ThemeOptions {
  includeResetStyle: boolean
  createFontFaces: boolean
}

export type StyleToken = {
  name: string
  type: 'value' | 'variable'
  value: string
}

export type StyleTokenGroup = {
  name: string
  tokens: StyleToken[]
}

export type StyleTokenCategory =
  | 'spacing'
  | 'color'
  | 'font-size'
  | 'font-weight'
  | 'z-index'
  | 'border-radius'
  | 'shadow'

export type FontFamily = {
  name: string
  family: string
  provider: 'google' | 'upload'
  type: 'serif' | 'sans-serif' | 'monospace' | 'cursive'
  variants: Array<{
    name: string
    weight:
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900'

    italic: boolean
    url: string
  }>
}

export type OldTheme = {
  spacing: number
  colors: Record<
    string,
    {
      order: number
      variants: Record<string, { value: string; order: number }>
    }
  >
  fontFamily: Record<
    string,
    { value: string[]; order: number; default?: boolean }
  >
  fontWeight: Record<
    string,
    { value: string; order: number; default?: boolean }
  >
  fontSize: Record<string, { value: string; order: number; default?: boolean }>
  shadow: Record<string, { value: string; order: number }>
  breakpoints: Record<string, { value: number; order: number }>
}

export type Theme = {
  default?: string
  defaultDark?: string
  defaultLight?: string
  propertyDefinitions?: Record<CustomPropertyName, CustomPropertyDefinition>
  themes?: {
    [key: string]: Record<
      string,
      {
        order?: number
      }
    >
  }
  // Legacy support
  scheme?: 'dark' | 'light'
  color?: StyleTokenGroup[]
  fonts: FontFamily[]
  'font-size'?: StyleTokenGroup[]
  'font-weight'?: StyleTokenGroup[]
  spacing?: StyleTokenGroup[]
  'border-radius'?: StyleTokenGroup[]
  shadow?: StyleTokenGroup[]
  'z-index'?: StyleTokenGroup[]
}

export type CustomPropertyDefinition = {
  syntax: CssSyntaxNode
  inherits: boolean
  initialValue: string | null // Required by CSS specs for default-theme, but we can do a fallback so null is allowed
  description: string
  values: Record<string, string | null>
}

export const getThemeCss = (
  themes: Record<string, OldTheme | Theme>,
  options: ThemeOptions,
) => {
  const [themesV1, themesV2] = Object.entries(themes).reduce(
    ([legacy, modern], [key, value]) => {
      if ('breakpoints' in value) {
        legacy[key] = value
      } else {
        modern[key] = value
      }
      return [legacy, modern]
    },
    [{}, {}] as [Record<string, OldTheme>, Record<string, Theme>],
  )

  return `
  ${Object.values(themesV1)
    .map((t) => getOldThemeCss(t))
    .join('\n')}

  ${Object.values(themesV2)
    .map((themeV2) => {
      return `
  ${Object.entries(themeV2.propertyDefinitions ?? {})
    .map(([propertyName, property]) =>
      renderSyntaxDefinition(
        propertyName as CustomPropertyName,
        property,
        themeV2,
      ),
    )
    .join('\n')}

  ${renderThemeValues(':host, :root', getThemeEntries(themeV2, themeV2.default))}
  ${renderThemeValues(':host, :root', getThemeEntries(themeV2, themeV2.defaultDark), '@media (prefers-color-scheme: dark)')}
  ${renderThemeValues(':host, :root', getThemeEntries(themeV2, themeV2.defaultLight), '@media (prefers-color-scheme: light)')}
  ${Object.entries(themeV2.themes ?? {})
    .map(([key, _t]) =>
      renderThemeValues(
        `[data-theme~="${key}"]`,
        getThemeEntries(themeV2, key),
      ),
    )
    .join('\n')}
    `
    })
    .join('\n')}

${options.includeResetStyle ? RESET_STYLES : ''}
@layer base {
  ${
    options.createFontFaces
      ? Object.values(themesV2)
          .map(({ fonts }) => fonts)
          .flat()
          .map(
            (font) => `
    ${font.variants
      .map(
        (variant) => `
    @font-face {
      font-family: "${font.family}";
      font-style: ${variant.italic ? 'italic' : 'normal'};
      font-weight: ${variant.weight};
      font-display: auto;
      src: local("${variant.url.substring(
        variant.url.lastIndexOf('/') + 1,
      )}"), url("${variant.url.replace(
        'https://fonts.gstatic.com',
        '/.toddle/fonts/font',
      )}") format("woff2");
    }
    `,
      )
      .join('\n')}
    `,
          )
          .join('\n')
      : ''
  }
  body, :host {
    /* Color */
    ${Object.values(themesV2)
      .map(({ color }) => color ?? [])
      .flat()
      .flatMap((group) =>
        group.tokens.map((color) => `--${color.name}: ${color.value};`),
      )
      .join('\n')}
    /* Fonts */
    ${Object.values(themesV2)
      .map(({ fonts }) => fonts)
      .flat()
      .map((font) => `--font-${font.name}: '${font.family}',${font.type};`)
      .join('\n')}

    /* Font size */
    ${Object.values(themesV2)
      .map(({ 'font-size': fontSize }) => fontSize ?? [])
      .flat()
      .flatMap((group) =>
        group.tokens.map(
          (variable) =>
            `--${variable.name}: ${
              variable.type === 'variable'
                ? `var(--${variable.value})`
                : variable.value
            };`,
        ),
      )
      .join('\n')}
    /* Font weight */
    ${Object.values(themesV2)
      .map(({ 'font-weight': fontWeight }) => fontWeight ?? [])
      .flat()
      .flatMap((group) => {
        return group.tokens.map(
          (variable) =>
            `--${variable.name}: ${
              variable.type === 'variable'
                ? `var(--${variable.value})`
                : variable.value
            };`,
        )
      })
      .join('\n')}
    /* Shadows */
    ${Object.values(themesV2)
      .map(({ shadow }) => shadow ?? [])
      .flat()
      .flatMap((group) => {
        return group.tokens.map(
          (variable) =>
            `--${variable.name}: ${
              variable.type === 'variable'
                ? `var(--${variable.value})`
                : variable.value
            };`,
        )
      })
      .join('\n')}
    /* Border radius */
    ${Object.values(themesV2)
      .map(({ 'border-radius': borderRadius }) => borderRadius ?? [])
      .flat()
      .flatMap((group) => {
        return group.tokens.map(
          (token) =>
            `--${token.name}: ${
              token.type === 'variable' ? `var(--${token.value})` : token.value
            };`,
        )
      })
      .join('\n')}
    /* Spacing */
    ${Object.values(themesV2)
      .map(({ spacing }) => spacing ?? [])
      .flat()
      .map((group) => {
        return group.tokens
          .map(
            (token) =>
              `--${token.name}: ${
                token.type === 'variable'
                  ? `var(--${token.value})`
                  : token.value
              };`,
          )
          .join('\n')
      })
      .join('\n')}
    /* Z-index */
    ${Object.values(themesV2)
      .map(({ 'z-index': zIndex }) => zIndex ?? [])
      .flat()
      .map((group) => {
        return group.tokens
          .map(
            (token) =>
              `--${token.name}: ${
                token.type === 'variable'
                  ? `var(--${token.value})`
                  : token.value
              };`,
          )
          .join('\n')
      })
      .join('\n')}
  }
  @keyframes animation-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes animation-fade-in {
    from {
      opacity:0;
    }
    to {
      opacity:1;
    }
  }
  @keyframes animation-fade-out {
    from {
      opacity:1;
    }
    to {
      opacity:0;
    }
  }
}
`
}

export const getOldThemeCss = (theme: OldTheme) => {
  const colorVars = Object.entries(theme.colors).flatMap(
    ([color, { variants }]) =>
      Object.entries(variants).map(
        ([variant, { value }]) => `--${color}-${variant}:${value}`,
      ),
  )
  return `
body, :host {
  ${Object.entries(theme.fontFamily)
    .map(
      ([
        name,
        {
          value: [family, ...fallback],
        },
      ]) => `--font-${name}: '${family}',${fallback.join(',')};`,
    )
    .join('\n')}

  ${Object.entries(theme.fontWeight)
    .map(([name, { value }]) => `--font-weight-${name}: ${value};`)
    .join('\n')}

  ${Object.entries(theme.fontSize)
    .map(([name, { value }]) => `--font-size-${name}: ${value};`)
    .join('\n')}

  --spacing:${theme.spacing}rem;
    ${colorVars.join(';\n')};

  --text-xxs:0.625rem;
  --line-height-xxs:0.9rem;

  --text-xs:0.75rem;
  --line-height-xs:1rem;

  --text-sm:0.875rem;
  --line-height-sm:1.25rem;

  --text-base:1rem;
  --line-height-base:1.5rem;

  --text-lg:1.125rem;
  --line-height-lg:1.75rem;

  --text-xl:1.25rem;
  --line-height-xl:1.75rem;

  --text-2xl:1.5rem;
  --line-height-2xl:2rem;

  --text-3xl:1.875rem;
  --line-height-3xl:2.25rem;

  --text-4xl:2.25rem;
  --line-height-4xl:2.5rem;

  --text-5xl:3rem;
  --line-height-5xl:3rem;

  ${Object.entries(theme.shadow)
    .map(([name, { value }]) => `--shadow-${name}:${value};`)
    .join('\n')}
}

${RESET_STYLES}

@keyframes animation-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes animation-fade-in {
  from {
    opacity:0;
  }
  to {
    opacity:1;
  }
}
@keyframes animation-fade-out {
  from {
    opacity:1;
  }
  to {
    opacity:0;
  }
}`
}

export function renderThemeValues(
  selector: string,
  entries: Record<string, string | null>,
  mediaQuery?: string,
) {
  const properties = Object.entries(entries).filter(([, property]) =>
    isDefined(property),
  )
  if (properties.length === 0) {
    return ''
  }

  const css = `${selector} {
  ${properties
    .map(([propertyName, value]) => `${propertyName}: ${value};`)
    .join('\n  ')}
}`

  if (mediaQuery) {
    return `${mediaQuery} {
      ${css}
    }`
  }

  return css
}

export function getThemeEntries(
  theme: Theme,
  themeName: string | undefined,
): Record<string, string | null> {
  const entries: Record<string, string | null> = {}
  if (!themeName) {
    return entries
  }

  for (const [propertyName, definition] of Object.entries(
    theme.propertyDefinitions ?? {},
  )) {
    entries[propertyName] = definition.values?.[themeName] ?? null
  }

  return entries
}
