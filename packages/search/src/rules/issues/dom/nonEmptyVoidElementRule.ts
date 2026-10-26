import { VOID_HTML_ELEMENTS } from '@nordcraft/core/dist/utils/html'
import type { ComponentNodeNode, IssueRule } from '../../../types'
/**
 * See full list here
 * https://developer.mozilla.org/en-US/docs/Glossary/Void_element
 */
export const nonEmptyVoidElementRule: IssueRule<
  { tag: string },
  ComponentNodeNode
> = {
  code: 'non-empty void element',
  level: 'warning',
  category: 'Quality',
  nodeTypes: 'component-node',
  visit: (report, { path, value }) => {
    if (
      value?.type !== 'element' ||
      (value.children ?? []).length <= 0 ||
      !VOID_HTML_ELEMENTS.includes(value.tag)
    ) {
      return
    }
    report({
      path,
      info: {
        title: 'Non-empty void element',
        description: `The **${value.tag}** element has child element(s), but ${value.tag} elements do not [support child elements](https://developer.mozilla.org/en-US/docs/Glossary/Void_element).`,
      },
      details: { tag: value.tag },
    })
  },
}
