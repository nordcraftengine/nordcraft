import type { Formula } from '../formula/formula'

type CssSyntaxPrimitive =
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

export type CssSyntax = CssSyntaxPrimitive

// The full union
export type CssSyntaxNode =
  | {
      type: 'primitive'
      name: CssSyntax
    }
  | {
      type: 'keyword'
      keywords: string[]
    }

export interface StyleProperty {
  name: string // The CSS property name, e.g. 'my-property'. Will be `--my-property` on usage.
  syntax: CssSyntaxNode // The syntax definition for the property
  formula: Formula // The value of the property. The formula may be a static string value to point to another property, or a more complex dynamical value.
}

/**
 * Default initial values for CSS properties based on their syntax type.
 *
 * Note: Eventually, the initial values may be set in a theme or somewhere global.
 */
const DEFAULT_INITIAL_VALUE_BY_SYNTAX: Record<CssSyntax, string | number> = {
  length: '0px',
  number: '0',
  percentage: '0%',
  color: 'transparent',
  image: 'none',
  url: 'none',
  integer: '0',
  angle: '0deg',
  time: '0s',
  resolution: '1dppx',
  'transform-function': 'none',
  'custom-ident': '',
  string: '',
  'length-percentage': '0px',
  'transform-list': 'none',
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

export function syntaxNodeToPropertyAtDefinition(
  property: StyleProperty,
): string {
  return `@property --${property.name} {
  syntax: "${stringifySyntaxNode(property.syntax)}";
  inherits: true;
  initial-value: ${property.syntax.type === 'primitive' ? DEFAULT_INITIAL_VALUE_BY_SYNTAX[property.syntax.name] : '""' /* default for non-primitive types */};
}`
}
