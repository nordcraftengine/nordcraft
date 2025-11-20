import type { Rule } from '../../../types'

const REGEX = /var\(\s*(--[\w-]+)/g

export const noReferenceGlobalCSSVariableRule: Rule<{
  name: string
}> = {
  code: 'no-reference global css variable',
  level: 'warning',
  category: 'No References',
  visit: (report, { path, value, nodeType, files, memo }) => {
    if (nodeType !== 'project-theme-property') {
      return
    }

    const theme = files.themes?.Default
    if (!theme) {
      return
    }

    const usedCSSVariablesInComponents = memo(
      'css-variables-used-in-components',
      () => {
        const vars = new Set<string>()
        Object.entries(files.components).forEach(([_, component]) => {
          Object.values(component?.nodes ?? {}).forEach((node) => {
            if (node.type === 'element' || node.type === 'component') {
              ;[{ style: node.style }, ...(node.variants ?? [])].forEach(
                ({ style }) => {
                  Object.values(style ?? {}).forEach((styleValue) => {
                    if (typeof styleValue !== 'string') {
                      return
                    }
                    styleValue.matchAll(REGEX).forEach(([_, varName]) => {
                      vars.add(varName)
                    })
                  })
                },
              )
            }
          })
        })

        return vars
      },
    )

    const usedCSSVariablesInCSSVariables = memo(
      'css-variables-used-in-css-variables',
      () => {
        const vars = new Set<string>()
        Object.values(theme.propertyDefinitions ?? {}).forEach((propDef) => {
          ;[...Object.values(propDef.values), propDef.initialValue].forEach(
            (val) => {
              if (typeof val !== 'string') {
                return
              }

              val.matchAll(REGEX).forEach(([_, varName]) => {
                vars.add(varName)
              })
            },
          )
        })

        return vars
      },
    )

    if (
      usedCSSVariablesInCSSVariables.has(value.key) ||
      usedCSSVariablesInComponents.has(value.key)
    ) {
      return
    }
    report(path, { name: value.key })
  },
}
