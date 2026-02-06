import type { Rule } from '../../../types'

export const duplicateEventTriggerRule: Rule<{ trigger: string }> = {
  code: 'duplicate event trigger',
  level: 'warning',
  category: 'Quality',
  visit: (report, { nodeType, path, value }) => {
    if (nodeType !== 'component-node' || value.type !== 'element') {
      return
    }
    const eventTriggers = new Set<string>()

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    Object.entries(value.events ?? {}).forEach(([key, event]) => {
      if (typeof event?.trigger !== 'string') {
        return
      }
      if (eventTriggers.has(event.trigger)) {
        report({
          path: [...path, 'events', key],
          info: {
            title: 'Duplicate event trigger',
            description: `**${event.trigger}** is used as a trigger in multiple events. Consider consolidating them into a single event.`,
          },
          details: { trigger: event.trigger },
        })
      }
      eventTriggers.add(event.trigger)
    })
  },
}
