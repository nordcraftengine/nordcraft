import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { removeTestData } from './testData'

describe('removeTestData', () => {
  test('it removes testValue from attributes', () => {
    expect(
      removeTestData({
        name: 'test',
        variables: {},
        apis: {},
        nodes: {},
        attributes: {
          '1': {
            name: 'foo',
            testValue: 'bar',
          },
        },
      }).attributes,
    ).toEqual({
      '1': {
        name: 'foo',
      },
    } as any)
  })
  test('it removes testValue from route parameters', () => {
    expect(
      removeTestData({
        name: 'test',
        variables: {},
        apis: {},
        nodes: {},
        attributes: {},
        route: {
          path: [
            {
              name: 'blog',
              type: 'static',
            },
            {
              name: 'slug',
              type: 'param',
              testValue: '123',
            },
          ],
          query: {
            q: {
              name: 'q',
              testValue: '123',
            },
          },
        },
      }).route,
    ).toEqual({
      path: [
        {
          name: 'blog',
          type: 'static',
        },
        {
          name: 'slug',
          type: 'param',
        },
      ],
      query: {
        q: {
          name: 'q',
        },
      },
    } as any)
  })
  test('it removes testValue from formula arguments', () => {
    expect(
      removeTestData({
        name: 'test',
        variables: {},
        apis: {},
        nodes: {},
        attributes: {},
        formulas: {
          a: {
            name: 'foo',
            arguments: [
              {
                name: 'bar',
                testValue: 'baz',
              },
            ],
            formula: valueFormula(true),
          },
        },
      }).formulas?.['a']?.arguments,
    ).toEqual([
      {
        name: 'bar',
      },
    ] as any)
  })
  test('it removes testValue from nested formula arguments', () => {
    expect(
      removeTestData({
        name: 'test',
        variables: {},
        apis: {},
        nodes: {},
        attributes: {},
        formulas: {
          formula2: {
            name: 'Formula2',
            formula: {
              type: 'apply',
              name: 'GaQKQo',
              arguments: [
                {
                  name: 'Input',
                  testValue: 'My test value',
                  formula: { type: 'path', path: ['Args', 'Input'] },
                },
              ],
            },
            arguments: [{ name: 'Input', testValue: 'Input for formula2' }],
            memoize: false,
            exposeInContext: false,
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "apis": {},
        "attributes": {},
        "formulas": {
          "formula2": {
            "arguments": [
              {
                "name": "Input",
              },
            ],
            "exposeInContext": false,
            "formula": {
              "arguments": [
                {
                  "formula": {
                    "path": [
                      "Args",
                      "Input",
                    ],
                    "type": "path",
                  },
                  "name": "Input",
                },
              ],
              "name": "GaQKQo",
              "type": "apply",
            },
            "memoize": false,
            "name": "Formula2",
          },
        },
        "name": "test",
        "nodes": {},
        "variables": {},
      }
    `)
  })
  test('it removes testValue from workflow parameters', () => {
    expect(
      removeTestData({
        name: 'test',
        variables: {},
        apis: {},
        nodes: {},
        attributes: {},
        workflows: {
          p: {
            name: 'foo',
            parameters: [
              {
                name: 'bar',
                testValue: 'baz',
              },
            ],
            actions: [],
          },
        },
      }).workflows?.['p']?.parameters,
    ).toEqual([
      {
        name: 'bar',
      },
    ] as any)
  })
  test('it removes description from workflow actions', () => {
    expect(
      removeTestData({
        name: 'test',
        variables: {},
        apis: {},
        nodes: {},
        attributes: {},
        workflows: {
          p: {
            name: 'foo',
            parameters: [
              {
                name: 'bar',
                testValue: 'baz',
              },
            ],
            actions: [
              {
                type: 'Custom',
                description: 'A long description',
                name: 'My Action',
              },
            ],
          },
        },
      }).workflows?.['p']?.actions,
    ).toEqual([
      {
        type: 'Custom',
        name: 'My Action',
      },
    ])
  })
  test('it removes service refs from APIs', () => {
    expect(
      removeTestData({
        name: 'test',
        variables: {},
        nodes: {},
        attributes: {},
        apis: {
          a: {
            name: 'foo',
            service: 'bar',
            servicePath: 'baz',
            url: valueFormula('https://example.com'),
            version: 2,
            type: 'http',
            inputs: {},
          },
        },
      }).apis['a'],
    ).toEqual({
      name: 'foo',
      url: valueFormula('https://example.com'),
      version: 2,
      type: 'http',
      inputs: {},
    })
  })
  test('it removes test data from actions', () => {
    const updatedData = removeTestData({
      name: 'test',
      variables: {},
      nodes: {
        root: {
          tag: 'div',
          type: 'element',
          attrs: {},
          style: {},
          events: {
            onClick: {
              trigger: 'click',
              actions: [
                {
                  type: 'Custom',
                  name: 'My Action',
                  description: 'A long description',
                  group: 'Group 1',
                  label: 'Label 1',
                  arguments: [
                    {
                      name: 'arg1',
                      formula: valueFormula('value1'),
                      type: 'Array',
                      description: 'Argument 1',
                    },
                  ],
                },
              ],
            },
          },
          classes: {},
          children: [],
        },
      },
      attributes: {},
      apis: {},
      onLoad: {
        trigger: 'onLoad',
        actions: [
          {
            type: 'Custom',
            name: 'My Action',
            description: 'A long description',
            group: 'Group 1',
            label: 'Label 1',
            arguments: [
              {
                name: 'arg1',
                formula: valueFormula('value1'),
                type: 'Array',
                description: 'Argument 1',
              },
            ],
          },
        ],
      },
      onAttributeChange: {
        trigger: 'onAttributeChange',
        actions: [
          {
            type: 'Custom',
            name: 'My Action',
            description: 'A long description',
            group: 'Group 1',
            label: 'Label 1',
            arguments: [
              {
                name: 'arg1',
                formula: valueFormula('value1'),
                type: 'Array',
                description: 'Argument 1',
              },
            ],
          },
        ],
      },
    })
    expect(updatedData).toMatchInlineSnapshot(`
      {
        "apis": {},
        "attributes": {},
        "name": "test",
        "nodes": {
          "root": {
            "attrs": {},
            "children": [],
            "classes": {},
            "events": {
              "onClick": {
                "actions": [
                  {
                    "arguments": [
                      {
                        "formula": {
                          "type": "value",
                          "value": "value1",
                        },
                        "name": "arg1",
                      },
                    ],
                    "name": "My Action",
                    "type": "Custom",
                  },
                ],
                "trigger": "click",
              },
            },
            "style": {},
            "tag": "div",
            "type": "element",
          },
        },
        "onAttributeChange": {
          "actions": [
            {
              "arguments": [
                {
                  "formula": {
                    "type": "value",
                    "value": "value1",
                  },
                  "name": "arg1",
                },
              ],
              "name": "My Action",
              "type": "Custom",
            },
          ],
          "trigger": "onAttributeChange",
        },
        "onLoad": {
          "actions": [
            {
              "arguments": [
                {
                  "formula": {
                    "type": "value",
                    "value": "value1",
                  },
                  "name": "arg1",
                },
              ],
              "name": "My Action",
              "type": "Custom",
            },
          ],
          "trigger": "onLoad",
        },
        "variables": {},
      }
    `)
  })
  test('it removes testData from workflow callbacks', () => {
    const updatedData = removeTestData({
      name: 'test',
      variables: {},
      nodes: {},
      attributes: {},
      apis: {},
      onLoad: {
        trigger: 'onLoad',
        actions: [],
      },
      onAttributeChange: {
        trigger: 'onAttributeChange',
        actions: [],
      },
      workflows: {
        'My Workflow': {
          name: 'My Workflow',
          parameters: [
            {
              name: 'param1',
              testValue: 'value1',
            },
          ],
          callbacks: [
            {
              name: 'callback1',
              testValue: 'value1',
            },
          ],
          actions: [],
        },
      },
    })
    expect(updatedData).toMatchInlineSnapshot(`
      {
        "apis": {},
        "attributes": {},
        "name": "test",
        "nodes": {},
        "onAttributeChange": {
          "actions": [],
          "trigger": "onAttributeChange",
        },
        "onLoad": {
          "actions": [],
          "trigger": "onLoad",
        },
        "variables": {},
        "workflows": {
          "My Workflow": {
            "actions": [],
            "callbacks": [
              {
                "name": "callback1",
              },
            ],
            "name": "My Workflow",
            "parameters": [
              {
                "name": "param1",
              },
            ],
          },
        },
      }
    `)
  })
})
