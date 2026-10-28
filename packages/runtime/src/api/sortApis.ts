import type { ComponentAPI, Nullable } from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'

export const sortApis = (apis: Array<[string, ComponentAPI]>) => {
  if (apis.length <= 1) {
    return apis
  }
  return [...apis].sort(([_, aObj], [__, bObj]) => {
    return compareApiDependencies(aObj, bObj)
  })
}

export const sortApiEntries = (
  apis: Nullable<Record<string, Nullable<ComponentAPI>>>,
) => {
  const entries: Array<[string, ComponentAPI]> = []
  if (apis) {
    for (const name in apis) {
      const api = apis[name]
      if (isDefined(api)) {
        entries.push([name, api])
      }
    }
  }
  return sortApis(entries)
}

const compareApiDependencies = (a: ComponentAPI, b: ComponentAPI) => {
  const isADependentOnB = a.dependsOn?.includes(b.name) ?? false
  const isBDependentOnA = b.dependsOn?.includes(a.name) ?? false
  if (isADependentOnB === isBDependentOnA) {
    return 0
  }
  // 1 means A goes last - hence B is evaluated before A
  return isADependentOnB ? 1 : -1
}
