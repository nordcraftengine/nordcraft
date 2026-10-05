import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ComponentNodeNode, IssueRule } from '../../../types'

export const unknownComponentRule: IssueRule<
  {
    name: string
  },
  ComponentNodeNode
> = {
  code: 'unknown component',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'component-node',
  visit: (report, { path, files, value }) => {
    if (
      value?.type !== 'component' ||
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
