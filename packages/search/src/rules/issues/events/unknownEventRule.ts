import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'

export const unknownEventRule: Rule<{
  name: string
}> = {
  code: 'unknown event',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'component-node' ||
      value.type !== 'component' ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      Object.entries(value.events ?? {}).length === 0
    ) {
      return
    }

    const component = value.package
      ? files.packages?.[value.package]?.components[value.name]
      : files.components[value.name]
    const componentEvents = new Set(
      (component?.events ?? []).map((e) => e.name),
    )
    Object.entries(value.events).forEach(([eventKey, event]) => {
      if (isDefined(event) && !componentEvents.has(event.trigger)) {
        report([...path, 'events', eventKey], { name: event.trigger })
      }
    })
  },
}
