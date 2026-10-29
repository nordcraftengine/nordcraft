import type { Component } from '@nordcraft/core/dist/component/component.types'
import type { Formula } from '@nordcraft/core/dist/formula/formula'
import { pathFormula } from '@nordcraft/core/dist/formula/pathFormula.helper'
import { valueFormula } from '@nordcraft/core/dist/formula/valueFormula'
import type { PluginActionV2 } from '@nordcraft/core/dist/types'
import { componentNode, element, textNode } from './helpers'

export const page = 'ThemeCookiePage'

const defaultTo = (formula: Formula, fallback: Formula): Formula => ({
  type: 'function',
  name: '@toddle/defaultTo',
  arguments: [
    { name: '0', formula },
    { name: '1', formula: fallback },
  ],
})

export const customActions: Record<string, PluginActionV2> = {
  destroyThemeSignal: {
    version: 2,
    name: 'destroyThemeSignal',
    variableArguments: null,
    arguments: [],
    handler: (_args: any, ctx: any) => {
      ctx.stores?.theme?.destroy()
    },
  },
}

export const components: Component[] = [
  {
    name: 'ThemeCookiePage',
    route: { path: [], query: {} },
    customCode: true,
    nodes: {
      root: element('div', {
        testId: 'root',
        children: [
          'theme-display',
          'set-dark-btn',
          'set-light-btn',
          'clear-theme-btn',
          'destroy-theme-btn',
          'child-comp',
        ],
      }),
      'theme-display': element('div', {
        testId: 'theme-value',
        children: ['theme-text'],
      }),
      'theme-text': textNode(
        defaultTo(pathFormula(['Page', 'Theme']), valueFormula('none')),
      ),
      'set-dark-btn': element('button', {
        testId: 'set-dark-button',
        children: ['set-dark-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                name: '@toddle/setTheme',
                arguments: [
                  {
                    name: 'Name',
                    formula: valueFormula('dark'),
                  },
                ],
              },
            ],
          },
        },
      }),
      'set-dark-text': textNode(valueFormula('Set Dark')),
      'set-light-btn': element('button', {
        testId: 'set-light-button',
        children: ['set-light-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                name: '@toddle/setTheme',
                arguments: [
                  {
                    name: 'Name',
                    formula: valueFormula('light'),
                  },
                ],
              },
            ],
          },
        },
      }),
      'set-light-text': textNode(valueFormula('Set Light')),
      'clear-theme-btn': element('button', {
        testId: 'clear-theme-button',
        children: ['clear-theme-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                name: '@toddle/setTheme',
                arguments: [
                  {
                    name: 'Name',
                    formula: valueFormula(null),
                  },
                ],
              },
            ],
          },
        },
      }),
      'clear-theme-text': textNode(valueFormula('Clear Theme')),
      'destroy-theme-btn': element('button', {
        testId: 'destroy-theme-button',
        children: ['destroy-theme-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                version: 2,
                name: 'destroyThemeSignal',
                arguments: [],
              } as any,
            ],
          },
        },
      }),
      'destroy-theme-text': textNode(valueFormula('Destroy Theme Signal')),
      'child-comp': componentNode('ThemeCookieChild'),
    },
  },
  {
    name: 'ThemeCookieChild',
    nodes: {
      root: element('div', {
        testId: 'child-root',
        children: ['child-theme-display'],
      }),
      'child-theme-display': element('div', {
        testId: 'child-theme-value',
        children: ['child-theme-text'],
      }),
      'child-theme-text': textNode(
        defaultTo(pathFormula(['Page', 'Theme']), valueFormula('none')),
      ),
    },
  },
]
