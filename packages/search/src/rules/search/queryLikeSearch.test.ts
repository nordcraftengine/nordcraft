import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import {
  createComponentRefSearchRule,
  shouldRun as shouldRunComponentRef,
} from './componentRefSearchRule'
import {
  createComponentSearchRule,
  shouldRun as shouldRunComponent,
} from './componentSearchRule'
import {
  createFormulaRefSearchRule,
  shouldRun as shouldRunFormulaRef,
} from './formulaRefSearchRule'
import {
  createFormulaSearchRule,
  shouldRun as shouldRunFormula,
} from './formulaSearchRule'
import {
  createWorkflowRefSearchRule,
  shouldRun as shouldRunWorkflowRef,
} from './workflowRefSearchRule'
import {
  createWorkflowSearchRule,
  shouldRun as shouldRunWorkflow,
} from './workflowSearchRule'

describe('Query-like Search Predicates', () => {
  test('component predicate', () => {
    expect(shouldRunComponent('component:my-component')).toBe(true)
    expect(shouldRunComponent('component:my-*')).toBe(true)
    expect(shouldRunComponent('ref:component:my-component')).toBe(false)
    expect(shouldRunComponent('/component:my-component/')).toBe(false)
  })

  test('component ref predicate', () => {
    expect(shouldRunComponentRef('ref:component:my-component')).toBe(true)
    expect(shouldRunComponentRef('ref:component:my-*')).toBe(true)
    expect(shouldRunComponentRef('component:my-component')).toBe(false)
    expect(shouldRunComponentRef('/ref:component my-component/')).toBe(false)
  })

  test('workflow predicate', () => {
    expect(shouldRunWorkflow('workflow:my-workflow')).toBe(true)
    expect(shouldRunWorkflow('workflow:my-*')).toBe(true)
    expect(shouldRunWorkflow('ref:workflow:my-workflow')).toBe(false)
    expect(shouldRunWorkflow('/workflow:my-workflow/')).toBe(false)
  })

  test('workflow ref predicate', () => {
    expect(shouldRunWorkflowRef('ref:workflow:my-workflow')).toBe(true)
    expect(shouldRunWorkflowRef('ref:workflow:my-*')).toBe(true)
    expect(shouldRunWorkflowRef('/ref:workflow my-workflow/')).toBe(false)
  })

  test('formula predicate', () => {
    expect(shouldRunFormula('formula:my-formula')).toBe(true)
    expect(shouldRunFormula('formula:my-*')).toBe(true)
    expect(shouldRunFormula('ref:formula:my-formula')).toBe(false)
    expect(shouldRunFormula('/formula:my-formula/')).toBe(false)
  })

  test('formula ref predicate', () => {
    expect(shouldRunFormulaRef('ref:formula:my-formula')).toBe(true)
    expect(shouldRunFormulaRef('ref:formula:my-*')).toBe(true)
    expect(shouldRunFormulaRef('/ref:formula my-formula/')).toBe(false)
  })
})

