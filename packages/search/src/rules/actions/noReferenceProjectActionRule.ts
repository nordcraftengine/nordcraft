import type { CustomActionModel } from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { omit } from '@nordcraft/core/dist/utils/collections'
import type { NodeType, Rule } from '../../types'

export const noReferenceProjectActionRule: Rule<void> = {
  code: 'no-reference project action',
  level: 'warning',
  category: 'No References',
  visit: (report, details) => {
    if (!hasReferences(details)) {
      report(details.path, undefined, ['delete-project-action'])
    }
  },
  fixes: {
    'delete-project-action': (data) => {
      if (!hasReferences(data)) {
        return omit(data.files, data.path)
      }
    },
  },
}

export type NoReferenceProjectActionRuleFix = 'delete-project-action'

const hasReferences = ({ value, files, nodeType, memo }: NodeType) => {
  if (nodeType !== 'project-action' || value.exported === true) {
    return true
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

  return projectActionReferences.has(value.name)
}
