import type { CustomPropertyName } from '../component/component.types'
import { isDefined } from '../utils/util'
import type { CustomPropertyDefinition, Theme } from './theme'

// See https://developer.mozilla.org/en-US/docs/Web/CSS/@property/syntax
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

export type CssSyntaxNode =
  | {
      type: 'primitive'
      name: CssSyntax
    }
  | {
      type: 'keyword'
      keywords: string[]
    }

export function stringifySyntaxNode(node: CssSyntaxNode): string {
  switch (node.type) {
    case 'primitive':
      return `<${node.name}>`
    case 'keyword':
      return node.keywords.join(' | ')
    default:
      throw new Error(`Unknown syntax node type: ${(node as any).type}`)
  }
}

export function renderSyntaxDefinition(
  key: CustomPropertyName,
  { syntax, inherits, initialValue }: CustomPropertyDefinition,
  defaultTheme: Theme,
): string {
  let value = initialValue
  if (initialValue?.includes('var(--')) {
    value = solveVarRecursively(initialValue, defaultTheme)
  }

  // Fallback in-case of no reference
  if (!isDefined(value) && syntax.type === 'primitive') {
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

const FALLBACK_VALUES: Record<CssSyntax, string> = {
  color: 'transparent',
  length: '0px',
  'length-percentage': '0px',
  percentage: '0%',
  number: '0',
  angle: '0deg',
  time: '0s',
  resolution: '0dpi',
  'custom-ident': 'none',
  string: '""',
  image: 'none',
  url: 'none',
  'transform-function': 'none',
  'transform-list': 'none',
  '*': 'initial',
  integer: '0',
}
