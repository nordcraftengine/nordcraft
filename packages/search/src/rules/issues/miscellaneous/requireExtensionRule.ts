import type { Rule } from '../../../types'

export const requireExtensionRule: Rule<{
  name: string
}> = {
  code: 'required extension',
  level: 'info',
  category: 'Quality',
  visit: (report, { path, value, nodeType }, state) => {
    if (
      nodeType !== 'action-model' ||
      value.type !== undefined ||
      value.name !== '@toddle/setSessionCookies' ||
      !state ||
      state.isBrowserExtensionAvailable === true
    ) {
      return
    }
    report(path)
  },
}
