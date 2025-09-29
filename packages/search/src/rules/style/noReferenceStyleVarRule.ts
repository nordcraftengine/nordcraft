import type { StyleTokenGroup } from '@nordcraft/core/dist/styling/theme'
import type { Rule } from '../../types'

const VAR_REGEX = /var\((--[a-zA-Z0-9-_]+)\)/g

export const noReferenceStyleVarRule: Rule<{
  key: string
  value: string
}> = {
  code: 'no-reference style-var',
  level: 'warning',
  category: 'No References',
  visit: (report, { nodeType, value, path, files, memo }) => {
    if (nodeType !== 'style-declaration') {
      return
    }

    const themeVars = memo('theme-vars', () => {
      const vars = new Set<string>()
      Object.values(files.themes ?? {}).forEach((theme) => {
        Object.keys(theme.propertyDefinitions ?? {}).forEach((key) =>
          vars.add(key),
        )

        // Legacy theme support
        Object.entries(theme)
          .filter(
            ([key, value]) =>
              Array.isArray(value) &&
              [
                'color',
                'fonts',
                'font-size',
                'font-weight',
                'spacing',
                'border-radius',
                'shadow',
                'z-index',
              ].includes(key),
          )
          .forEach(([_, value]) => {
            ;(value as StyleTokenGroup[]).forEach((group) => {
              group.tokens.forEach((token) => {
                vars.add(`--${token.name}`)
              })
            })
          })
      })

      return vars
    })

    const elementVars = memo('element-vars', () => {
      const vars = new Set<string>()
      Object.values(files.components).forEach((component) => {
        Object.values(component?.nodes ?? {}).forEach((node) => {
          if (node.type !== 'element' && node.type !== 'component') {
            return
          }

          Object.keys(node.customProperties ?? {}).forEach((key) => {
            vars.add(key)
          })
          if (
            'style-variables' in node &&
            Array.isArray(node['style-variables'])
          ) {
            node['style-variables'].forEach((sv) => {
              vars.add(`--${sv.name}`)
            })
          }
        })
      })

      return vars
    })

    if (value.styleValue.includes('var(--')) {
      const varName = VAR_REGEX.exec(value.styleValue)?.[1]
      if (!varName) {
        return
      }
      if (themeVars.has(varName) || elementVars.has(varName)) {
        return
      }

      report(path, { key: value.styleProperty, value: value.styleValue })
    }
  },
}

export type InvalidStyleSyntaxRuleFix = 'delete-style-property'
