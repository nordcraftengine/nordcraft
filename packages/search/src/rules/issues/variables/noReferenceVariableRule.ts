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
      () =>
        new Set(
          getFormulasInComponent(memo, component)
            .filter(
              ({ formula }) =>
                formula.type === 'path' &&
                formula.path[0] === 'Variables' &&
                formula.path[1],
            )
            .map<string | number>(({ formula }) => (formula as any).path[1]),
        ),
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
