import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { IssueRule, ProjectThemePropertyNode } from '../../../types'

const REGEX = /var\(\s*(--[\w-]+)/g

export const noReferenceGlobalCSSVariableRule: IssueRule<
  {
    name: string
  },
  ProjectThemePropertyNode
> = {
  code: 'no-reference global css variable',
  level: 'info',
  category: 'No References',
  nodeTypes: 'project-theme-property',
  visit: (report, { path, value, files, memo }) => {
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
            if (node?.type === 'element' || node?.type === 'component') {
              ;[{ style: node.style }, ...(node.variants ?? [])].forEach(
                ({ style }) => {
                  Object.values(style ?? {}).forEach((styleValue) => {
                    if (typeof styleValue === 'string') {
                      styleValue.matchAll(REGEX).forEach(([_, varName]) => {
                        vars.add(varName)
                      })
                    }
                  })
                },
              )
            }
          })
        })

        return vars
      },
    )

    const usedCSSVariablesInPackageComponents = memo(
      'css-variables-used-in-package-components',
      () => {
        const vars = new Set<string>()
        Object.values(files.packages ?? {}).forEach((pkg) => {
          Object.values(pkg?.components ?? {}).forEach((component) => {
            Object.values(component?.nodes ?? {}).forEach((node) => {
              if (node?.type === 'element' || node?.type === 'component') {
                ;[{ style: node.style }, ...(node.variants ?? [])].forEach(
                  ({ style }) => {
                    Object.values(style ?? {}).forEach((styleValue) => {
                      if (typeof styleValue === 'string') {
                        styleValue.matchAll(REGEX).forEach(([_, varName]) => {
                          vars.add(varName)
                        })
                      }
                    })
                  },
                )
              }
            })
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
          if (!isDefined(propDef)) {
            return
          }
          ;[
            ...Object.values(propDef.values ?? {}),
            propDef.initialValue,
          ].forEach((val) => {
            if (typeof val === 'string') {
              val.matchAll(REGEX).forEach(([_, varName]) => {
                vars.add(varName)
              })
            }
          })
        })

        return vars
      },
    )

    if (
      usedCSSVariablesInCSSVariables.has(value.key) ||
      usedCSSVariablesInComponents.has(value.key) ||
      usedCSSVariablesInPackageComponents.has(value.key)
    ) {
      return
    }
    report({
      path,
      info: {
        title: `Unused CSS variable`,
        description: `**${value.key}** is never used in any style or other CSS variable. Consider removing it.`,
      },
      details: { name: value.key },
    })
  },
}
