import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceVariableRule: Rule<unknown> = {
  code: 'no-reference variable',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'component-variable') {
      return
    }
    const { path, memo, component } = args

    const [, , , variableKey] = path

    const variableInComponent = memo(
      `variableInComponent/${component.name}`,
      () =>
        new Set(
          Array.from(component.formulasInComponent())
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

    report(path, undefined, ['delete-variable'])
  },
  fixes: {
    'delete-variable': removeFromPathFix,
  },
}

export type NoReferenceVariableRuleFix = 'delete-variable'
