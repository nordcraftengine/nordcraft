import type { ComponentAttributeNode, IssueRule } from '../../../types'
import { getFormulasInComponent } from '../../../util/componentTraversal'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceAttributeRule: IssueRule<void, ComponentAttributeNode> =
  {
    code: 'no-reference attribute',
    level: 'warning',
    category: 'No References',
    nodeTypes: 'component-attribute',
    visit: (report, args) => {
      if (
        // Don't report unused attributes if the component has onAttributeChange actions.
        // The attribute might be used to trigger some logic there.
        (args.component.onAttributeChange?.actions?.length ?? 0) > 0
      ) {
        return
      }
      const { path, component, memo } = args
      const [_components, _component, _attributes, attributeKey] = path
      if (typeof attributeKey !== 'string') {
        return
      }
      const attrs = memo(`${component.name}-attrs`, () => {
        const attrs = new Set<string>()
        for (const { formula } of getFormulasInComponent(memo, component)) {
          if (formula.type === 'path' && formula.path[0] === 'Attributes') {
            attrs.add(formula.path[1] as string)
          }
        }

        return attrs
      })
      if (attrs.has(attributeKey)) {
        return
      }
      report({
        path: args.path,
        info: {
          title: 'Unused attribute',
          description: `**${attributeKey}** is never used in any formula. Consider removing it.`,
        },
        fixes: ['delete-attribute'],
      })
    },
    fixes: {
      'delete-attribute': removeFromPathFix,
    },
  }

export type NoReferenceAttributeRuleFix = 'delete-attribute'
