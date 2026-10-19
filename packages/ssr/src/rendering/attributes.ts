import type { ElementNodeModel } from '@nordcraft/core/dist/component/component.types'
import type { FormulaContext } from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { isDefined, toBoolean } from '@nordcraft/core/dist/utils/util'

const REGEXP_QUOTE = /"/g
const REGEXP_LT = /</g
const REGEXP_GT = />/g

export const escapeAttrValue = (value: any) => {
  if (!isDefined(value)) {
    return ''
  }
  const valueType = typeof value
  if (
    valueType !== 'string' &&
    valueType !== 'number' &&
    valueType !== 'boolean'
  ) {
    return ''
  }
  const str = String(value)
  // Fast path: most attribute values contain no escapable characters
  if (
    str.indexOf('"') === -1 &&
    str.indexOf('<') === -1 &&
    str.indexOf('>') === -1
  ) {
    return str
  }
  return escapeHtml(escapeQuote(str))
}

const escapeQuote = (value: string) => {
  return value.replace(REGEXP_QUOTE, '&quot;')
}

const escapeHtml = (html: string) => {
  return html.replace(REGEXP_LT, '&lt;').replace(REGEXP_GT, '&gt;')
}

/**
 * Escape a string to valid HTML text similar to how set innerText would work in the browser
 */
export const toEncodedText = (str: string) => {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('\n', '<br />')
}

export function getNodeAttrs({
  node,
  formulaContext,
}: {
  node: Pick<ElementNodeModel, 'attrs' | 'style-variables'>
  formulaContext: FormulaContext
}) {
  const attrs = node.attrs
  const nodeAttrs: string[] = []
  if (attrs) {
    for (const name in attrs) {
      // Skip the style attribute here — it is merged with style-variables below.
      if (name === 'style') {
        continue
      }
      const value = applyFormula(attrs[name], formulaContext)
      if (toBoolean(value)) {
        nodeAttrs.push(`${name}="${escapeAttrValue(value)}"`)
      }
    }
  }
  const style = attrs?.style
  const styleVariables = node['style-variables']
  if (!style && !styleVariables) {
    return nodeAttrs
  }
  const styles: string[] = []
  if (style) {
    const styleValue = applyFormula(style, formulaContext)
    if (styleValue) {
      styles.push(String(styleValue))
    }
  }
  if (styleVariables) {
    for (const styleVariable of Object.values(styleVariables)) {
      styles.push(
        `--${styleVariable.name}: ${
          String(applyFormula(styleVariable.formula, formulaContext)) +
          (styleVariable.unit ?? '')
        }`,
      )
    }
  }

  // Handle the style-attribute independently to merge with style variables
  const joinedStyles = styles.join('; ')
  if (joinedStyles.length > 0) {
    return [...nodeAttrs, `style="${escapeAttrValue(joinedStyles)};"`]
  }

  return nodeAttrs
}
