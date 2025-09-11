import type { Rule } from '../../types'
import { removeFromPathFix } from '../../util/removeUnused.fix'

export const unknownAttributeRule: Rule<{
  name: string
}> = {
  code: 'unknown attribute',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'path' ||
      value.path[0] !== 'Attributes'
    ) {
      return
    }

    const [, componentName] = path
    const [, attributeKey] = value.path
    const component = files.components[componentName]
    if (!component?.attributes?.[attributeKey]) {
      report(path, { name: attributeKey }, ['delete-attribute'])
    }
  },
  fixes: {
    'delete-attribute': removeFromPathFix,
  },
}
