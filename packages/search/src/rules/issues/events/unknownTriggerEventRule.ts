import type { Rule } from '../../../types'

export const unknownTriggerEventRule: Rule<{
  name: string
}> = {
  code: 'unknown trigger event',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (nodeType !== 'action-model' || value.type !== 'TriggerEvent') {
      return
    }

    const [, componentName] = path
    const component = files.components[componentName]
    if (!component?.events?.some((e) => e.name === value.event)) {
      report(path, { name: value.event })
    }
  },
}
