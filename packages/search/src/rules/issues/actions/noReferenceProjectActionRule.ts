import type { CustomActionModel } from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceProjectActionRule: Rule<void> = {
  code: 'no-reference project action',
  level: 'warning',
  category: 'No References',
  visit: (report, { value, path, files, nodeType, memo }) => {
    if (nodeType !== 'project-action' || value.exported === true) {
      return
    }

    const projectActionReferences = memo('projectActionReferences', () => {
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
            usedActions.add((action as CustomActionModel).name)
          }
        }
      }
      return usedActions
    })

    if (!projectActionReferences.has(value.name)) {
      report(path, undefined, ['delete-project-action'])
    }
  },
  fixes: {
    'delete-project-action': removeFromPathFix,
  },
}

export type NoReferenceProjectActionRuleFix = 'delete-project-action'
