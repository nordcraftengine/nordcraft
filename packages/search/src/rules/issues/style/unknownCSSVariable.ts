import type { CustomPropertyDefinition } from '@nordcraft/core/dist/styling/theme'
import type { FixFunction, Rule, StyleNode } from '../../../types'

const REGEX = /var\(\s*(--[\w-]+)/g

export const unknownCSSVariableRule: Rule<
  {
    name: string
  },
  StyleNode
> = {
  code: 'unknown css variable',
  level: 'warning',
  category: 'Unknown Reference',
  visit: (report, { path, value, nodeType, files, memo }) => {
    if (
      nodeType !== 'style-declaration' ||
      typeof value.styleValue !== 'string'
    ) {
      return
    }

    const theme = files.themes?.Default
    // Issue rule only available for projects using v2 themes
    if (theme?.propertyDefinitions === undefined) {
      return
    }

    // Has a style property definition
    const vars = [...value.styleValue.toString().matchAll(REGEX)].map(
      ([_, varName]) => varName,
    )
    if (vars.length === 0) {
      return
    }

    const themeCssVariables = theme.propertyDefinitions
    const [_fileType, componentName, _nodes, nodeName] = path
    const localCssVariables = memo(
      `component-css-variables-${componentName}-${nodeName}`,
      () => {
        const vars = new Set<string>()
        const component = files.components[componentName]
        if (!component) {
          return vars
        }

        const visitVars = (nodeName: string) => {
          const node = component?.nodes?.[nodeName]
          if (!node) {
            return
          }

          if (node.type === 'component' || node.type === 'element') {
            Object.keys(node.customProperties ?? {}).forEach((varName) => {
              vars.add(varName)
            })
            Object.values(node.variants ?? {}).forEach((variant) => {
              Object.keys(variant.customProperties ?? {}).forEach((varName) => {
                vars.add(varName)
              })
            })

            // Also add legacy style variables
            if (node.type === 'element' && node['style-variables']) {
              node['style-variables'].forEach((styleVar) => {
                vars.add(`--${styleVar.name}`)
              })
            }

            // Add if declared in any parent styles object
            Object.keys(node.style ?? {}).forEach((styleKey) => {
              if (styleKey.startsWith('--')) {
                vars.add(styleKey)
              }
            })
            Object.values(node.variants ?? {}).forEach((variant) => {
              Object.keys(variant.style ?? {}).forEach((styleKey) => {
                if (styleKey.startsWith('--')) {
                  vars.add(styleKey)
                }
              })
            })
          }

          const parent = Object.entries(component.nodes ?? {}).find(([_, n]) =>
            n.children?.includes(nodeName),
          )
          if (parent) {
            visitVars(parent[0])
          }
        }

        visitVars(nodeName.toString())
        return vars
      },
    )

    for (const varName of vars) {
      if (!(varName in themeCssVariables) && !localCssVariables.has(varName)) {
        report({
          path,
          info: {
            title: `Unknown CSS variable`,
            description: `The CSS variable **${varName}** is not declared in any parent element or theme. CSS variables must be declared in an ancestor element or in your global theme.`,
          },
          details: { name: varName },
          fixes: ['add-to-theme'],
        })
      }
    }
  },
  fixes: {
    'add-to-theme': addToThemeFix,
  },
}

export type AddToThemeFix = 'add-to-theme'

function addToThemeFix(
  args: Parameters<FixFunction<StyleNode, { name: string }>>[0],
): ReturnType<FixFunction<StyleNode, { name: string }>> {
  const varName = args.details?.name
  if (typeof varName !== 'string' || !args.data.files.themes?.Default) {
    return args.data.files
  }

  const definition: CustomPropertyDefinition = {
    syntax: {
      type: 'primitive',
      name: '*',
    },
    inherits: true,
    initialValue: '',
    values: {},
    description: '',
  } as const

  // Add the variable to the theme with Any (*) syntax type
  return {
    ...args.data.files,
    themes: {
      ...args.data.files.themes,
      Default: {
        ...args.data.files.themes.Default,
        propertyDefinitions: {
          ...args.data.files.themes.Default.propertyDefinitions,
          [varName]: definition,
        },
      },
    },
  }
}
