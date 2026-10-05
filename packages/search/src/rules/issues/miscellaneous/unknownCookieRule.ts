import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { FormulaNode, IssueRule } from '../../../types'

export const unknownCookieRule: IssueRule<
  {
    name: string
  },
  FormulaNode
> = {
  code: 'unknown cookie',
  level: 'info',
  category: 'Unknown Reference',
  nodeTypes: 'formula',
  visit: (report, { path, value }, state) => {
    if (
      value.type !== 'function' ||
      value.name !== '@toddle/getHttpOnlyCookie' ||
      state?.isBrowserExtensionAvailable !== true
    ) {
      return
    }
    const args = value.arguments ?? []
    if (args.length !== 1) {
      return
    }
    const formula = args[0]?.formula
    if (
      !isDefined(formula) ||
      formula.type !== 'value' ||
      typeof formula.value !== 'string'
    ) {
      return
    }
    const cookie = state.cookiesAvailable?.find((c) => c.name === formula.value)
    if (!cookie) {
      report({
        path,
        info: {
          title: 'Unknown cookie',
          description: `**${formula.value}** is not found in the browser extension cookies.`,
        },
        details: { name: formula.value },
      })
    }
  },
}
