import { describe, expect, test } from 'bun:test'
import type { CssSyntax, CssSyntaxNode, StyleProperty } from './styleProperty'
import {
  stringifySyntaxNode,
  syntaxNodeToPropertyAtDefinition,
} from './styleProperty'

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

describe('syntaxNodeToPropertyAtDefinition()', () => {
  test('it generates a valid property definition', () => {
    const property: StyleProperty = {
      name: 'my-property',
      syntax: {
        type: 'primitive',
        name: 'length',
      },
      formula: { type: 'value', value: '10px' },
    }
    expect(syntaxNodeToPropertyAtDefinition(property)).toBe(
      '@property --my-property {\n  syntax: "<length>";\n  inherits: true;\n  initial-value: 0px;\n}',
    )
  })
})
