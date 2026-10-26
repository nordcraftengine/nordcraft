import type { Component } from '@nordcraft/core/dist/component/component.types'
import { pathFormula } from '@nordcraft/core/dist/formula/pathFormula.helper'
import { valueFormula } from '@nordcraft/core/dist/formula/valueFormula'
import { element, textNode } from './helpers'

export const page = 'RepeatNestedPage'

export const components: Component[] = [
  {
    name: 'RepeatNestedPage',
    route: { path: [], query: {} },
    variables: {
      groups: {
        initialValue: valueFormula([
          { name: 'Group A', members: ['Alice', 'Bob'] },
          { name: 'Group B', members: ['Charlie', 'Dana'] },
        ]),
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['groups-container'],
      }),
      'groups-container': element('div', {
        testId: 'groups-container',
        repeat: pathFormula(['Variables', 'groups']),
        children: ['group-card'],
      }),
      'group-card': element('div', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: valueFormula('group-') },
              { name: '1', formula: pathFormula(['ListItem', 'Index']) },
            ],
          },
        },
        children: ['group-title', 'members-list'],
      }),
      'group-title': element('h2', {
        children: ['group-title-text'],
      }),
      'group-title-text': textNode(pathFormula(['ListItem', 'Item', 'name'])),
      'members-list': element('ul', {
        repeat: pathFormula(['ListItem', 'Item', 'members']),
        children: ['member-item'],
      }),
      'member-item': element('li', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: valueFormula('member-') },
              {
                name: '1',
                formula: pathFormula(['ListItem', 'Parent', 'Index']),
              },
              { name: '2', formula: valueFormula('-') },
              { name: '3', formula: pathFormula(['ListItem', 'Index']) },
            ],
          },
        },
        children: ['member-text'],
      }),
      'member-text': textNode(pathFormula(['ListItem', 'Item'])),
    },
  },
]
