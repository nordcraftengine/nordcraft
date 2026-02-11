import type { Component } from '@nordcraft/core/dist/component/component.types'
import type { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'
import {
  interactiveContentElementDefinition,
  type InteractiveContent,
} from '../../../util/helpers'

const ELEMENTS_WITHOUT_INTERACTIVE_CONTENT = ['button', 'a']

export const elementWithoutInteractiveContentRule: Rule<{
  parentTag: string
  invalidChild: InteractiveContent
}> = {
  code: 'invalid element child',
  level: 'warning',
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
        const child = container.nodes?.[childId]
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
              component.nodes?.['root']?.children ?? [],
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
        report({
          path,
          info: {
            title: `${value.tag} includes interactive content element(s)`,
            description: `\`${
              value.tag
            }\` elements are not allowed to include [interactive content](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories#interactive_content) elements.
This ${value.tag} element could potentially include a \`${ic.tag}\` element${
              'whenAttributeIsPresent' in ic
                ? ` with the \`${ic.whenAttributeIsPresent}\` attribute present`
                : ''
            }${
              'whenAttributeIsNot' in ic
                ? ` where the \`${ic.whenAttributeIsNot.attribute}\` attribute is not \`${ic.whenAttributeIsNot.value}\``
                : ''
            }.
Learn more about permitted content for the \`${
              value.tag
            }\` element on [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/${
              value.tag
            }#technical_summary)`,
          },
          details: {
            parentTag: value.tag,
            invalidChild: ic,
          },
        }),
      )
    }
  },
}
