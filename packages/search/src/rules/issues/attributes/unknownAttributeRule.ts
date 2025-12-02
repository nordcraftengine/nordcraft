import type { Rule } from '../../../types'

export const unknownAttributeRule: Rule<{
  name: string | number
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
      report(path, { name: attributeKey })
    }
  },
}
