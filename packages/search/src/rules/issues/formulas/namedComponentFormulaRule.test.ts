import type {
  Component,
  ComponentFormula,
  ElementNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type {
  ApplyOperation,
  PathOperation,
} from '@nordcraft/core/dist/formula/formula'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import type { IssueResult } from '../../../types'
import { applyFixResult } from '../../../util/applyFix'
import { namedComponentFormulaRule } from './namedComponentFormulaRule'
import { renameNamedComponentFormulaFix } from './namedComponentFormulaRule.fix'

describe('namedComponentFormulaRule', () => {
  const formula: ComponentFormula = {
    name: 'newName', // deprecated
    formula: { type: 'value', value: 123 },
    arguments: [],
  }

  const component: Component = {
    name: 'MyComponent',
    nodes: {
      root: {
        type: 'element',
        tag: 'div',
        attrs: {
          text: {
            type: 'apply',
            name: 'oldKey',
            arguments: [],
          },
        },
      },
    },
    formulas: {
      oldKey: formula,
    },
  }

  const files: ProjectFiles = {
    components: {
      MyComponent: component,
      Consumer: {
        name: 'Consumer',
        contexts: {
          MyComponent: {
            formulas: ['oldKey'],
            workflows: [],
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'span',
            attrs: {
              content: {
                type: 'path',
                path: ['Contexts', 'MyComponent', 'oldKey'],
              },
            },
          },
        },
      },
    },
  }

  test('reports when formula has a name property', () => {
    const problems = Array.from(
      searchProject({
        files,
        rules: [namedComponentFormulaRule],
      }),
    )

    const issues = problems as IssueResult[]
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('named component formula')
    expect(issues[0].path).toEqual([
      'components',
      'MyComponent',
      'formulas',
      'oldKey',
    ])
    expect(issues[0].details).toEqual({
      name: 'newName',
      formulaKey: 'oldKey',
    })
  })

  test('does not report when formula does not have a name property', () => {
    const filesWithoutName: ProjectFiles = {
      components: {
        MyComponent: {
          name: 'MyComponent',
          nodes: {},
          formulas: {
            formulaName: {
              formula: { type: 'value', value: 123 },
              arguments: [],
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files: filesWithoutName,
        rules: [namedComponentFormulaRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('fix updates key and references', () => {
    const problems = Array.from(
      searchProject({
        files,
        rules: [namedComponentFormulaRule],
      }),
    )
    const issue = problems[0] as IssueResult

    const fixResult = renameNamedComponentFormulaFix({
      data: {
        nodeType: 'component-formula',
        path: issue.path,
        files,
        value: formula,
        component: new ToddleComponent<Function>({
          component,
          getComponent: (name) => files.components[name],
          packageName: undefined,
          globalFormulas: {
            formulas: {},
            packages: {},
          },
        }),
        memo: () => ({}) as any,
      },
      details: issue.details,
    })

    expect(fixResult).toBeDefined()
    const updatedFiles = applyFixResult(files, fixResult)
    const myComp = updatedFiles.components.MyComponent!
    // Key updated
    expect(myComp.formulas?.newName).toBeDefined()
    expect(myComp.formulas?.oldKey).toBeUndefined()
    // Name removed
    expect(myComp.formulas?.newName?.name).toBeUndefined()

    // Internal reference updated
    const node = myComp.nodes?.['root'] as ElementNodeModel
    const nodePathFormula = node.attrs?.text as ApplyOperation
    expect(nodePathFormula.name).toBe('newName')

    // Context consumer updated
    const consumer = updatedFiles!.components.Consumer as Component
    expect(consumer.contexts?.MyComponent.formulas).toContain('newName')
    expect(consumer.contexts?.MyComponent.formulas).not.toContain('oldKey')
    const consumerNode = consumer.nodes?.['root'] as ElementNodeModel
    const consumerNodePathFormula = consumerNode.attrs?.content as PathOperation
    expect(consumerNodePathFormula.path).toEqual([
      'Contexts',
      'MyComponent',
      'newName',
    ])
  })

  test('fix keeps formula and removes name property when key is the same as name', () => {
    const formulaWithSameKey: ComponentFormula = {
      name: 'sameKey',
      formula: {
        type: 'apply',
        name: 'sameKey',
        arguments: [],
      },
      arguments: [],
    }

    const sameKeyFiles: ProjectFiles = {
      components: {
        MyComponent: {
          name: 'MyComponent',
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              attrs: {
                text: {
                  type: 'apply',
                  name: 'sameKey',
                  arguments: [],
                },
              },
            },
          },
          formulas: {
            sameKey: formulaWithSameKey,
          },
        },
        Consumer: {
          name: 'Consumer',
          contexts: {
            MyComponent: {
              formulas: ['sameKey'],
              workflows: [],
            },
          },
          nodes: {
            root: {
              type: 'element',
              tag: 'span',
              attrs: {
                content: {
                  type: 'path',
                  path: ['Contexts', 'MyComponent', 'sameKey'],
                },
              },
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files: sameKeyFiles,
        rules: [namedComponentFormulaRule],
      }),
    )
    const issue = problems[0] as IssueResult

    const fixResult = renameNamedComponentFormulaFix({
      data: {
        nodeType: 'component-formula',
        path: issue.path,
        files: sameKeyFiles,
        value: formulaWithSameKey,
        component: new ToddleComponent<Function>({
          component: sameKeyFiles.components.MyComponent!,
          getComponent: (name) => sameKeyFiles.components[name],
          packageName: undefined,
          globalFormulas: {
            formulas: {},
            packages: {},
          },
        }),
        memo: () => ({}) as any,
      },
      details: issue.details,
    })

    expect(fixResult).toBeDefined()
    const updatedFiles = applyFixResult(sameKeyFiles, fixResult)
    const myComp = updatedFiles.components.MyComponent!
    // Formula is kept
    expect(myComp.formulas?.sameKey).toBeDefined()
    // Name is removed
    expect(myComp.formulas?.sameKey?.name).toBeUndefined()
    expect(myComp.formulas?.sameKey?.formula).toEqual({
      type: 'apply',
      name: 'sameKey',
      arguments: [],
    })

    // Internal reference updated / preserved
    const node = myComp.nodes?.['root'] as ElementNodeModel
    const nodePathFormula = node.attrs?.text as ApplyOperation
    expect(nodePathFormula.name).toBe('sameKey')

    // Context consumer preserved / updated
    const consumer = updatedFiles!.components.Consumer as Component
    expect(consumer.contexts?.MyComponent.formulas).toContain('sameKey')
    const consumerNode = consumer.nodes?.['root'] as ElementNodeModel
    const consumerNodePathFormula = consumerNode.attrs?.content as PathOperation
    expect(consumerNodePathFormula.path).toEqual([
      'Contexts',
      'MyComponent',
      'sameKey',
    ])
  })

  test('fixProject fixes all named component formulas across iterations', () => {
    const multiFormulaFiles: ProjectFiles = {
      components: {
        MyComponent: {
          name: 'MyComponent',
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              attrs: {
                f1Ref: {
                  type: 'apply',
                  name: 'old1',
                  arguments: [],
                },
                f2Ref: {
                  type: 'apply',
                  name: 'old2',
                  arguments: [],
                },
              },
            },
          },
          formulas: {
            old1: {
              name: 'new1',
              formula: { type: 'value', value: 1 },
              arguments: [],
            },
            old2: {
              name: 'new2',
              formula: { type: 'value', value: 2 },
              arguments: [],
            },
          },
        },
      },
    }

    const fixedFiles = fixProject({
      files: multiFormulaFiles,
      rule: namedComponentFormulaRule,
      fixType: 'rename-named-component-formula',
    })

    const comp = fixedFiles.components.MyComponent!
    // Both formulas renamed
    expect(comp.formulas?.new1).toBeDefined()
    expect(comp.formulas?.new2).toBeDefined()
    expect(comp.formulas?.old1).toBeUndefined()
    expect(comp.formulas?.old2).toBeUndefined()
    expect(comp.formulas?.new1?.name).toBeUndefined()
    expect(comp.formulas?.new2?.name).toBeUndefined()

    // References updated
    const rootNode = comp.nodes?.['root'] as ElementNodeModel
    expect((rootNode.attrs?.f1Ref as ApplyOperation).name).toBe('new1')
    expect((rootNode.attrs?.f2Ref as ApplyOperation).name).toBe('new2')

    // Original files should not have been mutated
    expect(
      multiFormulaFiles.components.MyComponent?.formulas?.old1,
    ).toBeDefined()
  })
})
