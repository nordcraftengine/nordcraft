import type { RouteDeclaration } from '@nordcraft/core/dist/component/component.types'
import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import type { Rule } from '../../../types'

export const duplicateRouteRule: Rule<{
  name: string
  type: 'route' | 'page'
  duplicates: Array<{ name: string; type: 'route' | 'page' }>
}> = {
  code: 'duplicate route',
  level: 'warning',
  category: 'Quality',
  visit: (report, args) => {
    const { nodeType, value, files, memo, path } = args
    if (nodeType !== 'component' || !isPageComponent(value)) {
      return
    }
    const getRouteKey = (route: RouteDeclaration['path']) =>
      route.reduce(
        (acc, part) => `${acc}/${part.type === 'static' ? part.name : '*'}`,
        '/',
      )
    const allRoutes = memo('allRoutes', () => {
      const routes = new Map<string, string[]>()
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      Object.entries(files.components ?? {}).map(
        ([component, componentValue]) => {
          if (componentValue && isPageComponent(componentValue)) {
            const key = getRouteKey(componentValue.route.path)
            const existing = routes.get(key)
            if (existing) {
              existing.push(component)
            } else {
              routes.set(key, [component])
            }
          }
        },
      )
      return routes
    })
    const match = allRoutes.get(getRouteKey(value.route?.path))
    if (match && match.length > 1) {
      const duplicates = match
        .filter((m) => m !== value.name)
        .map((name) => ({ name, type: 'page' as const }))
      report({
        path: [...path, 'route', 'path'],
        info: {
          title: 'Duplicate route declaration',
          description: `The page **${
            value.name
          }** has the same route/path declared as the pages/routes below. Route declarations must be unique.${duplicates
            .map((d) => `\n- ${d.name} (${d.type})`)
            .join('')}`,
        },
        details: {
          name: value.name,
          type: 'page',
          duplicates,
        },
      })
    }
  },
}
