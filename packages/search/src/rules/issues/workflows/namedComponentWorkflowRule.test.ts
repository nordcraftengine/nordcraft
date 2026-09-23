import type {
  Component,
  WorkflowActionModel,
} from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import type { IssueResult } from '../../../types'
import { namedComponentWorkflowRule } from './namedComponentWorkflowRule'
import { renameNamedComponentWorkflowFix } from './namedComponentWorkflowRule.fix'

describe('namedComponentWorkflowRule', () => {
  const workflow = {
    name: 'newName',
    actions: [
      {
        type: 'TriggerWorkflow',
        workflow: 'oldKey',
      },
    ],
    parameters: [],
    callbacks: [],
  }

  const component: Component = {
    name: 'MyComponent',
    nodes: {},
    workflows: {
      oldKey: workflow as any,
    },
  }

  const files: ProjectFiles = {
    components: {
      MyComponent: component,
      Consumer: {
        name: 'Consumer',
        contexts: {
          MyComponent: {
            formulas: [],
            workflows: ['oldKey'],
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'button',
            events: {
              click: {
                actions: [
                  {
                    type: 'TriggerWorkflow',
                    contextProvider: 'MyComponent',
                    workflow: 'oldKey',
                  },
                ],
              },
            },
          },
        },
      },
    },
  }

  test('reports when workflow has a name property', () => {
    const problems = Array.from(
      searchProject({
        files,
        rules: [namedComponentWorkflowRule],
      }),
    )

    const issues = problems as IssueResult[]
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('named component workflow')
    expect(issues[0].path).toEqual([
      'components',
      'MyComponent',
      'workflows',
      'oldKey',
    ])
    expect(issues[0].details).toEqual({
      name: 'newName',
      workflowKey: 'oldKey',
    })
  })

  test('fix updates keys and references', () => {
    const problems = Array.from(
      searchProject({
        files,
        rules: [namedComponentWorkflowRule],
      }),
    )
    const issue = problems[0] as IssueResult

    const updatedFiles = renameNamedComponentWorkflowFix({
      data: {
        nodeType: 'component-workflow',
        path: issue.path,
        files,
        value: workflow as any,
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

    expect(updatedFiles).toBeDefined()
    const myComp = updatedFiles!.components.MyComponent!
    // Key updated
    expect(myComp.workflows?.newName).toBeDefined()
    expect(myComp.workflows?.oldKey).toBeUndefined()
    // Name removed
    expect(myComp.workflows?.newName?.name).toBeUndefined()

    // Internal reference updated
    const internalAction = myComp.workflows?.newName
      ?.actions[0] as WorkflowActionModel
    expect(internalAction.workflow).toBe('newName')

    // Context consumer updated
    const consumer = updatedFiles!.components.Consumer as Component
    expect(consumer.contexts?.MyComponent.workflows).toContain('newName')
    expect(consumer.contexts?.MyComponent.workflows).not.toContain('oldKey')
    const consumerAction = consumer.nodes?.root?.events?.click
      ?.actions?.[0] as WorkflowActionModel
    expect(consumerAction.workflow).toBe('newName')
  })
})
