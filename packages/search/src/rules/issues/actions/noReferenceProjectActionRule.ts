import { isLegacyPluginAction } from '@nordcraft/core/dist/component/actionUtils'
import type { IssueRule, ProjectActionNode } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'
import { projectActionIsReferenced } from './projectActionIsReferenced.memo'

export const noReferenceProjectActionRule: IssueRule<void, ProjectActionNode> =
  {
    code: 'no-reference project action',
    level: 'warning',
    category: 'No References',
    nodeTypes: 'project-action',
    visit: (report, { value, path, files, memo }) => {
      if (!isLegacyPluginAction(value) && value.exported === true) {
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
