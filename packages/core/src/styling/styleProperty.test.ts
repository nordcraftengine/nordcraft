import { describe, expect, test } from 'bun:test'
import type { CustomProperty } from '../component/component.types'
import type { CssSyntax, CssSyntaxNode } from './styleProperty'
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
    const property: CustomProperty = {
      syntax: {
        type: 'primitive',
        name: 'length',
      },
      formula: { type: 'value', value: '10px' },
    }
    expect(syntaxNodeToPropertyAtDefinition('--my-property', property)).toBe(
      '@property --my-property {\n  syntax: "<length>";\n  inherits: true;\n  initial-value: 0px;\n}',
    )
  })
})
