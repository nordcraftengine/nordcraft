import { get } from '@nordcraft/core/dist/utils/collections'
import type { Rule } from '../../types'

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
    actions.slice(actionIndex + 1).forEach((_, i) => {
      report([...actionsArrayPath, String(actionIndex + 1 + i)])
    })
  },
}
