import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../types'
import { removeFromPathFix } from '../../util/removeUnused.fix'

export const unknownComponentAttributeRule: Rule<{
  name: string
}> = {
  code: 'unknown component attribute',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'component-node' ||
      value.type !== 'component' ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      Object.keys(value.attrs ?? {}).length === 0
    ) {
      return
    }
    const component = value.package
      ? files.packages?.[value.package].components?.[value.name]
      : files.components[value.name]
    if (!component) {
      return
    }
    for (const attrKey of Object.keys(value.attrs)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!isDefined(component.attributes?.[attrKey])) {
        report([...path, 'attrs', attrKey], { name: attrKey }, [
          'delete-component-attribute',
        ])
      }
    }
  },
  fixes: {
    'delete-component-attribute': removeFromPathFix,
  },
}

export type UnknownComponentAttributeRuleFix = 'delete-component-attribute'
