import { mapHeadersToObject } from '@nordcraft/core/dist/api/headers'
import type {
  PageComponent,
  PageRoute,
} from '@nordcraft/core/dist/component/component.types'
import type {
  FormulaContext,
  NordcraftServerEnv,
} from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import type { PluginFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import { isNordcraftFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import { mapValues } from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import * as libFormulas from '@nordcraft/std-lib/dist/formulas'
import { getPathSegments } from '../routing/routing'
import type { InstalledPackage, ProjectFiles } from '../ssr.types'
import { getRequestCookies } from './cookies'
import { escapeSearchParameters } from './request'

/**
 * Builds a FormulaContext that can be used to evaluate formulas for a page component
 * It also initializes data->Variables with their initial values based on the FormulaContext
 */
export const getPageFormulaContext = ({
  branchName,
  component,
  req,
  logErrors,
  files,
}: {
  branchName: string
  component: PageComponent
  req: Request
  logErrors: boolean
  files: ProjectFiles
}): FormulaContext & { env: NordcraftServerEnv } => {
  const env = serverEnv({ req, branchName, logErrors })
  const { searchParamsWithDefaults, hash, combinedParams, url } = getParameters(
    { route: component.route, req },
  )
  const formulaContext: FormulaContext & { env: NordcraftServerEnv } = {
    data: {
      Location: {
        page: component.page ?? '',
        path: url.pathname,
        params: combinedParams,
        query: searchParamsWithDefaults,
        hash,
      },
      Attributes: combinedParams,
      // Path and query parameters are referenced in a flat structure in formulas
      // hence, we need to merge them. We prefer path parameters over query parameters
      // in case of naming collisions
      'URL parameters': getDataUrlParameters({ route: component.route, req }),
      Apis: {} as Record<string, any>,
    },
    component,
    root: null,
    package: undefined,
    env,
    nordcraft: getServerToddleObject(files),
  }
  formulaContext.data.Variables = mapValues(
    component.variables,
    ({ initialValue }) => {
      return applyFormula(initialValue, formulaContext)
    },
  )
  return formulaContext
}

export const getServerToddleObject = (
  files: Pick<ProjectFiles, 'formulas' | 'packages'> & {
    packages?: Record<string, Pick<InstalledPackage, 'formulas'>>
  },
): FormulaContext['nordcraft'] => {
  const coreFormulas = Object.fromEntries(
    Object.entries(libFormulas).map(([name, module]) => [
      '@toddle/' + name,
      module.default as any,
    ]),
  )
  return {
    getFormula: (name: string) => coreFormulas[name],
    getCustomFormula: (name: string, packageName: string | undefined) => {
      let formula: PluginFormula<string> | undefined

      if (isDefined(packageName)) {
        formula = files.packages?.[packageName]?.formulas?.[name]
      } else {
        formula = files.formulas?.[name]
      }

      if (formula && isNordcraftFormula(formula)) {
        return formula
      }
    },
    errors: [],
  }
}

export const getDataUrlParameters = ({
  route,
  req,
}: {
  route: Pick<PageRoute, 'path' | 'query'>
  req: Request
}) => {
  const { searchParamsWithDefaults, combinedParams } = getParameters({
    route,
    req,
  })
  return {
    ...searchParamsWithDefaults,
    ...combinedParams,
  }
}

export const getParameters = ({
  route,
  req,
}: {
  route?: Pick<PageRoute, 'path' | 'query'>
  req: Request
}) => {
  const url = new URL(req.url)
  const searchParams = [
    ...escapeSearchParameters(url.searchParams).entries(),
  ].reduce<
    Record<string, string | null>
    // avoid undefined values in the searchParams
  >(
    (params, [key, val]) => ({
      ...params,
      [key]: val ?? null,
    }),
    {},
  )
  const pathSegments = getPathSegments(url)
  const pathParams = route?.path.reduce((prev, param, index) => {
    if (param.type === 'param') {
      if (
        isDefined(pathSegments[index]) &&
        typeof pathSegments[index] === 'string'
      ) {
        return { ...prev, [param.name]: pathSegments[index] }
      } else {
        // Explicitly set path parameters to null by default
        // to avoid undefined values when serializing for the runtime
        return { ...prev, [param.name]: null }
      }
    }

    return prev
  }, {})

  // Explicitly set all query params to null by default
  // to avoid undefined values in the runtime
  const defaultQueryParams = Object.keys(route?.query ?? {}).reduce<
    Record<string, null>
  >((params, key) => ({ ...params, [key]: null }), {})
  return {
    pathParams,
    searchParamsWithDefaults: { ...defaultQueryParams, ...searchParams },
    combinedParams: { ...searchParams, ...pathParams },
    hash: url.hash.slice(1),
    url,
  }
}

export const serverEnv = ({
  branchName,
  req,
  logErrors,
}: {
  branchName: string
  req: Request
  logErrors: boolean
}) =>
  ({
    branchName: branchName,
    // isServer will be true for SSR + proxied requests
    isServer: true,
    request: {
      headers: mapHeadersToObject(req.headers),
      cookies: getRequestCookies(req),
      url: req.url,
    },
    logErrors,
  }) as NordcraftServerEnv
