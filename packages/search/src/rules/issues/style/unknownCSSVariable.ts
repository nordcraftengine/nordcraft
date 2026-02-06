import type { Rule } from '../../../types'

const REGEX = /var\(\s*(--[\w-]+)/g

export const unknownCSSVariableRule: Rule<{
  name: string
}> = {
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

    const allCssVariableDeclarations = memo(
      `all-css-variables-declarations`,
      () => {
        const cssVariableKeys = new Set(
          Object.keys(theme.propertyDefinitions ?? {}),
        )
        Object.values(files.components ?? {}).forEach((component) => {
          Object.keys(component?.nodes ?? {}).forEach((nodeKey) => {
            const node = component?.nodes?.[nodeKey]
            if (!node) {
              return
            }

            if (node.type === 'component' || node.type === 'element') {
              Object.keys(node.customProperties ?? {}).forEach((varName) => {
                cssVariableKeys.add(varName)
              })
              Object.values(node.variants ?? {}).forEach((variant) => {
                Object.keys(variant.customProperties ?? {}).forEach(
                  (varName) => {
                    cssVariableKeys.add(varName)
                  },
                )
              })

              // Also add legacy style variables
              if (node.type === 'element' && node['style-variables']) {
                node['style-variables'].forEach((styleVar) => {
                  cssVariableKeys.add(`--${styleVar.name}`)
                })
              }

              // Add if declared in any parent styles object
              Object.keys(node.style ?? {}).forEach((styleKey) => {
                if (styleKey.startsWith('--')) {
                  cssVariableKeys.add(styleKey)
                }
              })
              Object.values(node.variants ?? {}).forEach((variant) => {
                Object.keys(variant.style ?? {}).forEach((styleKey) => {
                  if (styleKey.startsWith('--')) {
                    cssVariableKeys.add(styleKey)
                  }
                })
              })
            }
          })
        })
        return cssVariableKeys
      },
    )

    for (const varName of vars) {
      if (allCssVariableDeclarations.has(varName) === false) {
        report({
          path,
          info: {
            title: `Unknown CSS variable`,
            description: `The CSS variable **${varName}** is not declared in any parent element or in your theme. The CSS variable must be declared in an ancestor element in its component or in your global theme.`,
          },
          details: { name: varName },
        })
      }
    }
  },
}
