// cSpell:ignore thinn, ABCDEFGHIJKLMNOPQRSTYVWXYZ
import type {
  Component,
  ComponentNodeModel,
  ElementNodeModel,
  NodeStyleModel,
} from '../component/component.types'
import { omitKeys } from '../utils/collections'
import { isDefined } from '../utils/util'
import { getClassName, toValidClassName } from './className'
import type { OldTheme, Theme, ThemeOptions } from './theme'
import { getThemeCss } from './theme'
import { variantSelector, type StyleVariant } from './variantSelector'

const LEGACY_BREAKPOINTS = {
  large: 1440,
  small: 576,
  medium: 960,
}

export function kebabCase(string: string) {
  return string
    .split('')
    .map((char) => {
      return 'ABCDEFGHIJKLMNOPQRSTYVWXYZ'.includes(char)
        ? '-' + char.toLocaleLowerCase()
        : char
    })
    .join('')
}

const SIZE_PROPERTIES = new Set([
  'width',
  'min-width',
  'max-width',
  'height',
  'min-height',
  'max-height',
  'margin',
  'margin-top',
  'margin-left',
  'margin-bottom',
  'margin-right',
  'padding',
  'padding-top',
  'padding-left',
  'padding-bottom',
  'padding-right',
  'gap',
  'gap-x',
  'gap-y',
  'border-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-width',
  'border-top-width',
  'border-left-width',
  'border-bottom-width',
  'border-right-width',
  'font-size',
  'top',
  'right',
  'bottom',
  'left',
  'outline-width',
])

