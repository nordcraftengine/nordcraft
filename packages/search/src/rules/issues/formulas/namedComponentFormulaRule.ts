import type { ComponentFormulaNode, IssueRule } from '../../../types'
import { renameNamedComponentFormulaFix } from './namedComponentFormulaRule.fix'

export const namedComponentFormulaRule: IssueRule<
  { name: string; formulaKey: string | number },
  ComponentFormulaNode
> = {
  code: 'named component formula',
  level: 'info',
  category: 'Deprecation',
  visit: (report, { nodeType, value, path }) => {
    const formulaKey = path.at(-1)
    if (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      nodeType !== 'component-formula' ||
      typeof value.name !== 'string' ||
      typeof formulaKey !== 'string'
    ) {
      return
    }

    report({
      path,
      info: {
        title: 'Formula has name property',
        description: `The **${value.name}** formula has a legacy name field. Consider migrating the formula to use standard keys by renaming it or applying the rename fix.`,
      },
      details: {
        name: value.name,
        formulaKey,
      },
      fixes: ['rename-named-component-formula'],
    })
  },
  fixes: {
    'rename-named-component-formula': renameNamedComponentFormulaFix,
  },
}

export type NamedComponentFormulaRuleFix = 'rename-named-component-formula'
