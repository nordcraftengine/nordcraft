import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'

export const unknownCookieRule: Rule<{
  name: string
}> = {
  code: 'unknown cookie',
  level: 'info',
  category: 'Unknown Reference',
  visit: (report, { path, value, nodeType }, state) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'function' ||
      value.name !== '@toddle/getHttpOnlyCookie' ||
      value.arguments.length !== 1 ||
      state?.isBrowserExtensionAvailable !== true
    ) {
      return
    }
    const formula = value.arguments[0]?.formula
    if (
      !isDefined(formula) ||
      formula.type !== 'value' ||
      typeof formula.value !== 'string'
    ) {
      return
    }
    const cookie = state.cookiesAvailable?.find((c) => c.name === formula.value)
    if (!cookie) {
      report(path, { name: formula.value })
    }
  },
}
