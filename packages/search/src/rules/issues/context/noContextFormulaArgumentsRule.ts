import type { ComponentFormulaNode, IssueRule } from '../../../types'
import { removeContextFormulaArguments } from './noContextFormulaArgumentsRule.fix'

export const noContextFormulaArgumentsRule: IssueRule<
  {
    formulaName: string
  },
  ComponentFormulaNode
> = {
  code: 'no context formula arguments',
  level: 'error',
  category: 'Quality',
  visit: (report, { nodeType, value, path }) => {
    if (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      nodeType !== 'component-formula' ||
      value.exposeInContext !== true ||
      !value.arguments ||
      value.arguments.length === 0
    ) {
      return
    }

    const formulaKey = String(path.at(-1))
    const formulaName =
      typeof value.name === 'string' && value.name.length > 0
        ? value.name
        : formulaKey

    report({
      path,
      info: {
        title: 'Context formula cannot have arguments',
        description: `Context formula **${formulaName}** cannot declare arguments. Formulas exposed in context do not support arguments.`,
      },
      details: {
        formulaName,
      },
      fixes: ['remove-context-formula-arguments'],
    })
  },
  fixes: {
    'remove-context-formula-arguments': removeContextFormulaArguments,
  },
}

export type NoContextFormulaArgumentsRuleFix =
  'remove-context-formula-arguments'
