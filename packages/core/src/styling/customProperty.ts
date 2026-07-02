import type { CustomPropertyName } from '../component/component.types'
import type { Nullable } from '../types'
import { isDefined } from '../utils/util'
import type { CustomPropertyDefinition, Theme } from './theme'

// See https://developer.mozilla.org/en-US/docs/Web/CSS/@property/syntax
// Note: Not all CSS syntaxes are necessarily supported logically
export type CssSyntax =
  | 'angle'
  | 'color'
  | 'custom-ident'
  | 'image'
  | 'integer'
  | 'length'
  | 'length-percentage'
  | 'number'
  | 'percentage'
  | 'resolution'
  | 'string'
  | 'time'
  | 'transform-function'
  | 'transform-list'
  | 'url'
  | '*'

// Custom syntaxes that cannot be represented by a single primitive or keyword list
export type CssCustomSyntax = 'font-family' // <custom-ident> | <string>
// | 'timing-function'
// | 'box-shadow'
// | 'box-shadow-list'
// | 'filter'
// | etc.

export type CssSyntaxNode =
  | {
      type: 'primitive'
      name: CssSyntax
    }
  | {
      type: 'custom'
      name: CssCustomSyntax
    }
  | {
      type: 'keyword'
      keywords: string[]
    }

export function stringifySyntaxNode(node: CssSyntaxNode): string {
  switch (node.type) {
    case 'primitive':
      switch (node.name) {
        case '*':
          return node.name
        default:
          return `<${node.name}>`
      }
    case 'custom':
      return (
        {
          'font-family': '<custom-ident> | <string>',
        } as { [key in CssCustomSyntax]: string }
      )[node.name]
    case 'keyword':
      return node.keywords.join(' | ')
    default:
      throw new Error(`Unknown syntax node type: ${(node as any).type}`)
  }
}

export function renderSyntaxDefinition(
  key: CustomPropertyName,
  { syntax, inherits, initialValue }: CustomPropertyDefinition,
  theme: Theme,
): string {
  let value = initialValue
  if (initialValue?.includes('var(--')) {
    value = solveVarRecursively(initialValue, theme)
  }

  // Fallback in-case of no reference or invalid value for the initial value, as CSS requires an initial value to be set for custom properties, and it must match the syntax definition
  const needsFallback =
    !isDefined(value) ||
    ((syntax.type === 'primitive' || syntax.type === 'custom') &&
      !validateInitialValue(syntax, value).valid)

  if (
    needsFallback &&
    (syntax.type === 'primitive' || syntax.type === 'custom')
  ) {
    value = FALLBACK_VALUES[syntax.name]
  }

  return `@property ${key} {
  syntax: "${stringifySyntaxNode(syntax)}";
  inherits: ${String(inherits)};
  initial-value: ${value};
}`
}

function solveVarRecursively(initialValue: string, theme: Theme, depth = 0) {
  // This makes a crazy assumption that no person would create a web of style-variable referencing deeper than 256
  if (depth > 2 ** 8) {
    return null
  }

  const VAR_REGEX = /var\((--[a-zA-Z0-9-_]+)\)/g

  let match
  while ((match = VAR_REGEX.exec(initialValue))) {
    const varName = match[1]
    const def = theme.propertyDefinitions?.[varName as CustomPropertyName]
    if (!isDefined(def)) {
      return null
    }

    const value = def.initialValue
    const returnValue = initialValue.replace(match[0], String(value))
    if (returnValue.includes('var(--')) {
      return solveVarRecursively(returnValue, theme, depth + 1)
    }

    return returnValue
  }

  return null
}

const FALLBACK_VALUES: Record<CssSyntax | CssCustomSyntax, string> = {
  color: 'transparent',
  length: '0px',
  'length-percentage': '0px',
  percentage: '0%',
  number: '0',
  angle: '0deg',
  time: '0s',
  resolution: '0dpi',
  'custom-ident': '',
  string: '""',
  image: 'none',
  url: 'none',
  'transform-function': 'none',
  'transform-list': 'none',
  integer: '0',
  'font-family': 'sans-serif',
  '*': '',
}

export const appendUnit = (value: any, unit: Nullable<string>) =>
  isDefined(value) && isDefined(unit) && !String(value).endsWith(unit)
    ? `${value}${unit}`
    : value
export type ValidationError = 'computationally dependent' | 'invalid format'

export type ValidationResult =
  | { valid: true; error?: never }
  | { valid: false; error: ValidationError }

// Units that are computationally dependent on font/layout context and are
// therefore never valid as @property initial-value.
const FONT_RELATIVE_UNITS = /^(em|rem|ex|ch|cap|ic|lh|rlh)$/i

// Absolute units — always computationally independent.
const ABSOLUTE_UNITS = /^(px|pt|pc|cm|mm|q|in)$/i

