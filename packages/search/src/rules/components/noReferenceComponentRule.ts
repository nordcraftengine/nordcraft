import type { Component } from '@nordcraft/core/dist/component/component.types'
import { omit } from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ApplicationState, NodeType, Rule } from '../../types'

export const noReferenceComponentRule: Rule<void> = {
  code: 'no-reference component',
  level: 'warning',
  category: 'No References',
  visit: (report, data, state) => {
    if (hasReferences(data, state)) {
      return
    }
    report(data.path, undefined, ['delete-component'])
  },
  fixes: {
    'delete-component': (data, state) => {
      if (hasReferences(data, state)) {
        return
      }
      return omit(data.files, data.path)
    },
  },
}

const hasReferences = (data: NodeType, state?: ApplicationState) => {
  if (
    data.nodeType !== 'component' ||
    isPage(data.value) ||
    (state?.projectDetails?.type === 'package' && data.value.exported === true)
  ) {
    return true
  }
  for (const component of Object.values(data.files.components)) {
    // Enforce that the component is not undefined since we're iterating
    for (const node of Object.values(component!.nodes ?? {})) {
      if (
        node.type === 'component' &&
        node.name === data.value.name &&
        // Circular references from a component to itself should
        // not count as a reference
        node.name !== component!.name
      ) {
        return true
      }
    }
  }
  return false
}

export type NoReferenceComponentRuleFix = 'delete-component'

const isPage = (
  value: Component,
): value is Component & { route: Required<Component['route']> } =>
  isDefined(value.route)
