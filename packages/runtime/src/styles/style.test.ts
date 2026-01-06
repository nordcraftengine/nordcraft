import type { Component } from '@nordcraft/core/dist/component/component.types'
import { describe, expect, test } from 'bun:test'
import { insertStyles } from './style'

describe('insertStyles() - prefers-reduced-motion', () => {
  test('it inserts styles with prefers-reduced-motion: reduce media query', () => {
    const component: Component = {
      name: 'TestComponent',
      nodes: {
        '0': {
          type: 'element',
          tag: 'div',
          style: {
            color: 'red',
          },
          variants: [
            {
              style: {
                transition: 'none',
                animation: 'none',
              },
              mediaQuery: {
                'prefers-reduced-motion': 'reduce',
              },
            },
          ],
          children: [],
          attrs: {},
          events: {},
        },
      },
    }

    const parent = document.createElement('div')
    insertStyles(parent, component, [])

    const styleElement = parent.querySelector('[data-hash]')
    expect(styleElement).toBeTruthy()

    const styleText = styleElement?.textContent ?? ''

    // Check that the media query for prefers-reduced-motion: reduce is present
    expect(styleText).toContain('@media (prefers-reduced-motion: reduce)')

    // Check that the variant styles are present
    expect(styleText).toContain('transition:none')
    expect(styleText).toContain('animation:none')
  })

  test('it inserts styles with prefers-reduced-motion: no-preference media query', () => {
    const component: Component = {
      name: 'TestComponent',
      nodes: {
        '0': {
          type: 'element',
          tag: 'div',
          style: {},
          variants: [
            {
              style: {
                animation: 'fadeIn 1s',
              },
              mediaQuery: {
                'prefers-reduced-motion': 'no-preference',
              },
            },
          ],
          children: [],
          attrs: {},
          events: {},
        },
      },
    }

    const parent = document.createElement('div')
    insertStyles(parent, component, [])

    const styleElement = parent.querySelector('[data-hash]')
    expect(styleElement).toBeTruthy()

    const styleText = styleElement?.textContent ?? ''

    // Check that the media query for prefers-reduced-motion: no-preference is present
    expect(styleText).toContain(
      '@media (prefers-reduced-motion: no-preference)',
    )

    // Check that the animation property is present
    expect(styleText).toContain('animation:fadeIn 1s')
  })

  test('it combines prefers-reduced-motion with other media queries', () => {
    const component: Component = {
      name: 'TestComponent',
      nodes: {
        '0': {
          type: 'element',
          tag: 'div',
          style: {},
          variants: [
            {
              style: {
                fontSize: '14px',
              },
              mediaQuery: {
                'prefers-reduced-motion': 'reduce',
                'max-width': '768px',
              },
            },
          ],
          children: [],
          attrs: {},
          events: {},
        },
      },
    }

    const parent = document.createElement('div')
    insertStyles(parent, component, [])

    const styleElement = parent.querySelector('[data-hash]')
    expect(styleElement).toBeTruthy()

    const styleText = styleElement?.textContent ?? ''

    // Should combine media queries with 'and'
    expect(styleText).toMatch(
      /@media \(prefers-reduced-motion: reduce\) and \(max-width: 768px\)/,
    )
  })

  test('it handles multiple variants with different motion preferences', () => {
    const component: Component = {
      name: 'TestComponent',
      nodes: {
        '0': {
          type: 'element',
          tag: 'div',
          style: {},
          variants: [
            {
              style: { animation: 'none' },
              mediaQuery: { 'prefers-reduced-motion': 'reduce' },
            },
            {
              style: { animation: 'fadeIn 1s' },
              mediaQuery: { 'prefers-reduced-motion': 'no-preference' },
            },
          ],
          children: [],
          attrs: {},
          events: {},
        },
      },
    }

    const parent = document.createElement('div')
    insertStyles(parent, component, [])

    const styleElement = parent.querySelector('[data-hash]')
    expect(styleElement).toBeTruthy()

    const styleText = styleElement?.textContent ?? ''

    // Check that both media queries are present
    expect(styleText).toContain('@media (prefers-reduced-motion: reduce)')
    expect(styleText).toContain(
      '@media (prefers-reduced-motion: no-preference)',
    )

    // Check that both animation values are present
    expect(styleText).toContain('animation:none')
    expect(styleText).toContain('animation:fadeIn 1s')
  })

  test('it filters out null prefers-reduced-motion values', () => {
    const component: Component = {
      name: 'TestComponent',
      nodes: {
        '0': {
          type: 'element',
          tag: 'div',
          style: {},
          variants: [
            {
              style: { color: 'red' },
              mediaQuery: {
                'prefers-reduced-motion': null,
                'max-width': '768px',
              },
            },
          ],
          children: [],
          attrs: {},
          events: {},
        },
      },
    }

    const parent = document.createElement('div')
    insertStyles(parent, component, [])

    const styleElement = parent.querySelector('[data-hash]')
    expect(styleElement).toBeTruthy()

    const styleText = styleElement?.textContent ?? ''

    // null values should be filtered out
    expect(styleText).not.toContain('prefers-reduced-motion: null')

    // max-width should still be present
    expect(styleText).toContain('max-width: 768px')
  })
})
