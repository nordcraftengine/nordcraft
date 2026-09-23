import type {
  ApiStatus,
  ComponentAPI,
  LegacyApiStatus,
} from '@nordcraft/core/dist/api/apiTypes'
import type { Component } from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { FormulaContext } from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'
import { mapObject } from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/src/utils/util'
import type { ProjectFiles } from '../ssr.types'

export type ApiCache = Record<string, ApiStatus>

export type ApiEvaluator = (args: {
  component: Component
  formulaContext: FormulaContext
  req: Request
  apiCache: ApiCache
  updateApiCache: (key: string, value: ApiStatus) => void
}) => Promise<
  Record<
    string,
    LegacyApiStatus | (ApiStatus & { inputs?: Record<string, unknown> })
  >
>

const compareApiDependencies = (
  a: Nullable<ComponentAPI>,
  b: Nullable<ComponentAPI>,
) => {
  if (!isDefined(a)) {
    return 1
  }
  if (!isDefined(b)) {
    return -1
  }
  const isADependentOnB = a.dependsOn?.includes(b.name) ?? false
  const isBDependentOnA = b.dependsOn?.includes(a.name) ?? false
  if (isADependentOnB === isBDependentOnA) {
    return 0
  }
  // 1 means A goes last - hence B is evaluated before A
  return isADependentOnB ? 1 : -1
}

export const sortApiEntries = (apis: Array<[string, Nullable<ComponentAPI>]>) =>
  [...apis].sort(([_, a], [__, b]) => compareApiDependencies(a, b))

export const processComponentApis = <T extends Component>(
  component: T,
  files: ProjectFiles,
): T => {
  const toddleComponent = new ToddleComponent<string>({
    component,
    getComponent: (name, packageName) => {
      const nodeLookupKey = [packageName, name].filter(isDefined).join('/')
      const component = packageName
        ? files.packages?.[packageName]?.components[name]
        : files.components[name]
      if (!component) {
        // eslint-disable-next-line no-console
        console.warn(`Unable to find component ${nodeLookupKey} in files`)
        return undefined
      }

      return component
    },
    packageName: undefined,
    globalFormulas: {
      formulas: files.formulas,
      packages: files.packages,
    },
  })
  return {
    ...component,
    apis: component.apis
      ? mapObject(component.apis, ([key, api]) => [
          key,
          { ...api, dependsOn: toddleComponent.apis[key]?.dependsOn ?? [] },
        ])
      : undefined,
  }
}
