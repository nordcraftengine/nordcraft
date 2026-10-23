import type {
  ComponentData,
  ElementNodeModel,
  FormulaContext,
} from '@nordcraft/core'
import { applyFormula, isDefined, toBoolean } from '@nordcraft/core'

const REGEXP_QUOTE = /"/g
const REGEXP_LT = /</g
const REGEXP_GT = />/g

const validAttrTypes = ['string', 'number', 'boolean']

export const escapeAttrValue = (value: any) => {
  if (!isDefined(value) || !validAttrTypes.includes(typeof value)) {
    return ''
  }
  return escapeHtml(escapeQuote(String(value)))
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
  data,
}: {
  node: Pick<ElementNodeModel, 'attrs' | 'style-variables'>
  formulaContext: FormulaContext
  data: ComponentData
}) {
  const { style, ...restAttrs } = node.attrs ?? {}
  const nodeAttrs = Object.entries(restAttrs).reduce<string[]>(
    (appliedAttributes, [name, attrValue]) => {
      const value = applyFormula(attrValue, formulaContext, data)
      if (toBoolean(value)) {
        appliedAttributes.push(`${name}="${escapeAttrValue(value)}"`)
      }
      return appliedAttributes
    },
    [],
  )
  const styleVariables = Object.values(node['style-variables'] ?? {}).map(
    (styleVariable) => {
      return `--${styleVariable.name}: ${
        String(applyFormula(styleVariable.formula, formulaContext, data)) +
        (styleVariable.unit ?? '')
      }`
    },
  )

  // Handle the style-attribute independently to merge with style variables
  const styles = [
    ...(style ? [applyFormula(style, formulaContext, data)] : []),
    ...styleVariables,
  ]
    .filter(Boolean)
    .map(String)
    .join('; ')
  if (styles.length > 0) {
    return [...nodeAttrs, `style="${escapeAttrValue(styles)};"`]
  }

  return nodeAttrs
}
