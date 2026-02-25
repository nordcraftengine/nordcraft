import type { ComponentNodeModel } from '@nordcraft/core/dist/component/component.types'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { MemoFn } from '../../../types'

export const componentIsReferenced = (
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>,
  memo: MemoFn,
) => {
  const usedComponents = memo('all-used-components', () => {
    const used = new Set<string>()
    Object.values(files.components).forEach((component) => {
      Object.values(component?.nodes ?? {})
        .filter(
          (node) =>
            node.type === 'component' &&
            // Do not add cyclical references
            node.name !== component?.name,
        )
        .forEach((instance) => {
          used.add(
            [
              (instance as ComponentNodeModel).package,
              (instance as ComponentNodeModel).name,
            ]
              .filter(isDefined)
              .join('/'),
          )
        })
    })
    return used
  })

  return (componentName: string, packageName?: string) => {
    return usedComponents.has(
      [packageName, componentName].filter(isDefined).join('/'),
    )
  }
}
