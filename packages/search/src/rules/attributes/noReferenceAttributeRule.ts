import type { Rule } from '../../types'
import { removeFromPathFix } from '../../util/removeUnused.fix'

export const noReferenceAttributeRule: Rule<void> = {
  code: 'no-reference attribute',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'component-attribute') {
      return
    }
    const { path, component, memo } = args
    const [_components, _component, _attributes, attributeKey] = path
    if (typeof attributeKey !== 'string') {
      return
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
      return
    }
    report(args.path, undefined, ['delete-attribute'])
  },
  fixes: {
    'delete-attribute': removeFromPathFix,
  },
}

export type NoReferenceAttributeRuleFix = 'delete-attribute'
