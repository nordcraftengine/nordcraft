import { createRequiredDirectChildRule } from './createRequiredDirectChildRule'
import { createRequiredDirectParentRule } from './createRequiredDirectParentRule'
import { createRequiredElementAttributeRule } from './createRequiredElementAttributeRule'
import { createRequiredMetaTagRule } from './createRequiredMetaTagRule'
import { elementWithoutInteractiveContentRule } from './elementWithoutInteractiveContentRule'
import { imageWithoutDimensionRule } from './imageWithoutDimensionRule'
import { nonEmptyVoidElementRule } from './nonEmptyVoidElementRule'

export default [
  nonEmptyVoidElementRule,
  createRequiredElementAttributeRule({
    tag: 'a',
    attribute: 'href',
  }),
  createRequiredElementAttributeRule({
    tag: 'img',
    attribute: 'alt',
    allowEmptyString: true,
  }),
  createRequiredElementAttributeRule({
    tag: 'img',
    attribute: 'src',
  }),
  createRequiredMetaTagRule('description'),
  createRequiredMetaTagRule('title'),
  createRequiredDirectChildRule(['ul', 'ol'], ['li', 'script', 'template']),
  createRequiredDirectParentRule(['ul', 'ol'], ['li']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#technical_summary
  createRequiredDirectChildRule(
    ['table'],
    ['caption', 'colgroup', 'tbody', 'thead', 'tfoot', 'tr'],
  ),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody#technical_summary
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead#technical_summary
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot#technical_summary
  createRequiredDirectParentRule(['table'], ['tbody', 'thead', 'tfoot']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr#technical_summary
  createRequiredDirectChildRule(['tr'], ['th', 'td', 'script', 'template']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#technical_summary
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#technical_summary
  createRequiredDirectParentRule(['tr'], ['th', 'td']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#technical_summary
  createRequiredDirectChildRule(['select'], ['option', 'optgroup', 'hr']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup#technical_summary
  createRequiredDirectChildRule(['optgroup'], ['option']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend#technical_summary
  createRequiredDirectParentRule(['fieldset'], ['legend']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl#technical_summary
  createRequiredDirectChildRule(
    ['dl'],
    ['dd', 'dt', 'div', 'script', 'template'],
  ),
  elementWithoutInteractiveContentRule,
  imageWithoutDimensionRule,
]
