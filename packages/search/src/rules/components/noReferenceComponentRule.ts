import type { Component } from '@nordcraft/core/dist/component/component.types'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../types'

export const noReferenceComponentRule: Rule<void> = {
  code: 'no-reference component',
  level: 'warning',
  category: 'No References',
  visit: (report, { path, nodeType, files, value }, state) => {
    // We need a way to flag if a component is exported as a web component, as it would be a valid orphan
    if (
      nodeType !== 'component' ||
      isPage(value) ||
      (state?.projectDetails?.type === 'package' && value.exported === true)
    ) {
      return
    }

    for (const component of Object.values(files.components)) {
      // Enforce that the component is not undefined since we're iterating
      for (const node of Object.values(component!.nodes ?? {})) {
        if (
          node.type === 'component' &&
          node.name === value.name &&
          // Circular references from a component to itself should
          // not count as a reference
          node.name !== component!.name
        ) {
          return
        }
      }
    }

    report(path)
  },
}

const isPage = (
  value: Component,
): value is Component & { route: Required<Component['route']> } =>
  isDefined(value.route)
