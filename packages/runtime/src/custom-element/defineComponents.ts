import type { Component } from '@nordcraft/core/dist/component/component.types'
import type { Theme } from '@nordcraft/core/dist/styling/theme'
import type { Toddle } from '@nordcraft/core/dist/types'
import { safeCustomElementName } from '@nordcraft/core/dist/utils/customElements'
import type { LocationSignal } from '../types'
import { ToddleComponent } from './ToddleComponent'

/**
 * Define each component as a new web component
 *
 * Use them like: `<toddle-test my-attr="test" style="--my-color: rebeccapurple"></toddle-test>`
 *
 * You can access the component and `addEventListener` to it like:
 *
 * ```js
 * const component = document.querySelector('toddle-test')
 * component.addEventListener('my-event', (e) => {
 *  console.log(e.detail)
 * })
 * ```
 *
 * @param componentNames - The names of the components to define. These should be the names of the components in the app context
 * @param options - A subset of the app context. This holds a list of all the components needed to define the components in `componentNames`
 * @param toddle - Also available at `window.toddle`. However, multiple instances of toddle can exist on the same page, so we pass a reference here. We should ultimately remove the global scope reference as polite web components should be self-contained.
 */
export const defineComponents = (
  componentNames: string[],
  options: {
    components: Component[]
    themes: Record<string, Theme>
  },
  toddle: Toddle<LocationSignal, never>,
) => {
  componentNames
    .map<Component>(
      (name) =>
        options.components.find(
          (component) => component.name === name,
        ) as Component,
    )
    .forEach((component) => {
      const tag = safeCustomElementName(component.name)
      if (customElements.get(tag)) {
        // eslint-disable-next-line no-console
        console.warn(`Component ${tag} already defined`)
        return
      }

      customElements.define(
        tag,
        class extends ToddleComponent {
          constructor() {
            super(component, options, toddle)
          }

          // When read from DOM, all attributes are lower case, so we must observe them as such
          static get observedAttributes() {
            return Object.keys(component.attributes ?? {}).map((key) =>
              key.toLowerCase(),
            )
          }
        },
      )
    })
}
