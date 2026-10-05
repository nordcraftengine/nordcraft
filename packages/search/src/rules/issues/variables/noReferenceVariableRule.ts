import type { ComponentVariableNode, IssueRule } from '../../../types'
import { getFormulasInComponent } from '../../../util/componentTraversal'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceVariableRule: IssueRule<void, ComponentVariableNode> = {
  code: 'no-reference variable',
  level: 'warning',
  category: 'No References',
  nodeTypes: 'component-variable',
  visit: (report, args) => {
    const { path, memo, component } = args

    const [, , , variableKey] = path

    const variableInComponent = memo(
      `variableInComponent/${component.name}`,
      () => {
        const used = new Set<string | number>()
        for (const { formula } of getFormulasInComponent(memo, component)) {
          if (
            formula.type === 'path' &&
            formula.path[0] === 'Variables' &&
            formula.path[1]
          ) {
            used.add(formula.path[1] as string | number)
          }
        }
        return used
      },
    )

    if (variableInComponent.has(variableKey)) {
      return
    }

    report({
      path,
      info: {
        title: 'Unused variable',
        description: `**${variableKey}** is set but never used by any formula. Consider removing it.`,
      },
      fixes: ['delete-variable'],
    })
  },
  fixes: {
    'delete-variable': removeFromPathFix,
  },
}

export type NoReferenceVariableRuleFix = 'delete-variable'
