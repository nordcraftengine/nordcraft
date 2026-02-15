import { parse } from 'postcss'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const invalidStyleSyntaxRule: Rule<{
  property: string
}> = {
  code: 'invalid style syntax',
  level: 'error',
  category: 'Quality',
  visit: (report, { nodeType, value, path, memo }) => {
    if (nodeType !== 'style-declaration') {
      return
    }

    // Check for variable/formula references: Variables., Formulas., Event., Attributes., Apis., Parameters., ListItem., URLParameters.
    if (typeof value.styleValue === 'string') {
      const hasVariableReference =
        /\b(Variables|Formulas|Event|Attributes|Apis|Parameters|ListItem|URLParameters)\.\w+/i.test(
          value.styleValue,
        )
      if (hasVariableReference) {
        report({
          path,
          info: {
            title: `Formulas detected in style declaration`,
            description: `The style declaration for the property "${value.styleProperty}" contains Nordcraft formula syntax (e.g., references like "Variables.xxx", "Event.xxx", "Attributes.xxx", etc.). Formulas should not be used directly in CSS style values. Use style-variables or computed styles instead.`,
          },
          details: { property: value.styleProperty },
          fixes: ['delete-style-property'],
        })
        return
      }
    }

    const valid = memo(
      `valid-style-${value.styleProperty}:${value.styleValue}`,
      () => {
        try {
          parse(`${value.styleProperty}: ${value.styleValue}`)
          return true
        } catch {
          return false
        }
      },
    )
    if (!valid) {
      report({
        path,
        info: {
          title: `Invalid style declaration`,
          description: `The style declaration for the property "${value.styleProperty}" is invalid. This can lead to unforeseen styling behavior across other elements. Please fix the style declaration or remove it.`,
        },
        details: { property: value.styleProperty },
        fixes: ['delete-style-property'],
      })
    }
  },
  fixes: {
    'delete-style-property': removeFromPathFix,
  },
}

export type InvalidStyleSyntaxRuleFix = 'delete-style-property'