describe('Component and Component Reference Search', () => {
  const files: ProjectFiles = {
    formulas: {},
    components: {
      'my-component': {
        name: 'my-component',
        nodes: {},
        formulas: {},
        apis: {},
        attributes: {},
        variables: {},
        route: { path: [], query: {} },
        workflows: {},
      },
      IconLink: {
        name: 'IconLink',
        nodes: {},
        formulas: {},
        apis: {},
        attributes: {},
        variables: {},
        route: { path: [], query: {} },
        workflows: {},
      },
      ElementIcon: {
        name: 'ElementIcon',
        nodes: {},
        formulas: {},
        apis: {},
        attributes: {},
        variables: {},
        route: { path: [], query: {} },
        workflows: {},
      },
      'other-component': {
        name: 'other-component',
        nodes: {
          inst: {
            type: 'component',
            name: 'my-component',
            attrs: {},
            children: [],
          },
          parentDiv: {
            type: 'element',
            tag: 'div',
            attrs: {},
            children: ['typoLabel'],
          },
          typoLabel: {
            type: 'component',
            name: 'ui-typography',
            attrs: {},
            children: ['nestedInst'],
          },
          nestedInst: {
            type: 'component',
            name: 'my-component',
            attrs: {},
            children: [],
          },
        },
        formulas: {},
        apis: {},
        attributes: {},
        variables: {},
        route: { path: [], query: {} },
        workflows: {},
      },
    },
  }

  test('find component by name exactly', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [createComponentSearchRule({ query: 'component:my-component' })],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual(['components', 'my-component'])
    expect(results[0].details?.context).toEqual({
      before: 'components > ',
      matched: 'my-component',
      after: '',
    })
  })

  test('find component with wildcard', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [createComponentSearchRule({ query: 'component:my-*' })],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual(['components', 'my-component'])
  })

  test('extract wildcard before and after contexts', () => {
    // 1. "component:Icon*" finds "IconLink" -> "Link" should be in the after context
    const resultsSuffix = Array.from(
      searchProject({
        files,
        rules: [createComponentSearchRule({ query: 'component:Icon*' })],
      }),
    )
    // Suffix wildcard: IconLink matches. ElementIcon does not match because it doesn't start with Icon.
    expect(resultsSuffix).toHaveLength(1)
    expect(resultsSuffix[0].path).toEqual(['components', 'IconLink'])
    expect(resultsSuffix[0].details?.context).toEqual({
      before: 'components > ',
      matched: 'Icon',
      after: 'Link',
    })

    // 2. "component:*Icon*" finds "ElementIcon" -> "Element" should be part of the before
    const resultsBoth = Array.from(
      searchProject({
        files,
        rules: [createComponentSearchRule({ query: 'component:*Icon*' })],
      }),
    )
    expect(resultsBoth).toHaveLength(2)
    const elementIconResult = resultsBoth.find(
      (r) => r.path[1] === 'ElementIcon',
    )
    expect(elementIconResult).toBeDefined()
    expect(elementIconResult?.details?.context).toEqual({
      before: 'components > Element',
      matched: 'Icon',
      after: '',
    })

    const iconLinkResult = resultsBoth.find((r) => r.path[1] === 'IconLink')
    expect(iconLinkResult).toBeDefined()
    expect(iconLinkResult?.details?.context).toEqual({
      before: 'components > ',
      matched: 'Icon',
      after: 'Link',
    })
  })

  test('find component references exactly', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createComponentRefSearchRule({ query: 'ref:component:my-component' }),
        ],
      }),
    )
    expect(results).toHaveLength(2)

    // First result: inst (no ancestors)
    const res1 = results.find((r) => r.path[3] === 'inst')
    expect(res1).toBeDefined()
    expect(res1?.path).toEqual([
      'components',
      'other-component',
      'nodes',
      'inst',
    ])
    expect(res1?.details?.context).toEqual({
      before: '',
      matched: 'my-component',
      after: '',
    })

    // Second result: nestedInst (with ancestors: parentDiv -> typoLabel)
    const res2 = results.find((r) => r.path[3] === 'nestedInst')
    expect(res2).toBeDefined()
    expect(res2?.path).toEqual([
      'components',
      'other-component',
      'nodes',
      'nestedInst',
    ])
    expect(res2?.details?.context).toEqual({
      before: 'div > ui-typography > ',
      matched: 'my-component',
      after: '',
    })
  })
})

describe('Workflow and Workflow Reference Search', () => {
  const files: ProjectFiles = {
    formulas: {},
    components: {
      'my-component': {
        name: 'my-component',
        nodes: {},
        formulas: {},
        apis: {},
        attributes: {},
        variables: {},
        route: { path: [], query: {} },
        workflows: {
          'save-user': {
            name: 'save-user',
            actions: [
              {
                id: 'trig',
                type: 'TriggerWorkflow',
                workflow: 'fetch-data',
              },
            ],
          },
          'fetch-data': {
            name: 'fetch-data',
            actions: [],
          },
        },
        contexts: {
          'some-context': {
            formulas: [],
            workflows: ['special-wf'],
          },
        },
      },
    },
  }

  test('find workflow by name', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [createWorkflowSearchRule({ query: 'workflow:save-user' })],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'my-component',
      'workflows',
      'save-user',
    ])
  })

  test('find workflow with wildcard', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [createWorkflowSearchRule({ query: 'workflow:*-user' })],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'my-component',
      'workflows',
      'save-user',
    ])
  })

  test('find workflow references', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createWorkflowRefSearchRule({ query: 'ref:workflow:fetch-data' }),
        ],
      }),
    )
    // One match inside actions of save-user
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'my-component',
      'workflows',
      'save-user',
      'actions',
      '0',
    ])
    expect(results[0].details?.context).toEqual({
      before: 'workflows > save-user > ',
      matched: 'fetch-data',
      after: '',
    })
  })

  test('find workflow references inside context definitions', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createWorkflowRefSearchRule({ query: 'ref:workflow:special-wf' }),
        ],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'my-component',
      'contexts',
      'some-context',
    ])
    expect(results[0].details?.context).toEqual({
      before: 'contexts > some-context > ',
      matched: 'special-wf',
      after: '',
    })
  })
})

