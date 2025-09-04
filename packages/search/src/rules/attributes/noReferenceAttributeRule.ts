import { omit } from '@nordcraft/core/dist/utils/collections'
import type { NodeType, Rule } from '../../types'

export const noReferenceAttributeRule: Rule<void> = {
  code: 'no-reference attribute',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (!hasReferences(args)) {
      report(args.path, undefined, ['delete-attribute'])
    }
  },
  fixes: {
    'delete-attribute': (data) => {
      if (!hasReferences(data)) {
        return omit(data.files, data.path)
      }
    },
  },
}

export type NoReferenceAttributeRuleFix = 'delete-attribute'

const hasReferences = (args: NodeType) => {
  if (args.nodeType !== 'component-attribute') {
    return true
  }
  const { path, component, memo } = args
  const [_components, _component, _attributes, attributeKey] = path
  if (typeof attributeKey !== 'string') {
    return true
  }
  const attrs = memo(`${component.name}-attrs`, () => {
    const attrs = new Set<string>()
    for (const { formula } of component.formulasInComponent()) {
      if (formula.type === 'path' && formula.path[0] === 'Attributes') {
        attrs.add(formula.path[1])
      }
    }

    return attrs
  })
  if (attrs.has(attributeKey)) {
    return true
  }
  return false
}
