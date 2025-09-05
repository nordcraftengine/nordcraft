import { describe, expect, test } from 'bun:test'
import type { CssSyntax, CssSyntaxNode } from './customProperty'
import { renderSyntaxDefinition, stringifySyntaxNode } from './customProperty'
import type { CustomPropertyDefinition } from './theme'

describe('stringifySyntaxNode()', () => {
  ;['length', 'number', 'percentage', 'length-percentage', 'color'].forEach(
    (primitive) => {
      test(
        'it handles a comprehensive list of primitives: ' + primitive,
        () => {
          const node: CssSyntaxNode = {
            type: 'primitive',
            name: primitive as CssSyntax,
          }
          expect(stringifySyntaxNode(node)).toBe(`<${primitive}>`)
        },
      )
    },
  )

  test('it handles keyword nodes', () => {
    const node: CssSyntaxNode = {
      type: 'keyword',
      keywords: ['auto', 'inherit', 'initial'],
    }
    expect(stringifySyntaxNode(node)).toBe('auto | inherit | initial')
  })
})

describe('renderSyntaxDefinition()', () => {
  test('it generates a valid property definition', () => {
    const property: CustomPropertyDefinition = {
      syntax: {
        type: 'primitive',
        name: 'length',
      },
      description: 'My custom property',
      inherits: true,
      initialValue: '0px',
    }
    expect(renderSyntaxDefinition('--my-property', property)).toBe(
      '@property --my-property {\n  syntax: "<length>";\n  inherits: true;\n  initial-value: 0px;\n}',
    )
  })
})
