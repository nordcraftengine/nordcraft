import type { Rule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'
import { removeFromPathFix } from '../../../util/removeUnused.fix'
import { componentIsReferenced } from '../components/noReferenceComponentRule'

export const noReferenceAttributeInInstanceRule: Rule<void> = {
  code: 'no-reference attribute in instance',
  level: 'info',
  category: 'No References',
  visit: (report, args, state) => {
    if (
      args.nodeType !== 'component-attribute' ||
      (state?.projectDetails?.type === 'package' &&
        args.component.exported === true) ||
      contextlessEvaluateFormula(args.component.customElement?.enabled)
        .result === true
    ) {
      return
    }
    const { path, component, memo } = args
    const [_components, _component, _attributes, attributeKey] = path
    if (typeof attributeKey !== 'string') {
      return
    }

    // If component is never used, skip this rule as we have another rule to find unused components (no-reference component)
    if (!componentIsReferenced(args.files.components, memo)(component.name)) {
      return
    }

    // Gather all instead of only used in this component for optimization purposes
    const attrs = memo(`all-used-attributes`, () => {
      const attrs = new Set<string>()
      Object.values(args.files.components).forEach((otherComponent) =>
        Object.values(otherComponent?.nodes ?? {})
          .filter((node) => node.type === 'component')
          .forEach((instance) =>
            Object.keys(instance.attrs).forEach((attr) => {
              attrs.add([instance.name, attr].join('/'))
            }),
          ),
      )

      return attrs
    })
    if (attrs.has([component.name, attributeKey].join('/'))) {
      return
    }
    report({
      path: args.path,
      info: {
        title: 'Attribute is never set on any instance',
        description: `The attribute **${attributeKey}** is never set on any component instance. Consider removing the attribute as any usage will always be *null*.`,
      },
      fixes: ['delete-attribute'],
    })
  },
  fixes: {
    'delete-attribute': removeFromPathFix,
  },
}

export type NoReferenceAttributeRuleFix = 'delete-attribute'
