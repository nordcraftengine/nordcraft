import type { SearchRule } from '../../types'
import { matchAndSplitWildcard } from '../../util/matchWildcard'

const COMPONENT_REGEX = /^component:\s*(.+)$/i

export function shouldRun(query: string): boolean {
  const trimmed = query.trim()
  if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
    return false
  }
  return COMPONENT_REGEX.test(trimmed)
}

export function createComponentSearchRule({
  query,
}: {
  query: string
}): SearchRule {
  const match = query.trim().match(COMPONENT_REGEX)
  const pattern = match ? match[1] : ''

  return {
    visit: (report, { path, value, nodeType }) => {
      if (nodeType !== 'component') {
        return
      }

      const componentName = value.name || (path[1] as string)
      if (componentName) {
        const split = matchAndSplitWildcard(componentName, pattern)
        if (split) {
          report({
            path,
            details: {
              nodeType: 'component',
              context: split,
            },
          })
        }
      }
    },
  }
}
