import type { Component } from '@nordcraft/core/dist/component/component.types'
import type { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../types'
import {
  interactiveContentElementDefinition,
  type InteractiveContent,
} from '../../util/helpers'

const ELEMENTS_WITHOUT_INTERACTIVE_CONTENT = ['button', 'a']

export const elementWithoutInteractiveContentRule: Rule<{
  parentTag: string
  invalidChild: InteractiveContent
}> = {
  code: 'invalid element child',
  level: 'error',
  category: 'Accessibility',
  visit: (report, args) => {
    if (args.nodeType !== 'component-node') {
      return
    }
    const { value, component, path, files } = args
    if (
      value.type !== 'element' ||
      !ELEMENTS_WITHOUT_INTERACTIVE_CONTENT.includes(value.tag)
    ) {
      return
    }
    // TODO: Consider memoizing this function to avoid repeated searches
    const searchChildren = (
      container: ToddleComponent<Function> | Component,
      children: string[],
      results: Array<InteractiveContent> = [],
    ): Array<InteractiveContent> => {
      return children.reduce((acc, childId) => {
        const child = container.nodes[childId]
        if (!isDefined(child) || child.type === 'text') {
          return acc
        }
        if (child.type === 'element') {
          // Check if the child element is an interactive content element
          const interactiveElement = interactiveContentElementDefinition(child)
          if (interactiveElement) {
            // TODO: consider visiting this element's children instead of returning early
            return [...acc, interactiveElement]
          }
        }
        const allResults = [...acc]
        if (child.type === 'component') {
          const component = child.package
            ? files.packages?.[child.package]?.components?.[child.name]
            : files.components?.[child.name]
          if (!component) {
            return results
          }
          // Search children in the component's own nodes
          allResults.push(
            ...searchChildren(
              component,
              component.nodes['root']?.children ?? [],
              acc,
            ),
          )
        }
        // Search children in slot/component/element:
        return searchChildren(container, child.children, allResults)
      }, results)
    }
    const childTags = searchChildren(component, value.children)
    if (childTags.length > 0) {
      childTags.forEach((ic) =>
        report(path, {
          parentTag: value.tag,
          invalidChild: ic,
        }),
      )
    }
  },
}
