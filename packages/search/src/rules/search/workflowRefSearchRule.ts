import type { SearchRule } from '../../types'
import { matchAndSplitWildcard } from '../../util/matchWildcard'

const WORKFLOW_REF_REGEX = /^ref:workflow:\s*(.+)$/i

export function shouldRun(query: string): boolean {
  const trimmed = query.trim()
  if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
    return false
  }
  return WORKFLOW_REF_REGEX.test(trimmed)
}

export function createWorkflowRefSearchRule({
  query,
}: {
  query: string
}): SearchRule {
  const match = query.trim().match(WORKFLOW_REF_REGEX)
  const pattern = match ? match[1] : ''

  return {
    visit: (report, { path, value, nodeType }) => {
      if (nodeType === 'action-model') {
        if (value.type === 'TriggerWorkflow' && value.workflow) {
          const split = matchAndSplitWildcard(value.workflow, pattern)
          if (split) {
            const workflowName = path[3] as string
            const beforeContext = workflowName
              ? `workflows > ${workflowName} > `
              : 'workflows > '
            report({
              path,
              details: {
                nodeType: 'action-model',
                context: {
                  before: beforeContext + split.before,
                  matched: split.matched,
                  after: split.after,
                },
              },
            })
          }
        }
      } else if (nodeType === 'component-context') {
        if (Array.isArray(value.workflows)) {
          for (const w of value.workflows) {
            const split = matchAndSplitWildcard(w, pattern)
            if (split) {
              const contextName = path[3] as string
              const beforeContext = contextName
                ? `contexts > ${contextName} > `
                : 'contexts > '
              report({
                path,
                details: {
                  nodeType: 'component-context',
                  context: {
                    before: beforeContext + split.before,
                    matched: split.matched,
                    after: split.after,
                  },
                },
              })
              break // inside find context, reporting once of the container is standard
            }
          }
        }
      }
    },
  }
}
