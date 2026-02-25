import type { PluginActionV2 } from '@nordcraft/core/dist/types'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'
import { projectActionIsReferenced } from '../actions/projectActionIsReferenced.memo'
import { componentIsReferenced } from '../components/componentIsReferenced.memo'
import { projectFormulaIsReferenced } from '../formulas/projectFormulaIsReferenced.memo'

export const noReferenceProjectPackageRule: Rule<{ node: string }> = {
  code: 'no-reference project package',
  level: 'info',
  category: 'No References',
  visit: (report, info) => {
    if (info.nodeType !== 'project-package') {
      return
    }

    const { files, memo, path, value, packageName } = info

    const exportedFormulas = Object.entries(value.formulas ?? {}).filter(
      ([, formula]) => formula.exported,
    )
    if (exportedFormulas.length > 0) {
      const projectFormulaIsReferencedFn = projectFormulaIsReferenced(
        files,
        memo,
      )
      for (const [, formula] of exportedFormulas) {
        if (projectFormulaIsReferencedFn(formula.name, packageName)) {
          return
        }
      }
    }

    const exportedActions = Object.entries(value.actions ?? {}).filter(
      ([, action]) => (action as PluginActionV2).exported,
    )
    if (exportedActions.length > 0) {
      const projectActionIsReferencedFn = projectActionIsReferenced(files, memo)
      for (const [, action] of exportedActions) {
        if (projectActionIsReferencedFn(action.name, packageName)) {
          return
        }
      }
    }

    const exportedComponents = Object.entries(value.components ?? {}).filter(
      ([, component]) => component?.exported,
    )
    if (exportedComponents.length > 0) {
      const componentIsReferencedFn = componentIsReferenced(files, memo)
      for (const [, component] of exportedComponents) {
        if (component && componentIsReferencedFn(component.name, packageName)) {
          return
        }
      }
    }

    report({
      path,
      info: {
        title: `Unused package`,
        description: `Package is installed, but none of its formulas, actions, or components are used by any other part of the project. The package can safely be uninstalled.`,
      },
      fixes: ['uninstall-package'],
    })
  },
  fixes: {
    'uninstall-package': removeFromPathFix,
  },
}

export type NoReferenceProjectPackageRuleFix = 'uninstall-package'
