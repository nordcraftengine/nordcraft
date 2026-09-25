import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import type { SearchRule } from '../../types'
import { matchAndSplitWildcard } from '../../util/matchWildcard'
import { getNodeAncestorsContext } from '../../util/searchContext'

const COMPONENT_REF_REGEX = /^ref:component:\s*(.+)$/i

export function shouldRun(query: string): boolean {
  const trimmed = query.trim()
  if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
    return false
  }
  return COMPONENT_REF_REGEX.test(trimmed)
}

export function createComponentRefSearchRule({
  query,
}: {
  query: string
}): SearchRule {
  const match = query.trim().match(COMPONENT_REF_REGEX)
  const pattern = match ? match[1] : ''

  return {
    visit: (report, { path, value, nodeType, files }) => {
      if (nodeType !== 'component-node') {
        return
      }

      if (value?.type === 'component' && value?.name) {
        const split = matchAndSplitWildcard(value.name, pattern)
        if (split) {
          const componentName = path[1] as string
          const componentObj = files?.components?.[componentName]
          const nodes = componentObj?.nodes
          const nodeId = path[3] as string
          const ancestors = getNodeAncestorsContext(nodes, nodeId)
          const mappedAncestors = ancestors.map(printNodeDescriptor).join(' > ')
          const beforeContext = mappedAncestors ? `${mappedAncestors} > ` : ''

          report({
            path,
            details: {
              nodeType: 'component-node',
              context: {
                before: beforeContext + split.before,
                matched: split.matched,
                after: split.after,
              },
            },
          })
        }
      }
    },
  }
}

const printNodeDescriptor = (node: NodeModel): string => {
  switch (node.type) {
    case 'element': {
      const classes = Object.entries(node.classes ?? {})
        .filter(
          ([_, c]) =>
            !c.formula ||
            (c.formula.type === 'value' && c.formula.value === true),
        )
        .map(([className]) => className)
      return `${node.tag}${classes.length > 0 ? `.${classes.join('.')}` : ''}`
    }
    case 'component':
      return node.name
    default:
      return node.type
  }
}
