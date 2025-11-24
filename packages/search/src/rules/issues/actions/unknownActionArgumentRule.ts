import { isLegacyPluginAction } from '@nordcraft/core/dist/component/actionUtils'
import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const unknownActionArgumentRule: Rule<{ name: string }> = {
  code: 'unknown action argument',
  level: 'warning',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (nodeType !== 'action-custom-model-argument') {
      return
    }
    const { action, argument, argumentIndex } = value
    if (action.name.startsWith('@toddle')) {
      return
    }
    const referencedAction = (
      action.package ? files.packages?.[action.package]?.actions : files.actions
    )?.[action.name]
    if (!referencedAction) {
      return
    }
    const referencedActionArguments = referencedAction.arguments ?? []
    if (isLegacyPluginAction(referencedAction)) {
      if (argumentIndex >= referencedActionArguments.length) {
        report(
          path,
          {
            name: argument.name ?? `argument at position ${argumentIndex}`,
          },
          ['delete-unknown-action-argument'],
        )
      }
    } else if (
      !referencedAction.arguments?.some((a) => a.name === argument.name)
    ) {
      report(
        path,
        {
          name: argument.name,
        },
        ['delete-unknown-action-argument'],
      )
    }
  },
  fixes: {
    'delete-unknown-action-argument': removeFromPathFix,
  },
}

export type UnknownActionArgumentRuleFix = 'delete-unknown-action-argument'
