import type { Component } from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/valueFormula'
import { componentNode, element, slotNode, textNode } from './helpers'

export const page = 'SlotsNamedPage'

export const components: Component[] = [
  {
    name: 'SlotsNamedPage',
    route: { path: [], query: {} },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['dialog-component'],
      }),
      'dialog-component': componentNode('ModalDialog', {
        children: ['header-slot-content', 'footer-slot-content'],
      }),
      'header-slot-content': element('h2', {
        testId: 'dialog-header',
        slot: 'header',
        children: ['header-text'],
      }),
      'header-text': textNode(valueFormula('Modal Title')),
      'footer-slot-content': element('footer', {
        testId: 'dialog-footer',
        slot: 'footer',
        children: ['footer-text'],
      }),
      'footer-text': textNode(valueFormula('Modal Footer Action')),
    },
  },
  {
    name: 'ModalDialog',
    nodes: {
      root: element('div', {
        testId: 'dialog-wrapper',
        children: ['header-slot', 'default-body-slot', 'footer-slot'],
      }),
      'header-slot': slotNode({
        name: 'header',
        children: [],
      }),
      'default-body-slot': slotNode({
        children: ['default-body-text'],
      }),
      'default-body-text': element('div', {
        testId: 'dialog-default-body',
        children: ['body-text'],
      }),
      'body-text': textNode(valueFormula('Default modal body')),
      'footer-slot': slotNode({
        name: 'footer',
        children: [],
      }),
    },
  },
]