describe('Formula and Formula Reference Search', () => {
  const files: ProjectFiles = {
    formulas: {
      'global-formula': {
        name: 'global-formula',
        formula: {
          type: 'function',
          name: 'some-func',
          arguments: [],
        },
      },
    },
    components: {
      'my-component': {
        name: 'my-component',
        nodes: {
          divNode: {
            type: 'element',
            tag: 'div',
            attrs: {
              title: {
                type: 'apply',
                name: 'local-formula',
                arguments: [],
              },
              subtitle: {
                type: 'function',
                name: 'global-formula',
                arguments: [],
              },
              contexted: {
                type: 'path',
                path: ['Contexts', 'context-comp', 'shared-formula'],
              },
            },
            children: [],
          },
        },
        formulas: {
          'local-formula': {
            name: 'local-formula',
            formula: {
              type: 'value',
              value: 123,
            },
          },
        },
        apis: {},
        attributes: {},
        variables: {},
        route: { path: [], query: {} },
        workflows: {},
        contexts: {
          'context-comp': {
            formulas: ['shared-formula'],
            workflows: [],
          },
        },
      },
    },
  }

  test('find local and global formulas', () => {
    const resultsLocal = Array.from(
      searchProject({
        files,
        rules: [createFormulaSearchRule({ query: 'formula:local-formula' })],
      }),
    )
    expect(resultsLocal).toHaveLength(1)
    expect(resultsLocal[0].path).toEqual([
      'components',
      'my-component',
      'formulas',
      'local-formula',
    ])
    expect(resultsLocal[0].details?.context).toEqual({
      before: 'formulas > ',
      matched: 'local-formula',
      after: '',
    })

    const resultsGlobal = Array.from(
      searchProject({
        files,
        rules: [createFormulaSearchRule({ query: 'formula:global-formula' })],
      }),
    )
    expect(resultsGlobal).toHaveLength(1)
    expect(resultsGlobal[0].path).toEqual(['formulas', 'global-formula'])
    expect(resultsGlobal[0].details?.context).toEqual({
      before: 'formulas > ',
      matched: 'global-formula',
      after: '',
    })
  })

  test('find formula references (local apply)', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createFormulaRefSearchRule({ query: 'ref:formula:local-formula' }),
        ],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'my-component',
      'nodes',
      'divNode',
      'attrs',
      'title',
    ])
    expect(results[0].details?.context).toEqual({
      before: 'div > title > ',
      matched: 'local-formula',
      after: '',
    })
  })

  test('find formula references (global function)', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createFormulaRefSearchRule({ query: 'ref:formula:global-formula' }),
        ],
      }),
    )
    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'my-component',
      'nodes',
      'divNode',
      'attrs',
      'subtitle',
    ])
    expect(results[0].details?.context).toEqual({
      before: 'div > subtitle > ',
      matched: 'global-formula',
      after: '',
    })
  })

  test('find formula references (context path)', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createFormulaRefSearchRule({ query: 'ref:formula:shared-formula' }),
        ],
      }),
    )
    // Matches the path formula on the contexted attribute, AND the component-context registration node!
    expect(results).toHaveLength(2)
    const paths = results.map((r) => r.path)
    expect(paths).toContainEqual([
      'components',
      'my-component',
      'nodes',
      'divNode',
      'attrs',
      'contexted',
    ])
    expect(paths).toContainEqual([
      'components',
      'my-component',
      'contexts',
      'context-comp',
    ])

    const resWithNodes = results.find((r) => r.path[2] === 'nodes')
    expect(resWithNodes?.details?.context).toEqual({
      before: 'div > contexted > ',
      matched: 'shared-formula',
      after: '',
    })

    const resWithContexts = results.find((r) => r.path[2] === 'contexts')
    expect(resWithContexts?.details?.context).toEqual({
      before: 'contexts > context-comp > ',
      matched: 'shared-formula',
      after: '',
    })
  })
})
