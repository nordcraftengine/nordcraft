import type {
  Component,
  ComponentNodeModel,
  ElementNodeModel,
  NodeStyleModel,
} from '@nordcraft/core/dist/component/component.types'
import {
  getClassName,
  toValidClassName,
} from '@nordcraft/core/dist/styling/className'
import { kebabCase } from '@nordcraft/core/dist/styling/style.css'
import { variantSelector } from '@nordcraft/core/dist/styling/variantSelector'
import { omitKeys } from '@nordcraft/core/dist/utils/collections'

const LEGACY_BREAKPOINTS = {
  large: 1440,
  small: 576,
  medium: 960,
}

export const SIZE_PROPERTIES = new Set([
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
  'left',
  'right',
  'top',
  'bottom',
  'outline-width',
])

export const insertStyles = (
  parent: HTMLElement,
  root: Component,
  components: Component[],
) => {
  const getNodeStyles = (
    node: ElementNodeModel | ComponentNodeModel,
    classHash: string,
  ) => {
    const style = omitKeys(node.style ?? {}, [
      'variants',
      'breakpoints',
      'mediaQuery',
      'shadows',
    ])

    const styleElem = document.createElement('style')
    styleElem.setAttribute('data-hash', classHash)
    styleElem.appendChild(
      document.createTextNode(`
    ${renderVariant('.' + classHash, style)}

${
  node.variants
    ? node.variants
        .map((variant) => {
          const selector = `.${classHash}${variantSelector(variant)}`
          const renderedVariant = renderVariant(selector, variant.style, {
            startingStyle: variant.startingStyle ?? false,
          })
          return variant.mediaQuery
            ? `
                @media (${Object.entries(variant.mediaQuery)
                  .filter(([_, value]) => isDefined(value))
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(') and (')}) {
                ${renderedVariant}
                }
                `
            : variant.breakpoint
              ? `
                @media (min-width: ${
                  LEGACY_BREAKPOINTS[variant.breakpoint]
                }px) {
                ${renderedVariant}
                }
                `
              : renderedVariant
        })
        .join('\n')
    : ''
}

${
  node.animations
    ? Object.entries(node.animations)
        .map(([animationName, keyframes]) => {
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
}`),
    )
    return styleElem
  }

  // Make sure that CSS for dependant components are rendered first so that instance styles will override.
  const visitedComponents = new Set<string>()
  const newStyles = new Map<string, Element>()
  function insertComponentStyles(
    component: Component,
    package_name: string | undefined,
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
              ?.filter((n) => n)
              .join('/'),
        )
        if (childComponent) {
          insertComponentStyles(childComponent, node.package ?? package_name)

          const instanceClassHash = toValidClassName(
            `${component.name}:${id}`,
            true,
          )
          newStyles.set(
            instanceClassHash,
            getNodeStyles(node, instanceClassHash),
          )
        }
      } else if (node.type === 'element') {
        const classHash = getClassName([node.style, node.variants])
        newStyles.set(classHash, getNodeStyles(node, classHash))
      }
    })
  }

  insertComponentStyles(root, undefined)

  // Remove old styles.
  // We do not keep track of changes, so must remove all and re-add as order matters.
  parent.querySelectorAll('[data-hash]').forEach((node) => node.remove())

  // Add new styles
  const fragment = document.createDocumentFragment()
  newStyles.forEach((style) => {
    fragment.appendChild(style)
  })
  parent.appendChild(fragment)
}

const renderVariant = (
  selector: string,
  style: NodeStyleModel,
  options?: {
    startingStyle?: boolean
  },
) => {
  const scrollbarStyles = Object.entries(style).filter(
    ([key]) => key === 'scrollbar-width',
  )

  let styles = styleToCss(style)
  if (options?.startingStyle) {
    styles = `@starting-style {
      ${styles}
    }`
  }

  return `
  ${selector} {
    ${styles}
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
          case 'thin':
            return 'width:4px;'
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

export const styleToCss = (style: NodeStyleModel) => {
  return Object.entries(style)
    .map(([property, value]) => {
      const propertyName = kebabCase(property)
      const propertyValue =
        String(Number(value)) === String(value) &&
        SIZE_PROPERTIES.has(propertyName)
          ? `${Number(value) * 4}px`
          : value
      return `${propertyName}:${propertyValue};`
    })
    .join('\n')
}
