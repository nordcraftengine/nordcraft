import type { FormulaNode, IssueRule, NodeType } from '../../../types'
import { addContextSubscription } from './unknownContextFormulaRule.fix'

export const unknownContextFormulaRule: IssueRule<
  {
    providerName: string
    formulaName: string
  },
  FormulaNode
> = {
  code: 'unknown context formula',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      path[0] !== 'components' ||
      (nodeType as NodeType['nodeType']) !== 'formula' ||
      value.type !== 'path' ||
      value.path[0] !== 'Contexts'
    ) {
      return
    }

    const contexts = files.components[path[1]]?.contexts ?? {}
    if (
      (contexts as any)[value.path[1] as string]?.formulas.includes(
        value.path[2] as string,
      )
    ) {
      return
    }

    report({
      path,
      info: {
        title: 'Unknown context formula',
        description: `**${value.path[2] as string}** is not subscribed. Make sure to subscribe to it in the component context section before using it.`,
      },
      details: {
        providerName: value.path[1] as string,
        formulaName: value.path[2] as string,
      },
      fixes: ['add-context-subscription'],
    })
  },
  fixes: {
    'add-context-subscription': addContextSubscription,
  },
}

export type UnknownContextFormulaRuleFix = 'add-context-subscription'