// Viewport units — globally computationally independent per the CSS spec,
// but only accepted inside calc() in an initial-value.
// Includes standard (vw, vh, vmin, vmax, vi, vb) and the modern
// small/large/dynamic variants (svw, svh, lvw, lvh, dvw, dvh, etc.)
const VIEWPORT_UNITS =
  /^(vw|vh|vmin|vmax|vi|vb|svw|svh|svmin|svmax|lvw|lvh|lvmin|lvmax|dvw|dvh|dvmin|dvmax|svi|svb|lvi|lvb|dvi|dvb)$/i

// Extracts the unit from a bare dimension string, or null if not a bare dimension.
function extractUnit(value: string): string | null {
  const m = /^(-?\d*\.?\d+)([a-z%]+)$/i.exec(value)
  return m?.[2] ? m[2].toLowerCase() : null
}

// Returns true when a value is a valid <length> initial-value:
// - absolute units: always ok
// - viewport units: always ok
// - font-relative / % / container units: never ok
function isValidLengthInitialValue(value: string): ValidationResult {
  // calc() wrapping — allowed.
  const calcMatch = /^calc\((.+)\)$/i.exec(value)
  if (calcMatch?.[1]) {
    const inner = calcMatch[1].trim()
    const unit = extractUnit(inner)
    if (unit && VIEWPORT_UNITS.test(unit)) return { valid: true }
    if (unit && ABSOLUTE_UNITS.test(unit)) return { valid: true }
    // calc() with font-relative or unknown contents — reject.
    return { valid: false, error: 'computationally dependent' }
  }

  const unit = extractUnit(value)
  if (!unit) return { valid: false, error: 'invalid format' }

  if (ABSOLUTE_UNITS.test(unit)) return { valid: true }
  if (VIEWPORT_UNITS.test(unit)) return { valid: true }

  if (FONT_RELATIVE_UNITS.test(unit))
    return { valid: false, error: 'computationally dependent' }

  return { valid: false, error: 'invalid format' }
}

// <length-percentage> accepts <length> OR a bare percentage.
// Bare % is computationally dependent (relative to parent), but
// calc() expressions using viewport units are valid here too.
function isValidLengthPercentageInitialValue(value: string): ValidationResult {
  // Bare percentage — computationally dependent on parent dimension.
  if (/^-?\d*\.?\d+%$/.test(value)) {
    return { valid: false, error: 'computationally dependent' }
  }

  // Delegate to <length> logic (covers absolute + calc(vp-unit) cases).
  return isValidLengthInitialValue(value)
}

export const validateInitialValue = (
  syntax: CssSyntaxNode,
  value: string,
): ValidationResult => {
  if (!isDefined(value)) {
    return { valid: false, error: 'invalid format' }
  }

  if (value.includes('var(--')) {
    return { valid: false, error: 'computationally dependent' }
  }

  switch (syntax.type) {
    case 'primitive':
      switch (syntax.name) {
        case 'color':
          if (
            !/^(#([0-9a-f]{3,4}){1,2}|(rgb|hsl)a?\(.*\)|[a-z]+)$/i.test(value)
          ) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'length':
          return isValidLengthInitialValue(value)

        case 'length-percentage':
          return isValidLengthPercentageInitialValue(value)

        case 'percentage':
          if (!/^-?\d*\.?\d+%$/.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          // % is always computationally dependent (relative to parent).
          return { valid: false, error: 'computationally dependent' }

        case 'number':
          if (!/^-?\d*\.?\d+$/.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'integer':
          if (!/^-?\d+$/.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'angle':
          if (!/^-?\d*\.?\d+(deg|rad|grad|turn)$/i.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'time':
          if (!/^\d*\.?\d+(s|ms)$/i.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'resolution':
          if (!/^\d*\.?\d+(dpi|dpcm|dppx|x)$/i.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'custom-ident':
          if (!/^[a-z_][-a-z0-9_]*$/i.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'string':
          if (!/^(['"]).*\1$/.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'url':
          if (!/^url\(.*\)$/i.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'image':
          if (
            !(
              value === 'none' ||
              /^url\(.*\)$/i.test(value) ||
              /^(linear|radial|conic)-gradient\(.*\)$/i.test(value)
            )
          ) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'transform-function':
          if (!/^[a-z]+\(.*\)$/i.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case 'transform-list':
          if (!/^([a-z]+\(.*\)\s*)+$/i.test(value)) {
            return { valid: false, error: 'invalid format' }
          }
          return { valid: true }

        case '*':
          return { valid: true }

        default:
          return { valid: false, error: 'invalid format' }
      }

    case 'custom':
    case 'keyword':
      return { valid: true }

    default:
      return { valid: false, error: 'invalid format' }
  }
}
