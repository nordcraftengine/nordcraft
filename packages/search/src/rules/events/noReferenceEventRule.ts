import { omit } from '@nordcraft/core/dist/utils/collections'
import type { ComponentEvent, NodeType, Rule } from '../../types'
import { isLegacyAction } from '../../util/helpers'

export const noReferenceEventRule: Rule<{ name: string }> = {
  code: 'no-reference event',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (isIssue(args)) {
      report(args.path, { name: args.value.event.name })
    }
  },
  fixes: {
    'delete-event': (data) => {
      if (isIssue(data)) {
        return omit(data.files, data.path)
      }
    },
  },
}

export type NoReferenceEventRuleFix = 'delete-event'

const isIssue = (args: NodeType): args is ComponentEvent => {
  if (args.nodeType !== 'component-event') {
    return false
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
            (a) => a.name === 'name',
          )?.formula
          if (formula?.type === 'value' && typeof formula.value === 'string') {
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
    return false
  }
  return true
}
