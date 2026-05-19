import { describe, expect, test } from 'bun:test'
import type { CssSyntax, CssSyntaxNode } from './customProperty'
import {
  renderSyntaxDefinition,
  stringifySyntaxNode,
  validateInitialValue,
} from './customProperty'
import type { CustomPropertyDefinition, Theme } from './theme'

describe('validateInitialValue()', () => {
  test('it validates color', () => {
    const syntax: CssSyntaxNode = { type: 'primitive', name: 'color' }
    expect(validateInitialValue(syntax, 'red')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '#ff0000')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, 'rgb(255, 0, 0)')).toEqual({
      valid: true,
    })
    expect(validateInitialValue(syntax, 'rgba(255, 0, 0, 0.5)')).toEqual({
      valid: true,
    })
    expect(validateInitialValue(syntax, 'invalid')).toEqual({ valid: true }) // Named colors are allowed loosely
    expect(validateInitialValue(syntax, '123')).toEqual({
      valid: false,
      error: 'invalid format',
    })
    expect(validateInitialValue(syntax, 'var(--color)')).toEqual({
      valid: false,
      error: 'computationally dependent',
    })
  })

  test('it validates length', () => {
    const syntax: CssSyntaxNode = { type: 'primitive', name: 'length' }
    expect(validateInitialValue(syntax, '10px')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '10vh')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '10vw')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, 'calc(10vh)')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '1.5em')).toEqual({
      valid: false,
      error: 'computationally dependent',
    })
    expect(validateInitialValue(syntax, '0')).toEqual({
      valid: false,
      error: 'invalid format',
    })
    expect(validateInitialValue(syntax, '10%')).toEqual({
      valid: false,
      error: 'invalid format',
    })
  })

  test('it validates length-percentage', () => {
    const syntax: CssSyntaxNode = {
      type: 'primitive',
      name: 'length-percentage',
    }
    expect(validateInitialValue(syntax, '10px')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '10vh')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '10%')).toEqual({
      valid: false,
      error: 'computationally dependent',
    })
    expect(validateInitialValue(syntax, 'abc')).toEqual({
      valid: false,
      error: 'invalid format',
    })
  })

  test('it validates number', () => {
    const syntax: CssSyntaxNode = { type: 'primitive', name: 'number' }
    expect(validateInitialValue(syntax, '10')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '10.5')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '-5')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '10px')).toEqual({
      valid: false,
      error: 'invalid format',
    })
  })

  test('it validates percentage', () => {
    const syntax: CssSyntaxNode = { type: 'primitive', name: 'percentage' }
    expect(validateInitialValue(syntax, '10%')).toEqual({
      valid: false,
      error: 'computationally dependent',
    })
    expect(validateInitialValue(syntax, '10.5%')).toEqual({
      valid: false,
      error: 'computationally dependent',
    })
    expect(validateInitialValue(syntax, '10')).toEqual({
      valid: false,
      error: 'invalid format',
    })
  })

  test('it validates angle', () => {
    const syntax: CssSyntaxNode = { type: 'primitive', name: 'angle' }
    expect(validateInitialValue(syntax, '90deg')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '1turn')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '10')).toEqual({
      valid: false,
      error: 'invalid format',
    })
  })

  test('it validates time', () => {
    const syntax: CssSyntaxNode = { type: 'primitive', name: 'time' }
    expect(validateInitialValue(syntax, '1s')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '100ms')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '10')).toEqual({
      valid: false,
      error: 'invalid format',
    })
  })

  test('it validates custom-ident', () => {
    const syntax: CssSyntaxNode = { type: 'primitive', name: 'custom-ident' }
    expect(validateInitialValue(syntax, 'my-ident')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, '1ident')).toEqual({
      valid: false,
      error: 'invalid format',
    })
  })

  test('it validates string', () => {
    const syntax: CssSyntaxNode = { type: 'primitive', name: 'string' }
    expect(validateInitialValue(syntax, '"hello"')).toEqual({ valid: true })
    expect(validateInitialValue(syntax, "'hello'")).toEqual({ valid: true })
    expect(validateInitialValue(syntax, 'hello')).toEqual({
      valid: false,
      error: 'invalid format',
    })
  })
})

describe('stringifySyntaxNode()', () => {
  ;['length', 'number', 'percentage', 'length', 'color'].forEach(
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
      values: {
        default: '10px',
      },
    }
    expect(
      renderSyntaxDefinition('--my-property', property, {
        fonts: [],
      }),
    ).toBe(
      '@property --my-property {\n  syntax: "<length>";\n  inherits: true;\n  initial-value: 0px;\n}',
    )
  })

  test('it solves var(--...) references', () => {
    const themes: Record<string, Theme> = {
      default: {
        fonts: [],
        propertyDefinitions: {
          '--my-property': {
            syntax: { type: 'primitive', name: 'color' },
            description: '',
            inherits: true,
            initialValue: 'var(--primary-color)',
            values: { default: 'rebeccapurple' },
          },
          '--primary-color': {
            syntax: { type: 'primitive', name: 'color' },
            description: '',
            inherits: true,
            initialValue: 'var(--red-500)',
            values: { default: 'rebeccapurple' },
          },
          '--red-500': {
            syntax: { type: 'primitive', name: 'color' },
            description: '',
            inherits: true,
            initialValue: '#f00',
            values: { default: 'rebeccapurple' },
          },
        },
      },
    }

    expect(
      renderSyntaxDefinition(
        '--my-property',
        themes.default.propertyDefinitions!['--my-property'],
        themes.default,
      ),
    ).toBe(
      '@property --my-property {\n  syntax: "<color>";\n  inherits: true;\n  initial-value: #f00;\n}',
    )
  })

  test('it renders a fallback initial-value on broken references', () => {
    const themes: Record<string, Theme> = {
      default: {
        fonts: [],
        propertyDefinitions: {
          '--my-property': {
            syntax: { type: 'primitive', name: 'color' },
            description: '',
            inherits: true,
            initialValue: 'var(--unknown-color)',
            values: { default: 'rebeccapurple' },
          },
        },
      },
    }

    expect(
      renderSyntaxDefinition(
        '--my-property',
        themes.default.propertyDefinitions!['--my-property'],
        themes.default,
      ),
    ).toBe(
      '@property --my-property {\n  syntax: "<color>";\n  inherits: true;\n  initial-value: transparent;\n}',
    )
  })

  test('it handles the any (*) syntax', () => {
    const property: CustomPropertyDefinition = {
      syntax: {
        type: 'primitive',
        name: '*',
      },
      description: 'My custom property',
      inherits: true,
      initialValue: 'none',
      values: {
        default: '10px',
      },
    }
    expect(
      renderSyntaxDefinition('--my-property', property, {
        fonts: [],
      }),
    ).toBe(
      '@property --my-property {\n  syntax: "*";\n  inherits: true;\n  initial-value: none;\n}',
    )
  })
})
