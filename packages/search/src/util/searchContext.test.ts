import { describe, expect, test } from 'bun:test'
import { getFormulaPathContext, getNodeAncestorsContext } from './searchContext'

describe('searchContext', () => {
  describe('getNodeAncestorsContext', () => {
    test('should return an empty array if nodes or targetNodeId is falsy', () => {
      expect(getNodeAncestorsContext(undefined, 'node-1')).toEqual([])
      expect(getNodeAncestorsContext({}, '')).toEqual([])
    })

    test('should return empty array for root node with no parent', () => {
      const nodes = {
        root: {
          type: 'element',
          tag: 'div',
          children: [],
        },
      }
      expect(getNodeAncestorsContext(nodes, 'root')).toEqual([])
    })

    test('should return array of ancestors for single level nesting', () => {
      const nodes = {
        parent: {
          type: 'element',
          tag: 'div',
          children: ['child'],
        },
        child: {
          type: 'element',
          tag: 'span',
          children: [],
        },
      }
      expect(getNodeAncestorsContext(nodes, 'child')).toEqual([
        { id: 'parent', tag: 'div' },
      ])
    })

    test('should return multiple ancestors with proper order (topmost first)', () => {
      const nodes = {
        gparent: {
          type: 'element',
          tag: 'section',
          children: ['parent'],
        },
        parent: {
          type: 'component',
          name: 'ui-card',
          children: ['child'],
        },
        child: {
          type: 'element',
          tag: 'button',
          children: [],
        },
      }
      expect(getNodeAncestorsContext(nodes, 'child')).toEqual([
        { id: 'gparent', tag: 'section' },
        { id: 'parent', tag: 'ui-card' },
      ])
    })

    test('should fallback to name parameter for component or nextId if tag/name is missing', () => {
      const nodes = {
        parentComponent: {
          type: 'component',
          name: 'custom-element',
          children: ['child'],
        },
        fallbackParent: {
          type: 'unknown',
          children: ['child2'],
        },
        child: {
          tag: 'div',
          children: [],
        },
        child2: {
          tag: 'span',
          children: [],
        },
      }
      expect(getNodeAncestorsContext(nodes, 'child')).toEqual([
        { id: 'parentComponent', tag: 'custom-element' },
      ])
      expect(getNodeAncestorsContext(nodes, 'child2')).toEqual([
        { id: 'fallbackParent', tag: 'fallbackParent' },
      ])
    })

    test('should stop when limit is exceeded or there is a loop', () => {
      const nodes = {
        nodeA: {
          type: 'element',
          tag: 'div',
          children: ['nodeB'],
        },
        nodeB: {
          type: 'element',
          tag: 'span',
          children: ['nodeA'],
        },
      }
      // Infinite loop nodeA -> child nodeB -> child nodeA. Limit will kick in and terminate.
      const ancestors = getNodeAncestorsContext(nodes, 'nodeA')
      expect(ancestors.length).toBeLessThan(102)
      expect(ancestors[0].tag).toBeDefined()
    })
  })

  describe('getFormulaPathContext', () => {
    const files = {
      components: {
        'comp-1': {
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              children: ['nested'],
            },
            nested: {
              type: 'element',
              tag: 'span',
              children: [],
            },
          },
        },
      },
    }

    test('should return empty string for unhandled paths', () => {
      expect(getFormulaPathContext(['random', 'path'], files)).toBe('')
    })

    test('should compute formula context for nodes under a components basic path', () => {
      const path = ['components', 'comp-1', 'nodes', 'nested']
      expect(getFormulaPathContext(path, files)).toBe('div > span > ')
    })

    test('should compute formula context for nested node attributes', () => {
      const path = ['components', 'comp-1', 'nodes', 'nested', 'attrs', 'title']
      expect(getFormulaPathContext(path, files)).toBe('div > span > title > ')
    })

    test('should compute formula context for nested node styles', () => {
      const path = ['components', 'comp-1', 'nodes', 'nested', 'style', 'color']
      expect(getFormulaPathContext(path, files)).toBe(
        'div > span > style > color > ',
      )
    })

    test('should compute formula context for nested node variants', () => {
      const path = [
        'components',
        'comp-1',
        'nodes',
        'nested',
        'variants',
        0,
        'style',
        'margin',
      ]
      expect(getFormulaPathContext(path, files)).toBe(
        'div > span > variant > margin > ',
      )
    })

    test('should compute formula context for formulas in component', () => {
      const path = ['components', 'comp-1', 'formulas', 'my-math']
      expect(getFormulaPathContext(path, files)).toBe('formulas > my-math > ')
    })

    test('should compute formula context for workflows in component', () => {
      const path = ['components', 'comp-1', 'workflows', 'my-wf']
      expect(getFormulaPathContext(path, files)).toBe('workflows > my-wf > ')
    })

    test('should compute formula context for contexts in component', () => {
      const path = ['components', 'comp-1', 'contexts', 'my-context']
      expect(getFormulaPathContext(path, files)).toBe(
        'contexts > my-context > ',
      )
    })

    test('should compute formula context for variables in component', () => {
      const path = ['components', 'comp-1', 'variables', 'my-var']
      expect(getFormulaPathContext(path, files)).toBe('variables > my-var > ')
    })

    test('should compute formula context for apis in component', () => {
      const path = ['components', 'comp-1', 'apis', 'my-api']
      expect(getFormulaPathContext(path, files)).toBe('apis > my-api > ')
    })

    test('should compute formula context for global formulas', () => {
      const path = ['formulas', 'global-calc']
      expect(getFormulaPathContext(path, files)).toBe(
        'formulas > global-calc > ',
      )
    })
  })
})
