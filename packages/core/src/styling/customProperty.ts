import type { CustomPropertyName } from '../component/component.types'
import type { CustomPropertyDefinition } from './theme'

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

/*
TODO: `initialValue` does not support referencing other properties (e.g. var(--some-other-property))
To Fix this, we could either statically solve by accessing theme at SSR, but to handle theme-switching at runtime,
we would instead need to do `:root { --my-property: var(--some-other-property); }` for properties that need to reference other properties.
*/
export function renderSyntaxDefinition(
  key: CustomPropertyName,
  { syntax, inherits, initialValue }: CustomPropertyDefinition,
): string {
  return `@property ${key} {
  syntax: "${stringifySyntaxNode(syntax)}";
  inherits: ${String(inherits)};
  initial-value: ${initialValue};
}`
}
