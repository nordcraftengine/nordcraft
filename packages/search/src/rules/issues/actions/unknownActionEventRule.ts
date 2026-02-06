import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const unknownActionEventRule: Rule<{ name: string }> = {
  code: 'unknown action event',
  level: 'warning',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (nodeType !== 'action-custom-model-event') {
      return
    }
    const { action, eventName } = value
    const referencedAction = (
      action.package ? files.packages?.[action.package]?.actions : files.actions
    )?.[action.name]
    if (!referencedAction) {
      return
    }
    if (!isDefined(referencedAction.events?.[eventName])) {
      report({
        path,
        info: {
          title: 'Unknown action event',
          description: `The event **${eventName}** does not exist in the referenced action.`,
        },
        details: {
          name: eventName,
        },
        fixes: ['delete-unknown-action-event'],
      })
    }
  },
  fixes: {
    'delete-unknown-action-event': removeFromPathFix,
  },
}

export type UnknownActionEventRuleFix = 'delete-unknown-action-event'
