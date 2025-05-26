import { VOID_HTML_ELEMENTS } from '@nordcraft/ssr/dist/const'
import type { Rule } from '../../types'
/**
 * See full list here
 * https://developer.mozilla.org/en-US/docs/Glossary/Void_element
 */
export const nonEmptyVoidElementRule: Rule<{ tag: string }> = {
  code: 'non-empty void element',
  level: 'warning',
  category: 'Quality',
  visit: (report, { path, nodeType, value }) => {
    if (
      nodeType !== 'component-node' ||
      value.type !== 'element' ||
      value.children.length <= 0 ||
      !VOID_HTML_ELEMENTS.includes(value.tag)
    ) {
      return
    }
    report(path, { tag: value.tag })
  },
}
