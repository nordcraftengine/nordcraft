import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { CustomActionModelEventNode, IssueRule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const unknownActionEventRule: IssueRule<
  { name: string },
  CustomActionModelEventNode
> = {
  code: 'unknown action event',
  level: 'warning',
  category: 'Unknown Reference',
  nodeTypes: 'action-custom-model-event',
  visit: (report, { path, files, value }) => {
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
