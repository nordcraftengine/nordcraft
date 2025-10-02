import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../types'
import { removeFromPathFix } from '../../util/removeUnused.fix'

export const unknownComponentAttributeRule: Rule<{
  name: string
  componentName: string
}> = {
  code: 'unknown component attribute',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, args) => {
    if (
      args.nodeType !== 'component-node-attribute' ||
      args.node.type !== 'component'
    ) {
      return
    }
    const { files, value, node, path } = args
    const component = node.package
      ? files.packages?.[node.package].components?.[node.name]
      : files.components[node.name]
    if (!component) {
      return
    }
    if (!isDefined(component.attributes?.[value.key])) {
      report(path, { name: value.key, componentName: node.name }, [
        'delete-component-attribute',
      ])
    }
  },
  fixes: {
    'delete-component-attribute': removeFromPathFix,
  },
}

export type UnknownComponentAttributeRuleFix = 'delete-component-attribute'
