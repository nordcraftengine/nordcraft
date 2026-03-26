import type { CustomActionModel } from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { MemoFn } from '../../../types'

export const projectActionIsReferenced = (
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>,
  memo: MemoFn,
) => {
  const usedActions = memo('all-used-project-actions', () => {
    const usedActions = new Set<string>()
    for (const component of Object.values(files.components)) {
      const c = new ToddleComponent({
        // Enforce that the component is not undefined since we're iterating
        component: component!,
        getComponent: (name, packageName) =>
          packageName
            ? files.packages?.[packageName]?.components[name]
            : files.components[name],
        packageName: undefined,
        globalFormulas: {
          formulas: files.formulas,
          packages: files.packages,
        },
      })
      for (const [, action] of c.actionModelsInComponent()) {
        if (
          action.type === 'Custom' ||
          action.type === ('function' as any) ||
          action.type === undefined
        ) {
          usedActions.add(
            [
              (action as CustomActionModel).package,
              (action as CustomActionModel).name,
            ]
              .filter(isDefined)
              .join('/'),
          )
        }
      }
    }
    return usedActions
  })

  return (actionName: string, packageName?: string) => {
    return usedActions.has(
      [packageName, actionName].filter(isDefined).join('/'),
    )
  }
}
