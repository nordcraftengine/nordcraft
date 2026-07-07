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
        description: `The name for the **${value.name}** formula is declared directly on the formula. Consider moving the name to the formula key to reduce complexity in your project and help the AI perform better.`,
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
