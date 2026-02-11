import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'

export const unknownComponentRule: Rule<{
  name: string
}> = {
  code: 'unknown component',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'component-node' ||
      value.type !== 'component' ||
      // Check if the component exists in the project
      (!isDefined(value.package) && isDefined(files.components[value.name])) ||
      // Check if the component exists in a specified package
      (value.package &&
        isDefined(files.packages?.[value.package]?.components[value.name]))
    ) {
      return
    }
    report({
      path,
      info: {
        title: 'Unknown component',
        description: `**${value.name}** does not exist in this project.`,
      },
      details: { name: value.name },
    })
  },
}
