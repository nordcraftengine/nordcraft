import type { Rule } from '../../../types'

export const unknownProjectActionRule: Rule<{ name: string }> = {
  code: 'unknown project action',
  level: 'warning',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'action-model' ||
      (value.type !== undefined && value.type !== 'Custom') ||
      (value.name ?? '').startsWith('@toddle/')
    ) {
      return
    }
    const action = (
      value.package ? files.packages?.[value.package]?.actions : files.actions
    )?.[value.name]
    if (action) {
      return
    }
    report({
      path,
      info: {
        title: 'Unknown global action',
        description: `**${value.name}** does not exist as a global action. Using an unknown action will have no effect. Make sure to define it before calling it.`,
      },
      details: { name: value.name },
    })
  },
}
