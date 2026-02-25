import { isLegacyPluginAction } from '@nordcraft/core/dist/component/actionUtils'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'
import { projectActionIsReferenced } from './projectActionIsReferenced.memo'

export const noReferenceProjectActionRule: Rule<void> = {
  code: 'no-reference project action',
  level: 'warning',
  category: 'No References',
  visit: (report, { value, path, files, nodeType, memo }) => {
    if (
      nodeType !== 'project-action' ||
      (!isLegacyPluginAction(value) && value.exported === true)
    ) {
      return
    }

    if (!projectActionIsReferenced(files, memo)(value.name)) {
      report({
        path,
        info: {
          title: 'Unused global action',
          description: `Action is never used by any workflow. Consider removing it.`,
        },
        fixes: ['delete-project-action'],
      })
    }
  },
  fixes: {
    'delete-project-action': removeFromPathFix,
  },
}

export type NoReferenceProjectActionRuleFix = 'delete-project-action'
