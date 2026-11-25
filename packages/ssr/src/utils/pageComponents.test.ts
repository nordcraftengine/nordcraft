import {
  getClassName,
  valueFormula,
  type Component,
  type PageComponent,
} from '@nordcraft/core'
import { describe, expect, test } from 'bun:test'
import type { ProjectFiles } from '../ssr.types'
import { getPageComponentsData } from './pageComponents'

describe('getPageComponentsData', () => {
  test('returns static project metadata and class-resolved page + included components without duplicating root', () => {
    const page: PageComponent = {
      name: 'HomePage',
      page: 'HomePage',
      route: { path: [], query: {} },
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          style: { color: 'red' },
          events: {},
          classes: {},
          children: ['child'],
        },
        child: {
          type: 'component',
          name: 'ChildCard',
          attrs: {},
          children: [],
          events: {},
        },
      },
      apis: {},
      variables: {},
      workflows: {},
    }
    const child: Component = {
      name: 'ChildCard',
      nodes: {
        root: {
          type: 'element',
          tag: 'section',
          attrs: {},
          style: { display: 'flex' },
          events: {},
          classes: {},
          children: [],
        },
      },
      apis: {},
      variables: {},
      workflows: {},
    }
    const unused: Component = {
      name: 'UnusedComp',
      nodes: {},
      apis: {},
      variables: {},
      workflows: {},
    }
    const files: ProjectFiles = {
      components: {
        HomePage: page,
        ChildCard: child,
        UnusedComp: unused,
      },
    }

    const result = getPageComponentsData({
      page,
      files,
      projectId: 'my_project',
      branchName: 'main',
      commit: 'sha-1',
    })

    const rootNode = result.component.nodes?.['root']
    const childRootNode = result.components[0]?.nodes?.['root']
    expect({
      project: result.project,
      branch: result.branch,
      commit: result.commit,
      rootName: result.component.name,
      rootNodeStyleCleared:
        rootNode?.type === 'element' ? rootNode.style : 'not-element',
      includedNames: result.components.map((c) => c.name),
      childNodeStyleCleared:
        childRootNode?.type === 'element' ? childRootNode.style : 'not-element',
    }).toEqual({
      project: 'my_project',
      branch: 'main',
      commit: 'sha-1',
      rootName: 'HomePage',
      rootNodeStyleCleared: undefined,
      includedNames: ['ChildCard'],
      childNodeStyleCleared: undefined,
    })
  })

  test('strips test data from page and included components while keeping processed APIs and resolved classes', () => {
    const page: PageComponent = {
      name: 'HomePage',
      page: 'HomePage',
      meta: {
        description: 'Editor-only description',
        tags: ['marketing'],
      },
      route: {
        path: [{ type: 'param', name: 'id', testValue: '123' }],
        query: { tab: { name: 'tab', testValue: 'overview' } },
      },
      attributes: {
        title: { name: 'title', testValue: 'Test title' },
      },
      formulas: {
        greet: {
          name: 'greet',
          arguments: [{ name: 'who', testValue: 'world' }],
          formula: valueFormula('hi'),
        },
      },
      workflows: {
        submit: {
          name: 'submit',
          testValue: 'wf-test',
          parameters: [{ name: 'payload', testValue: { ok: true } }],
          callbacks: [{ name: 'done', testValue: 'cb-test' }],
          actions: [],
        },
      },
      events: [{ name: 'loaded', dummyEvent: { secret: true } }],
      apis: {
        userApi: {
          name: 'userApi',
          type: 'http',
          version: 2,
          autoFetch: valueFormula(true),
          service: 'my-service',
          servicePath: '/users',
          inputs: {},
          client: {},
          server: {},
        },
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          style: { color: 'red' },
          events: {},
          classes: {},
          children: ['child'],
        },
        child: {
          type: 'component',
          name: 'ChildCard',
          attrs: {},
          children: [],
          events: {},
        },
      },
      variables: {},
    }
    const child: Component = {
      name: 'ChildCard',
      meta: { description: 'Child editor description' },
      attributes: {
        label: { name: 'label', testValue: 'Child test label' },
      },
      events: [{ name: 'clicked', dummyEvent: { x: 1 } }],
      nodes: {
        root: {
          type: 'element',
          tag: 'section',
          attrs: {},
          style: { display: 'flex' },
          events: {},
          classes: {},
          children: [],
        },
      },
      apis: {},
      variables: {},
      workflows: {},
    }
    const files: ProjectFiles = {
      components: {
        HomePage: page,
        ChildCard: child,
      },
    }

    const result = getPageComponentsData({
      page,
      files,
      projectId: 'my_project',
    })

    const pageRootClass = getClassName([{ color: 'red' }, undefined])
    const childRootClass = getClassName([{ display: 'flex' }, undefined])

    expect<unknown>(result).toEqual({
      project: 'my_project',
      branch: 'main',
      commit: 'unknown',
      component: {
        name: 'HomePage',
        page: 'HomePage',
        route: {
          path: [{ type: 'param', name: 'id' }],
          query: { tab: { name: 'tab' } },
        },
        attributes: {
          title: { name: 'title' },
        },
        formulas: {
          greet: {
            name: 'greet',
            arguments: [{ name: 'who' }],
            formula: { type: 'value', value: 'hi' },
          },
        },
        workflows: {
          submit: {
            name: 'submit',
            parameters: [{ name: 'payload' }],
            callbacks: [{ name: 'done' }],
            actions: [],
          },
        },
        events: [{ name: 'loaded' }],
        apis: {
          userApi: {
            name: 'userApi',
            type: 'http',
            version: 2,
            autoFetch: { type: 'value', value: true },
            inputs: {},
            client: {},
            server: {},
            dependsOn: [],
          },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            style: undefined,
            customProperties: {},
            variants: undefined,
            classes: {
              [pageRootClass]: { formula: valueFormula(true) },
            },
            children: ['child'],
          },
          child: {
            type: 'component',
            name: 'ChildCard',
            style: undefined,
            customProperties: {},
            variants: undefined,
          },
        },
      },
      components: [
        {
          name: 'ChildCard',
          attributes: {
            label: { name: 'label' },
          },
          events: [{ name: 'clicked' }],
          nodes: {
            root: {
              type: 'element',
              tag: 'section',
              style: undefined,
              customProperties: {},
              variants: undefined,
              classes: {
                [childRootClass]: { formula: valueFormula(true) },
              },
            },
          },
        },
      ],
    })
  })
})
