import { get, set } from '@nordcraft/core/dist/utils/collections'
import type { ActionModelNode, Rule } from '../../../types'

export const noPostNavigateAction: Rule<{ parameter: string }> = {
  code: 'no post navigate action',
  level: 'warning',
  category: 'Quality',
  visit: (report, { nodeType, path, value, files }) => {
    if (
      nodeType !== 'action-model' ||
      value.type !== undefined ||
      value.name !== '@toddle/gotToURL'
    ) {
      return
    }
    const actionsArrayPath = path.slice(0, -1).map((p) => String(p))
    const actions = get(files, actionsArrayPath)
    if (!Array.isArray(actions)) {
      return
    }
    const _actionIndex = path.at(-1)
    if (_actionIndex === undefined) {
      return
    }
    const actionIndex = Number(_actionIndex)
    if (actionIndex < actions.length - 1) {
      // If the action is not the last one in the array, report it
      report(path, undefined, ['delete-following-actions'])
    }
  },
  fixes: {
    'delete-following-actions': ({ path, files }: ActionModelNode) => {
      const actionsArrayPath = path.slice(0, -1).map((p) => String(p))
      const actions = get(files, actionsArrayPath)
      const actionIndex = path.at(-1)
      if (actionIndex === undefined || !Array.isArray(actions)) {
        return
      }
      return set(
        files,
        actionsArrayPath,
        actions.slice(0, Number(actionIndex) + 1),
      )
    },
  },
}

export type NoPostNavigateActionRuleFix = 'delete-following-actions'
