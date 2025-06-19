import { getUrl } from '@nordcraft/core/dist/api/api'
import type {
  PageComponent,
  PageRoute,
  RouteDeclaration,
} from '@nordcraft/core/dist/component/component.types'
import type {
  FormulaContext,
  NordcraftEnv,
} from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { isDefined, toBoolean } from '@nordcraft/core/dist/utils/util'
import { getParameters } from '../rendering/formulaContext'
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

export const matchRouteForUrl = ({
  env,
  req,
  routes,
  serverContext,
  url,
}: {
  env: NordcraftEnv
  req: Request
  routes?: Record<string, Route>
  serverContext: FormulaContext['nordcraft']
  url: URL
}) =>
  matchRoutes({
    url,
    entries: Object.values(routes ?? {}).filter((route) => {
      if (!isDefined(route.enabled)) {
        // If the route does not have an explicit enabled property, we assume it is enabled
        return true
      }
      // Only include routes that are enabled
      const formulaContext = getRouteFormulaContext({
        env,
        req,
        route,
        serverContext,
      })
      return toBoolean(applyFormula(route.enabled.formula, formulaContext))
    }),
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
  // E.g. /fruit/:fruitId => 1.2
  // E.g. /:blog/:slug/:author => 2.2.2
  // E.g. /:dynamic/static => 2.1
  const getPathHash = (path: PageRoute['path']) =>
    path.map((segment) => (segment.type === 'static' ? '1' : '2')).join('.')
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
      const routeAHash = getPathHash(getRoute(a).path)
      const routeBHash = getPathHash(getRoute(b).path)
      // Favors static segments over dynamic segments and shorter paths over longer paths
      // E.g. /fruit/:fruitId wins over /:blog/:slug for /fruit/apple
      // E.g. /fruit/:fruitId/:category wins over /:blog/:slug for /fruit/apple
      return routeAHash.localeCompare(routeBHash)
    })
  return matches[0]
}

export const getRouteDestination = ({
  serverContext,
  req,
  route,
  env,
}: {
  serverContext: FormulaContext['nordcraft']
  req: Request
  route: Route
  env: NordcraftEnv
}) => {
  try {
    const requestUrl = new URL(req.url)

    const formulaContext = getRouteFormulaContext({
      env,
      req,
      route,
      serverContext,
    })

    const url = getUrl(
      route.destination,
      formulaContext,
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

const getRouteFormulaContext = ({
  env,
  req,
  route,
  serverContext,
}: {
  env: NordcraftEnv
  req: Request
  route: Route
  serverContext: FormulaContext['nordcraft']
}): FormulaContext => {
  const { searchParamsWithDefaults, pathParams } = getParameters({
    route: route.source,
    req,
  })
  return {
    component: undefined,
    // destination formulas should only have access to URL parameters from
    // the route's source definition + global formulas.
    data: {
      Attributes: {},
      'Route parameters': {
        path: pathParams ?? {},
        query: searchParamsWithDefaults,
      },
    },
    env,
    package: undefined,
    nordcraft: serverContext,
  }
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
