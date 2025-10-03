import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'

export const duplicateUrlParameterRule: Rule<{ name: string }> = {
  code: 'duplicate url parameter',
  level: 'warning',
  category: 'Quality',
  visit: (report, { nodeType, path, value }) => {
    if (
      nodeType !== 'component' ||
      !isDefined(value.route) ||
      !isDefined(value.route.path) ||
      !isDefined(value.route.query)
    ) {
      return
    }
    const pathNames = new Set<string>()
    value.route.path.forEach((p, i) => {
      if (pathNames.has(p.name)) {
        report([...path, 'route', 'path', i], { name: p.name })
      }
      pathNames.add(p.name)
    })
    Object.keys(value.route.query).forEach((key) => {
      if (pathNames.has(key)) {
        report([...path, 'route', 'query', key], { name: key })
      }
    })
  },
}