export const createStylesheet = (
  root: Component,
  components: Component[],
  themes: Record<string, OldTheme | Theme>,
  options: ThemeOptions,
  // eslint-disable-next-line max-params
) => {
  const hashes = new Set<string>()
  const animationHashes = new Set<string>()

  // Get fonts used on the page
  const fonts = getAllFonts(components)

  //Exclude fonts that are not used on this page.
  let stylesheet = getThemeCss(
    Object.fromEntries(
      Object.entries(themes).map(([key, theme]) =>
        'breakpoints' in theme
          ? [
              key,
              {
                ...theme,
                fontFamily: Object.fromEntries(
                  Object.entries(theme.fontFamily).filter(
                    ([key, value]) =>
                      value.default ?? fonts.has('--font-' + key),
                  ),
                ),
              },
            ]
          : [
              key,
              {
                ...theme,
                fonts: theme.fonts,
              },
            ],
      ),
    ),
    options,
  )
  const styleToCss = (style: NodeStyleModel) => {
    return Object.entries(style)
      .map(([property, value]) => {
        if (!isDefined(value)) {
          // ignore undefined/null values
          return
        }
        const propertyName = kebabCase(property)
        const propertyValue =
          String(Number(value)) === String(value) &&
          SIZE_PROPERTIES.has(propertyName)
            ? `${Number(value) * 4}px`
            : value
        return `${propertyName}:${propertyValue};`
      })
      .filter(Boolean)
      .join('\n  ')
  }
  const getNodeStyles = (
    node: ElementNodeModel | ComponentNodeModel,
    classHash: string,
  ) => {
    try {
      const style = omitKeys(node.style ?? {}, [
        'variants',
        'breakpoints',
        'shadows',
      ])
      const styleVariants =
        node.variants ??
        // Support for old style variants stored inside style object
        // Once we have better versioning options, this should be removed
        (node.style?.variants as any as StyleVariant[])
      const renderVariant = (
        selector: string,
        style: NodeStyleModel,
        options?: { startingStyle?: boolean },
      ) => {
        const scrollbarStyles = Object.entries(style).filter(
          ([key]) => key === 'scrollbar-width',
        )
        // If selectorCss is empty, we don't need to render the selector
        let styles = styleToCss(style)
        if (options?.startingStyle) {
          styles = `@starting-style {
            ${styles}
          }`
        }

        return `
  ${
    styles.length > 0
      ? `${selector} {
    ${styles}
  }`
      : ''
  }
      ${
        scrollbarStyles.length > 0
          ? `
${selector}::-webkit-scrollbar {
  ${scrollbarStyles
    .map(([_, value]) => {
      switch (value) {
        case 'none':
          return 'width: 0;'
        case 'thinn':
        case 'thin':
          return 'width: 4px;'
        default:
          return ''
      }
    })
    .join('\n')}
}
`
          : ''
      }
`
      }

      return `
      ${renderVariant('.' + classHash, style)}
      ${(styleVariants ?? [])
        .map((variant) => {
          const renderedVariant = renderVariant(
            `.${classHash}${variantSelector(variant)}`,
            variant.style,
            {
              startingStyle: variant.startingStyle,
            },
          )

          if (variant.mediaQuery) {
            return `
          @media (${Object.entries(variant.mediaQuery)
            .map(([key, value]) => `${key}: ${value}`)
            .filter(Boolean)
            .join(') and (')}) {
            ${renderedVariant}
          }
          `
          }

          if (variant.breakpoint) {
            return `
          @media (min-width: ${LEGACY_BREAKPOINTS[variant.breakpoint]}px) {
            ${renderedVariant}
          }
          `
          }

          return renderedVariant
        })
        .join('\n')}
        ${
          node.animations
            ? Object.entries(node.animations)
                .map(([animationName, keyframes]) => {
                  // Animation names are stored by their hash, so no need to render them more than once.
                  if (animationHashes.has(animationName)) {
                    return ''
                  }
                  animationHashes.add(animationName)
                  return `
                  @keyframes ${animationName} {
                    ${Object.values(keyframes)
                      .sort((a, b) => a.position - b.position)
                      .map(({ key, position, value }) => {
                        return `
                        ${position * 100}% {
                          ${key}: ${value};
                        }
                        `
                      })
                      .join('\n')}
                  }
                  `
                })
                .join('\n')
            : ''
        }
      `
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      return ''
    }
  }

  // Make sure that CSS for dependencies are rendered first so that instance styles can override
  const visitedComponents = new Set<string>()
  function insertComponentStyles(
    component: Component,
    package_name?: string,
  ): string | undefined {
    if (visitedComponents.has(component.name)) {
      return
    }
    visitedComponents.add(component.name)
    if (!component.nodes) {
      // eslint-disable-next-line no-console
      console.warn('Unable to find nodes for component', component.name)
      return
    }
    Object.entries(component.nodes).forEach(([id, node]) => {
      if (node.type === 'component') {
        const childComponent = components.find(
          (c) =>
            c.name ===
            [node.package ?? package_name, node.name]
              .filter((c) => c)
              .join('/'),
        )
        if (childComponent) {
          insertComponentStyles(childComponent, node.package ?? package_name)
          stylesheet += getNodeStyles(
            node as any,
            toValidClassName(`${component.name}:${id}`, true),
          )

          return
        }
      }
      if (node.type !== 'element') {
        return
      }
      const classHash = getClassName([node.style, node.variants])
      if (hashes.has(classHash)) {
        return ''
      }
      hashes.add(classHash)
      stylesheet += getNodeStyles(node as any, classHash)
    })
  }
  insertComponentStyles(root)

  return stylesheet
}

export const getAllFonts = (components: Component[]) => {
  return new Set(
    components
      .flatMap((component) => {
        return Object.values(component.nodes).flatMap((node) => {
          if (node.type === 'element') {
            return [
              node.style.fontFamily,
              node.style['font-family'],
              ...(node.variants?.map(
                (v) => v.style.fontFamily ?? v.style['font-family'],
              ) ?? []),
            ].filter(isDefined)
          }
          return []
        })
      })
      .map((f) => f.replace('var(', '').replace(')', '').replace(/'/g, '')),
  )
}
