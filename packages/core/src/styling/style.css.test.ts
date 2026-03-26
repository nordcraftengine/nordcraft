import { describe, expect, test } from 'bun:test'
import type { Component } from '../component/component.types'
import { getClassName } from './className'
import {
  createStylesheet,
  getNodeStyles,
  kebabCase,
  styleToCss,
} from './style.css'
import { theme as defaultTheme } from './theme.const'

describe('styleToCss()', () => {
  test('it converts style object to CSS', () => {
    const style = {
      color: 'red',
    }

    const css = styleToCss(style)

    expect(css).toBe(`color:red;`)
  })

  test('it converts camelCase properties to kebab-case', () => {
    const style = {
      backgroundColor: 'blue',
      marginTop: '10px',
    }

    const css = styleToCss(style)

    expect(css).toBe(`background-color:blue;
      margin-top:10px;`)
  })

  test('it filters out undefined and null values', () => {
    const style: any = {
      color: 'red',
      backgroundColor: undefined,
      marginTop: null,
    }

    const css = styleToCss(style)

    expect(css).toBe(`color:red;`)
  })
})

describe('kebabCase()', () => {
  test('it converts camelCase to kebab-case', () => {
    expect(kebabCase('backgroundColor')).toBe('background-color')
    expect(kebabCase('marginTop')).toBe('margin-top')
    expect(kebabCase('fontSize')).toBe('font-size')
  })

  test('it converts PascalCase to kebab-case', () => {
    expect(kebabCase('BackgroundColor')).toBe('background-color')
    expect(kebabCase('MarginTop')).toBe('margin-top')
  })

  test('it handles strings with multiple uppercase letters', () => {
    expect(kebabCase('marginTopLeft')).toBe('margin-top-left')
    expect(kebabCase('backgroundColorRed')).toBe('background-color-red')
  })

  test('it handles already kebab-case strings', () => {
    expect(kebabCase('background-color')).toBe('background-color')
    expect(kebabCase('margin-top')).toBe('margin-top')
  })

  test('it handles empty string', () => {
    expect(kebabCase('')).toBe('')
  })

  test('it handles single character', () => {
    expect(kebabCase('a')).toBe('a')
    expect(kebabCase('A')).toBe('a')
  })
})

