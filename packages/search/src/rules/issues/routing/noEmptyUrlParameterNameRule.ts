import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { IssueRule } from '../../../types'

export const noEmptyUrlParameterNameRule: IssueRule<{
  name: string
}> = {
  code: 'no-empty url parameter name',
  level: 'warning',
  category: 'Quality',
  visit: (report, { path, value, nodeType }) => {
    if (
      nodeType !== 'component' ||
      !isDefined(value.route) ||
      !isDefined(value.route.path) ||
      !isDefined(value.route.query)
    ) {
      return
    }
    value.route.path.forEach((p, i) => {
      if (!isDefined(p.name) || p.name.trim() === '') {
        report({
          path: [...path, 'route', 'path', i],
          info: {
            title: 'Empty URL parameter name',
            description: `The URL path parameter name at index ${i} is empty. This may lead to unexpected behavior. Consider providing a valid name for the parameter.`,
          },
          details: { name: p.name },
        })
      }
    })
    Object.entries(value.route.query).forEach(([key, value]) => {
      if (!isDefined(value.name) || value.name.trim() === '') {
        report({
          path: [...path, 'route', 'query', key],
          info: {
            title: 'Empty URL parameter name',
            description: `The URL query parameter name **${value.name}** is empty. This may lead to unexpected behavior. Consider providing a valid name for the parameter.`,
          },
          details: { name: value.name },
        })
      }
    })
  },
}
