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
        report(path, { name: varName })
      }
    }
  },
}
