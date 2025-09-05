import { parse } from 'postcss'
import type { Rule } from '../../types'
import { removeFromPathFix } from '../../util/removeUnused.fix'

export const invalidStyleSyntaxRule: Rule<{
  property: string
}> = {
  code: 'invalid style syntax',
  level: 'error',
  category: 'Quality',
  visit: (report, { nodeType, value, path }) => {
    if (nodeType !== 'style') {
      return
    }
    for (const [prop, val] of Object.entries(value.style)) {
      try {
        parse(`${prop}: ${val}`)
      } catch {
        report([...path, prop], { property: prop }, ['delete style property'])
      }
    }
  },
  fixes: {
    'delete style property': removeFromPathFix,
  },
}

export type InvalidStyleSyntaxRuleFix = 'delete style property'
