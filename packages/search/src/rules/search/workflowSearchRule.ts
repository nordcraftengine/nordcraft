import type { SearchRule } from '../../types'
import { matchAndSplitWildcard } from '../../util/matchWildcard'

const WORKFLOW_REGEX = /^workflow:\s*(.+)$/i

export function shouldRun(query: string): boolean {
  const trimmed = query.trim()
  if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
    return false
  }
  return WORKFLOW_REGEX.test(trimmed)
}

export function createWorkflowSearchRule({
  query,
}: {
  query: string
}): SearchRule {
  const match = query.trim().match(WORKFLOW_REGEX)
  const pattern = match ? match[1] : ''

  return {
    visit: (report, { path, value, nodeType }) => {
      if (nodeType !== 'component-workflow') {
        return
      }

      const workflowName = value.name ?? (path[path.length - 1] as string)
      if (workflowName) {
        const split = matchAndSplitWildcard(workflowName, pattern)
        if (split) {
          report({
            path,
            details: {
              nodeType: 'component-workflow',
              context: split,
            },
          })
        }
      }
    },
  }
}
