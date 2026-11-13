import type { SearchRule } from '../../types'
import { matchAndSplitWildcard } from '../../util/matchWildcard'

const FORMULA_REGEX = /^formula:\s*(.+)$/i

export function shouldRun(query: string): boolean {
  const trimmed = query.trim()
  if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
    return false
  }
  return FORMULA_REGEX.test(trimmed)
}

export function createFormulaSearchRule({
  query,
}: {
  query: string
}): SearchRule {
  const match = query.trim().match(FORMULA_REGEX)
  const pattern = match ? match[1] : ''

  return {
    visit: (report, { path, value, nodeType }) => {
      if (nodeType === 'component-formula') {
        const formulaName = value.name || (path[path.length - 1] as string)
        if (formulaName) {
          const split = matchAndSplitWildcard(formulaName, pattern)
          if (split) {
            report({
              path,
              details: {
                nodeType: 'component-formula',
                context: split,
              },
            })
          }
        }
      } else if (nodeType === 'project-formula') {
        const formulaName = value.name || (path[path.length - 1] as string)
        if (formulaName) {
          const split = matchAndSplitWildcard(formulaName, pattern)
          if (split) {
            report({
              path,
              details: {
                nodeType: 'project-formula',
                context: split,
              },
            })
          }
        }
      }
    },
  }
}
