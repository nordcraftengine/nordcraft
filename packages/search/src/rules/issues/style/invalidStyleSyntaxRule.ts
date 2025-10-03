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
      report(path, { property: value.styleProperty }, ['delete-style-property'])
    }
  },
  fixes: {
    'delete-style-property': removeFromPathFix,
  },
}

export type InvalidStyleSyntaxRuleFix = 'delete-style-property'