describe('getNodeStyles()', () => {
  test('it generates CSS for a simple node', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'red',
        backgroundColor: 'blue',
      },
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:red;
      background-color:blue;
    }`)
  })

  test('it generates CSS for node with hover variant', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'blue',
      },
      variants: [
        {
          hover: true,
          style: {
            color: 'red',
          },
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:blue;
    }

    .${classHash}:hover {
      color:red;
    }`)
  })

  test('it generates CSS for node with multiple variants', () => {
    const node = {
      type: 'element' as const,
      tag: 'button',
      style: {
        color: 'black',
      },
      variants: [
        {
          hover: true,
          style: {
            color: 'blue',
          },
        },
        {
          focus: true,
          style: {
            color: 'green',
          },
        },
        {
          active: true,
          style: {
            color: 'red',
          },
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:black;
    }

    .${classHash}:hover {
      color:blue;
    }

    .${classHash}:focus {
      color:green;
    }

    .${classHash}:active {
      color:red;
    }`)
  })

  test('it generates CSS for node with media query variant', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        fontSize: '16px',
      },
      variants: [
        {
          style: {
            fontSize: '14px',
          },
          mediaQuery: {
            'max-width': '768px',
          },
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      font-size:16px;
    }

    @media (max-width: 768px) {

    .${classHash} {
      font-size:14px;
    }
    }`)
  })

  test('it generates CSS for node with prefers-reduced-motion reduce variant', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'blue',
      },
      variants: [
        {
          style: {
            transition: 'none',
            animation: 'none',
          },
          mediaQuery: {
            'prefers-reduced-motion': 'reduce' as const,
          },
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:blue;
    }

    @media (prefers-reduced-motion: reduce) {

    .${classHash} {
      transition:none;
      animation:none;
    }
    }`)
  })

  test('it generates CSS for node with prefers-reduced-motion no-preference variant', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'blue',
      },
      variants: [
        {
          style: {
            animation: 'fadeIn 1s',
          },
          mediaQuery: {
            'prefers-reduced-motion': 'no-preference' as const,
          },
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:blue;
    }

    @media (prefers-reduced-motion: no-preference) {

    .${classHash} {
      animation:fadeIn 1s;
    }
    }`)
  })

  test('it generates CSS for node with prefers-reduced-motion combined with other media queries', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        fontSize: '16px',
      },
      variants: [
        {
          style: {
            fontSize: '14px',
          },
          mediaQuery: {
            'prefers-reduced-motion': 'reduce' as const,
            'max-width': '768px',
          },
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      font-size:16px;
    }

    @media (prefers-reduced-motion: reduce) and (max-width: 768px) {

    .${classHash} {
      font-size:14px;
    }
    }`)
  })

  test('it generates CSS for node with breakpoint variant', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        fontSize: '16px',
      },
      variants: [
        {
          style: {
            fontSize: '18px',
          },
          breakpoint: 'medium' as const,
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      font-size:16px;
    }

    @media (min-width: 960px) {

    .${classHash} {
      font-size:18px;
    }
    }`)
  })

  test('it generates CSS for node with animations', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'red',
      },
      variants: undefined,
      animations: {
        'fade-in': {
          '0': {
            key: 'opacity',
            position: 0,
            value: '0',
          },
          '1': {
            key: 'opacity',
            position: 1,
            value: '1',
          },
        },
      },
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const animationHashes = new Set<string>()
    const css = getNodeStyles(node, classHash, animationHashes)

    expect(css).toBe(`

    .${classHash} {
      color:red;
    }

    @keyframes fade-in {
        0% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
    }`)
    expect(animationHashes.has('fade-in')).toBe(true)
  })

  test('it tracks animation hashes to prevent duplicates', () => {
    const node1 = {
      type: 'element' as const,
      tag: 'div',
      style: { color: 'red' },
      variants: undefined,
      animations: {
        'fade-in': {
          '0': {
            key: 'opacity',
            position: 0,
            value: '0',
          },
          '1': {
            key: 'opacity',
            position: 1,
            value: '1',
          },
        },
      },
      children: [],
      attrs: {},
      events: {},
    }

    const node2 = {
      type: 'element' as const,
      tag: 'span',
      style: { color: 'blue' },
      variants: undefined,
      animations: {
        'fade-in': {
          '0': {
            key: 'opacity',
            position: 0,
            value: '0',
          },
          '1': {
            key: 'opacity',
            position: 1,
            value: '1',
          },
        },
      },
      children: [],
      attrs: {},
      events: {},
    }

    const animationHashes = new Set<string>()
    const css1 = getNodeStyles(node1, 'hash1', animationHashes)
    const css2 = getNodeStyles(node2, 'hash2', animationHashes)

    expect(css1).toBe(`

    .hash1 {
      color:red;
    }

    @keyframes fade-in {
        0% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
    }`)
    expect(css2).toBe(`

    .hash2 {
      color:blue;
    }`)
  })

  test('it generates CSS for node with scrollbar-width', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'red',
        'scrollbar-width': 'thin' as const,
      },
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:red;
      scrollbar-width:thin;
    }

    .${classHash}::-webkit-scrollbar {
    width: 4px;
    }`)
  })

  test('it handles scrollbar-width none', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'red',
        'scrollbar-width': 'none' as const,
      },
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:red;
      scrollbar-width:none;
    }

    .${classHash}::-webkit-scrollbar {
    width: 0;
    }`)
  })

  test('it generates CSS for node with startingStyle variant', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'blue',
      },
      variants: [
        {
          style: {
            color: 'red',
          },
          startingStyle: true,
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:blue;
    }

    .${classHash} {
      
    @starting-style {
      color:red;
    }
    }`)
  })

  test('it handles node with empty style', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {},
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(``)
  })

  test('it handles node with undefined style', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: undefined,
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(``)
  })

  test('it handles legacy variants stored in style object', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'blue',
        variants: [
          {
            hover: true,
            style: {
              color: 'red',
            },
          },
        ],
      } as any,
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:blue;
    }

    .${classHash}:hover {
      color:red;
    }`)
  })

  test('it omits variants, breakpoints, and shadows from style', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'red',
        variants: [{ hover: true, style: { color: 'blue' } }],
        breakpoints: {},
        shadows: [],
      } as any,
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'test-hash'
    const css = getNodeStyles(node, classHash)

    // Note: variants in style object are still rendered (legacy support)
    // but breakpoints and shadows are omitted
    expect(css).toBe(`

    .${classHash} {
      color:red;
    }

    .${classHash}:hover {
      color:blue;
    }`)
  })

  test('it handles ComponentNodeModel', () => {
    const node = {
      type: 'component' as const,
      name: 'TestComponent',
      style: {
        color: 'purple',
      },
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const classHash = 'component-hash'
    const css = getNodeStyles(node, classHash)

    expect(css).toBe(`

    .${classHash} {
      color:purple;
    }`)
  })
})

