import type { ComponentAPI } from '@nordcraft/core/dist/api/apiTypes'

export const sortApis = (apis: Array<[string, ComponentAPI]>) => {
  return [...apis].sort(([_, aObj], [__, bObj]) => {
    return compareApiDependencies(aObj, bObj)
  })
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
