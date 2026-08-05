import type { SearchRule } from '../../types'
import { matchAndSplitWildcard } from '../../util/matchWildcard'
import { getFormulaPathContext } from '../../util/searchContext'

const FORMULA_REF_REGEX = /^ref:formula:\s*(.+)$/i

export function shouldRun(query: string): boolean {
  const trimmed = query.trim()
  if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
    return false
  }
  return FORMULA_REF_REGEX.test(trimmed)
}

export function createFormulaRefSearchRule({
  query,
}: {
  query: string
}): SearchRule {
  const match = query.trim().match(FORMULA_REF_REGEX)
  const pattern = match ? match[1] : ''

  return {
    visit: (report, { path, value, nodeType, files }) => {
      if (nodeType === 'formula') {
        if (value.type === 'apply' && value.name) {
          const split = matchAndSplitWildcard(value.name, pattern)
          if (split) {
            report({
              path,
              details: {
                nodeType: 'formula',
                context: {
                  before: getFormulaPathContext(path, files) + split.before,
                  matched: split.matched,
                  after: split.after,
                },
              },
            })
          }
        } else if (value.type === 'function' && value.name) {
          const split = matchAndSplitWildcard(value.name, pattern)
          if (split) {
            report({
              path,
              details: {
                nodeType: 'formula',
                context: {
                  before: getFormulaPathContext(path, files) + split.before,
                  matched: split.matched,
                  after: split.after,
                },
              },
            })
          }
        } else if (
          value.type === 'path' &&
          value.path?.[0] === 'Contexts' &&
          value.path?.[2]
        ) {
          const contextFormulaName = value.path[2]
          const split = matchAndSplitWildcard(
            String(contextFormulaName),
            pattern,
          )
          if (split) {
            report({
              path,
              details: {
                nodeType: 'formula',
                context: {
                  before: getFormulaPathContext(path, files) + split.before,
                  matched: split.matched,
                  after: split.after,
                },
              },
            })
          }
        }
      } else if (nodeType === 'component-context') {
        if (Array.isArray(value.formulas)) {
          for (const f of value.formulas) {
            const split = matchAndSplitWildcard(f, pattern)
            if (split) {
              report({
                path,
                details: {
                  nodeType: 'component-context',
                  context: {
                    before: getFormulaPathContext(path, files) + split.before,
                    matched: split.matched,
                    after: split.after,
                  },
                },
              })
              break // report once of the context is standard
            }
          }
        }
      }
    },
  }
}
