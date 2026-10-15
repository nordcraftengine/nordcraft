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

    const collectVarRefs = (styleValue: string, vars: Set<string>) => {
      // Fast path: most style values reference no variables at all.
      if (!styleValue.includes('var(')) {
        return
      }
      for (const match of styleValue.matchAll(REGEX)) {
        vars.add(match[1])
      }
    }

    const usedCSSVariablesInComponents = memo(
      'css-variables-used-in-components',
      () => {
        const vars = new Set<string>()
        for (const component of Object.values(files.components)) {
          for (const node of Object.values(component?.nodes ?? {})) {
            if (node?.type === 'element' || node?.type === 'component') {
              const styles = [node.style]
              for (const variant of node.variants ?? []) {
                styles.push(variant.style)
              }
              for (const style of styles) {
                if (!style) {
                  continue
                }
                for (const styleValue of Object.values(style)) {
                  if (typeof styleValue === 'string') {
                    collectVarRefs(styleValue, vars)
                  }
                }
              }
            }
          }
        }

        return vars
      },
    )

    const usedCSSVariablesInPackageComponents = memo(
      'css-variables-used-in-package-components',
      () => {
        const vars = new Set<string>()
        for (const pkg of Object.values(files.packages ?? {})) {
          for (const component of Object.values(pkg?.components ?? {})) {
            for (const node of Object.values(component?.nodes ?? {})) {
              if (node?.type === 'element' || node?.type === 'component') {
                const styles = [node.style]
                for (const variant of node.variants ?? []) {
                  styles.push(variant.style)
                }
                for (const style of styles) {
                  if (!style) {
                    continue
                  }
                  for (const styleValue of Object.values(style)) {
                    if (typeof styleValue === 'string') {
                      collectVarRefs(styleValue, vars)
                    }
                  }
                }
              }
            }
          }
        }

        return vars
      },
    )

    const usedCSSVariablesInCSSVariables = memo(
      'css-variables-used-in-css-variables',
      () => {
        const vars = new Set<string>()
        for (const propDef of Object.values(theme.propertyDefinitions ?? {})) {
          if (!isDefined(propDef)) {
            continue
          }
          for (const val of Object.values(propDef.values ?? {})) {
            if (typeof val === 'string') {
              collectVarRefs(val, vars)
            }
          }
          if (typeof propDef.initialValue === 'string') {
            collectVarRefs(propDef.initialValue, vars)
          }
        }

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
