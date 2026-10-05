import type { ActionModelNode, IssueRule } from '../../../types'

export const requireExtensionRule: IssueRule<
  {
    name: string
  },
  ActionModelNode
> = {
  code: 'required extension',
  level: 'info',
  category: 'Quality',
  nodeTypes: 'action-model',
  visit: (report, { path, value }, state) => {
    if (
      value.type !== undefined ||
      value.name !== '@toddle/setSessionCookies' ||
      !state ||
      state.isBrowserExtensionAvailable === true
    ) {
      return
    }
    report({
      path,
      info: {
        title: 'Browser plugin recommended',
        description:
          '**Toddle browser plugin** is recommended for working with cookies. [Install extension](https://chromewebstore.google.com/detail/toddle/hfhgjncckomifajhndceigiaiojhlllp?hl=en)',
      },
    })
  },
}