describe('createStylesheet()', () => {
  test('it generates CSS for a simple component', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'red',
      },
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const component: Component = {
      name: 'TestComponent',
      nodes: {
        '0': node,
      },
    }

    const classHash = getClassName([node.style, node.variants])
    const stylesheet = createStylesheet(
      component,
      [],
      { defaultTheme },
      { includeResetStyle: false, createFontFaces: false },
    )

    expect(stylesheet).toContain(`    .${classHash} {
      color:red;
    }`)
  })

  test('it generates CSS for component with variants', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'blue',
      },
      variants: [
        {
          hover: true,
          style: {
            color: 'red',
          },
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const component: Component = {
      name: 'TestComponent',
      nodes: {
        '0': node,
      },
    }

    const classHash = getClassName([node.style, node.variants])
    const stylesheet = createStylesheet(
      component,
      [],
      { defaultTheme },
      { includeResetStyle: false, createFontFaces: false },
    )

    expect(stylesheet).toContain(`
    .${classHash} {
      color:blue;
    }`)
    expect(stylesheet).toContain(`
    .${classHash}:hover {
      color:red;
    }`)
  })

  test('it generates CSS for component with media query variants', () => {
    const node = {
      type: 'element' as const,
      tag: 'div',
      style: {
        fontSize: '16px',
      },
      variants: [
        {
          style: {
            fontSize: '14px',
          },
          mediaQuery: {
            'max-width': '768px',
          },
        },
      ],
      children: [],
      attrs: {},
      events: {},
    }

    const component: Component = {
      name: 'TestComponent',
      nodes: {
        '0': node,
      },
    }

    const classHash = getClassName([node.style, node.variants])
    const stylesheet = createStylesheet(
      component,
      [],
      { defaultTheme },
      { includeResetStyle: false, createFontFaces: false },
    )

    expect(stylesheet).toContain(`
    .${classHash} {
      font-size:16px;
    }`)
    // Check for media query with the variant styles
    expect(stylesheet).toContain('@media (max-width: 768px)')
    expect(stylesheet).toContain(`
    .${classHash} {
      font-size:14px;
    }`)
  })

  test('it handles empty component', () => {
    const component: Component = {
      name: 'EmptyComponent',
      nodes: {},
    }

    const stylesheet = createStylesheet(
      component,
      [],
      { defaultTheme },
      { includeResetStyle: false, createFontFaces: false },
    )

    expect(stylesheet).toContain('body, :host {')
  })

  test('it handles component with multiple nodes', () => {
    const node0 = {
      type: 'element' as const,
      tag: 'div',
      style: {
        color: 'red',
      },
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const node1 = {
      type: 'element' as const,
      tag: 'span',
      style: {
        color: 'blue',
      },
      variants: undefined,
      children: [],
      attrs: {},
      events: {},
    }

    const component: Component = {
      name: 'MultiNodeComponent',
      nodes: {
        '0': node0,
        '1': node1,
      },
    }

    const classHash0 = getClassName([node0.style, node0.variants])
    const classHash1 = getClassName([node1.style, node1.variants])
    const stylesheet = createStylesheet(
      component,
      [],
      { defaultTheme },
      { includeResetStyle: false, createFontFaces: false },
    )

    expect(stylesheet).toContain(`
    .${classHash0} {
      color:red;
    }`)
    expect(stylesheet).toContain(`
    .${classHash1} {
      color:blue;
    }`)
  })
})
