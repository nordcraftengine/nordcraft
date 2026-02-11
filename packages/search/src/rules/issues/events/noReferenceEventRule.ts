import type { Rule } from '../../../types'
import { isLegacyAction } from '../../../util/helpers'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceEventRule: Rule<{ name: string }> = {
  code: 'no-reference event',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'component-event') {
      return
    }
    const { memo, value } = args
    const { component, event } = value
    const events = memo(`${component.name}-events`, () => {
      const events = new Set<string>()
      for (const [, action] of component.actionModelsInComponent()) {
        if (isLegacyAction(action)) {
          if (
            'name' in action &&
            'arguments' in action &&
            action.name === 'TriggerEvent' &&
            action.version === undefined
          ) {
            const formula = action.arguments?.find(
              (a) => a?.name === 'name',
            )?.formula
            if (
              formula?.type === 'value' &&
              typeof formula.value === 'string'
            ) {
              events.add(formula.value)
            }
          }
        } else if (action.type === 'TriggerEvent') {
          events.add(action.event)
        }
      }
      return events
    })
    if (events.has(event.name)) {
      return
    }
    report({
      path: args.path,
      info: {
        title: 'Unused event',
        description: `**${event.name}** is never triggered. Consider removing it and clean up any usages.`,
      },
      details: { name: event.name },
      fixes: ['delete-event'],
    })
  },
  fixes: {
    'delete-event': removeFromPathFix,
  },
}

export type NoReferenceEventRuleFix = 'delete-event'
