import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ComponentNodeAttributeNode, IssueRule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const unknownComponentAttributeRule: IssueRule<
  {
    name: string
    componentName: string
  },
  ComponentNodeAttributeNode
> = {
  code: 'unknown component attribute',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'component-node-attribute',
  visit: (report, args) => {
    if (args.node.type !== 'component') {
      return
    }
    const { files, value, node, path } = args
    const component = node.package
      ? files.packages?.[node.package]?.components?.[node.name]
      : files.components[node.name]
    if (!component) {
      return
    }
    if (!isDefined(component.attributes?.[value.key])) {
      report({
        path,
        info: {
          title: 'Unknown component attribute',
          description: `**${value.key}** is not a valid attribute for the "${node.name}" component.`,
        },
        details: { name: value.key, componentName: node.name },
        fixes: ['delete-component-attribute'],
      })
    }
  },
  fixes: {
    'delete-component-attribute': removeFromPathFix,
  },
}

export type UnknownComponentAttributeRuleFix = 'delete-component-attribute'
