import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ComponentNode, IssueRule } from '../../../types'

export const duplicateUrlParameterRule: IssueRule<
  { name: string },
  ComponentNode
> = {
  code: 'duplicate url parameter',
  level: 'warning',
  category: 'Quality',
  nodeTypes: 'component',
  visit: (report, { path, value }) => {
    if (
      !isDefined(value.route) ||
      !isDefined(value.route.path) ||
      !isDefined(value.route.query)
    ) {
      return
    }
    const pathNames = new Set<string>()
    value.route.path.forEach((p, i) => {
      if (pathNames.has(p.name)) {
        report({
          path: [...path, 'route', 'path', i],
          info: {
            title: 'Duplicate URL parameter',
            description: `**${p.name}** appears multiple times in the path/query parameters. This may lead to unexpected behavior. Consider consolidating them into a single parameter or renaming them.`,
          },
          details: { name: p.name },
        })
      }
      pathNames.add(p.name)
    })
    Object.keys(value.route.query).forEach((key) => {
      if (pathNames.has(key)) {
        report({
          path: [...path, 'route', 'query', key],
          info: {
            title: 'Duplicate URL parameter',
            description: `**${key}** appears multiple times in the path/query parameters. This may lead to unexpected behavior. Consider consolidating them into a single parameter or renaming them.`,
          },
          details: { name: key },
        })
      }
    })
  },
}
