import { getUrl } from '@nordcraft/core/dist/api/api'
import type {
  PageComponent,
  PageRoute,
  RouteDeclaration,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import {
  getParameters,
  getServerToddleObject,
} from '../rendering/formulaContext'
import type { ProjectFiles, Route } from '../ssr.types'

export const matchPageForUrl = ({
  url,
  components,
}: {
  url: URL
  components: Partial<Record<string, { route?: RouteDeclaration | null }>>
}) =>
  matchRoutes({
    url,
    entries: getPages(components),
    getRoute: (route) => route.route,
  })

export const matchRouteForUrl = <T extends { source: RouteDeclaration }>({
  url,
  routes,
}: {
  url: URL
  routes?: Record<string, T>
}) =>
  matchRoutes({
    url,
    entries: Object.values(routes ?? {}),
    getRoute: (route) => route.source,
  })

export const matchRoutes = <T>({
  url,
  entries,
  getRoute,
}: {
  url: URL
  entries: T[]
  getRoute: (entry: T) => Pick<PageRoute, 'path' | 'query'>
}): T | undefined => {
  const pathSegments = getPathSegments(url)
  const matches = Object.values(entries)
    .filter((entry) => {
      const route = getRoute(entry)
      return (
        pathSegments.length <= route.path.length &&
        route.path.every(
          (segment, index) =>
            segment.type === 'param' ||
            segment.optional === true ||
            segment.name === pathSegments[index],
        )
      )
    })
    .sort((a, b) => {
      const routeA = getRoute(a)
      const routeB = getRoute(b)
      const staticSegmentsA = routeA.path.filter(
        (segment) => segment.type === 'static',
      ).length
      const staticSegmentsB = routeB.path.filter(
        (segment) => segment.type === 'static',
      ).length
      // Prefer routes with more static segments (hence static matches)
      if (staticSegmentsA !== staticSegmentsB) {
        return staticSegmentsB - staticSegmentsA
      }
      // Prefer shorter routes
      const diff = routeA.path.length - routeB.path.length
      if (diff !== 0) {
        return diff
      }
      for (let i = 0; i < pathSegments.length; i++) {
        // Prefer static segments over dynamic ones
        // We don't need to check if the name matches, since we did that in the filter above
        const aScore = routeA.path[i].type === 'static' ? 1 : 0
        const bScore = routeB.path[i].type === 'static' ? 1 : 0
        if (aScore !== bScore) {
          return bScore - aScore
        }
      }
      // TODO: Before giving up on a tie, we could compare the query params?
      return 0
    })
  return matches[0]
}

export const getRouteDestination = ({
  files,
  req,
  route,
  env,
}: {
  files: ProjectFiles
  req: Request
  route: Route
  env: ToddleEnv
}) => {
  try {
    const requestUrl = new URL(req.url)

    const { searchParamsWithDefaults, pathParams } = getParameters({
      route: route.source,
      req,
    })

    const url = getUrl(
      route.destination,
      // destination formulas should only have access to URL parameters from
      // the route's source definition + global formulas.
      {
        data: {
          Attributes: {},
          'Route parameters': {
            path: pathParams,
            query: searchParamsWithDefaults,
          },
        },
        toddle: getServerToddleObject(files),
        env,
      } as any,
      // Redirects can redirect to relative URLs - rewrites can't
      route.type === 'redirect' ? requestUrl.origin : undefined,
    )
    if (
      route.type === 'redirect' &&
      requestUrl.origin === url.origin &&
      requestUrl.pathname === url.pathname
    ) {
      // Redirects are not allowed to redirect to the same URL as their source
      return
    }
    if (route.type === 'rewrite' && requestUrl.origin === url.origin) {
      // Rewrites are not allowed from the same origin as the source
      // This prevents potential recursive fetch calls from the server to itself
      return
    }
    return url
    // eslint-disable-next-line no-empty
  } catch {}
}

export const get404Page = (components: ProjectFiles['components']) =>
  getPages(components).find((page) => page.name === '404')

const getPages = (
  components: Partial<Record<string, { route?: RouteDeclaration | null }>>,
) =>
  Object.values(components).filter((c): c is PageComponent =>
    isDefined(c!.route),
  )

export const getPathSegments = (url: URL) =>
  url.pathname
    .substring(1)
    .split('/')
    .filter((s) => s !== '')
    .map((s) => decodeURIComponent(s))
