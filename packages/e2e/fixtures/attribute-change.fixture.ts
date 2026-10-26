import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { element, equals, textNode } from './helpers'

export const page = 'AttributeChangePage'

export const components: Component[] = [
  {
    name: 'AttributeChangePage',
    route: {
      path: [],
      query: {},
    },
    variables: {
      input: {
        initialValue: valueFormula('initial'),
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['change-attribute', 'child'],
      }),
      'change-attribute': element('button', {
        testId: 'change-attribute',
        children: ['change-attribute-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'input',
                data: valueFormula('updated'),
              },
            ],
          },
        },
      }),
      'change-attribute-text': textNode(valueFormula('Change attribute')),
      child: {
        type: 'component',
        name: 'AttributeChangeChild',
        attrs: {
          input: pathFormula(['Variables', 'input']),
        },
        children: [],
        events: {},
      },
    },
  },
  {
    name: 'AttributeChangeChild',
    attributes: {
      input: {
        name: 'input',
        testValue: 'initial',
      },
    },
    variables: {
      step1: {
        initialValue: valueFormula('initial'),
      },
      step2: {
        initialValue: valueFormula('initial-derived'),
      },
      branched: {
        initialValue: valueFormula(false),
      },
    },
    onAttributeChange: {
      trigger: 'onAttributeChange',
      actions: [
        {
          type: 'SetVariable',
          variable: 'step1',
          data: pathFormula(['Attributes', 'input']),
        },
        {
          type: 'SetVariable',
          variable: 'step2',
          data: pathFormula(['Variables', 'step1']),
        },
        {
          type: 'Switch',
          cases: [
            {
              condition: equals(
                pathFormula(['Variables', 'step2']),
                valueFormula('updated'),
              ),
              actions: [
                {
                  type: 'SetVariable',
                  variable: 'branched',
                  data: valueFormula(true),
                },
              ],
            },
          ],
          default: {
            actions: [],
          },
        },
      ],
    },
    nodes: {
      root: element('div', {
        testId: 'child-root',
        children: ['step1', 'step2', 'branched'],
      }),
      step1: element('div', {
        testId: 'step1',
        children: ['step1-text'],
      }),
      'step1-text': textNode(pathFormula(['Variables', 'step1'])),
      step2: element('div', {
        testId: 'step2',
        children: ['step2-text'],
      }),
      'step2-text': textNode(pathFormula(['Variables', 'step2'])),
      branched: element('div', {
        testId: 'branched',
        children: ['branched-text'],
      }),
      'branched-text': textNode(pathFormula(['Variables', 'branched'])),
    },
  },
]
