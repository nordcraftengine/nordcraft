import type {
  ComponentData,
  ElementNodeModel,
  FormulaContext,
} from '@nordcraft/core'
import {
  applyFormula,
  DATA_ATTR_COMPONENT,
  DATA_ATTR_ID,
  DATA_ATTR_NODE_ID,
  isDefined,
  toBoolean,
} from '@nordcraft/core'

const REGEXP_QUOTE = /"/g
const REGEXP_LT = /</g
const REGEXP_GT = />/g
// Attribute values only need escaping when they contain one of these chars.
const REGEXP_ATTR_SPECIAL = /[<>"]/

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
  // Most values (class names, ids, urls, plain text) contain no special
  // characters, so avoid allocating replacement strings for them.
  return REGEXP_ATTR_SPECIAL.test(str) ? escapeHtml(escapeQuote(str)) : str
}

const escapeQuote = (value: string) => {
  return value.replace(REGEXP_QUOTE, '&quot;')
}

const escapeHtml = (html: string) => {
  return html.replace(REGEXP_LT, '&lt;').replace(REGEXP_GT, '&gt;')
}

const REGEXP_TEXT_SPECIAL = /[&<>"'\n]/
const TEXT_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '\n': '<br />',
}

/**
 * Escape a string to valid HTML text similar to how set innerText would work in the browser
 */
export const toEncodedText = (str: string) => {
  // The common case is text with nothing to escape.
  if (!REGEXP_TEXT_SPECIAL.test(str)) {
    return str
  }
  // Single pass avoids creating a new intermediate string per replacement and
  // can never double-escape an inserted entity.
  return str.replace(REGEXP_TEXT_SPECIAL, (char) => TEXT_ESCAPES[char]!)
}

export function getNodeAttrs({
  node,
  formulaContext,
  data,
}: {
  node: Pick<ElementNodeModel, 'attrs' | 'style-variables'>
  formulaContext: FormulaContext
  data: ComponentData
}) {
  const { style, ...restAttrs } = node.attrs ?? {}
  const nodeAttrs: string[] = []
  for (const name in restAttrs) {
    if (
      name === DATA_ATTR_ID ||
      name === DATA_ATTR_NODE_ID ||
      name === DATA_ATTR_COMPONENT ||
      name === 'class'
    ) {
      continue
    }
    const value = applyFormula(restAttrs[name], formulaContext, data)
    if (toBoolean(value)) {
      nodeAttrs.push(`${name}="${escapeAttrValue(value)}"`)
    }
  }
  const styleVariables = node['style-variables']
  if (!style && !styleVariables) {
    return nodeAttrs
  }
  const styles: string[] = []
  if (style) {
    const styleValue = applyFormula(style, formulaContext, data)
    if (styleValue) {
      styles.push(String(styleValue))
    }
  }
  if (styleVariables) {
    for (const styleVariable of Object.values(styleVariables)) {
      styles.push(
        `--${styleVariable.name}: ${
          String(applyFormula(styleVariable.formula, formulaContext, data)) +
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
