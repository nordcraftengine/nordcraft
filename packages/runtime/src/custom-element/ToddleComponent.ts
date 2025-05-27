import { isLegacyApi, sortApiObjects } from '@nordcraft/core/dist/api/api'
import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { createStylesheet } from '@nordcraft/core/dist/styling/style.css'
import type { Theme } from '@nordcraft/core/dist/styling/theme'
import { theme as defaultTheme } from '@nordcraft/core/dist/styling/theme.const'
import type { Toddle } from '@nordcraft/core/dist/types'
import { mapObject } from '@nordcraft/core/dist/utils/collections'
import { isContextApiV2 } from '../api/apiUtils'
import { createLegacyAPI } from '../api/createAPI'
import { createAPI } from '../api/createAPIv2'
import { renderComponent } from '../components/renderComponent'
import { isContextProvider } from '../context/isContextProvider'
import type { Signal } from '../signal/signal'
import { signal } from '../signal/signal'
import type { ComponentContext, LocationSignal } from '../types'

/**
 * Base class for all toddle components
 */
export class ToddleComponent extends HTMLElement {
  /**
   * Public reference to the toddle instance for debugging purposes. `el.toddle.errors` can be used to check for non-verbose errors.
   */
  toddle: Toddle<LocationSignal, never>
  #component: Component
  #ctx: ComponentContext
  #shadowRoot: ShadowRoot
  #signal: Signal<ComponentData>
  #files: { themes: Theme[] }

  constructor(
    component: Component,
    options: { components: Component[]; themes: Theme[] },
    toddle: Toddle<LocationSignal, never>,
  ) {
    super()
    this.toddle = toddle
    const internals = this.attachInternals()
    if (internals.shadowRoot) {
      // Not used yet, but can be used to hydrate rather than render the shadow dom
      this.#shadowRoot = internals.shadowRoot
    } else {
      this.#shadowRoot = this.attachShadow({ mode: 'open' })
    }

    const env: ToddleEnv = {
      branchName: toddle.branch || 'main',
      isServer: false,
      request: undefined,
      runtime: 'custom-element',
      logErrors: true,
    }

    this.#component = component
    this.#signal = createSignal({
      component,
      root: this.#shadowRoot,
      toddle,
      env,
    })
    this.#files = {
      themes: options.themes,
    }

    // Call the abort signal if the component's datasignal is destroyed (component unmounted) to cancel any pending requests
    const abortController = new AbortController()
    this.#signal.subscribe(() => {}, {
      destroy: () =>
        abortController.abort(`Component ${component.name} unmounted`),
    })

    this.#ctx = {
      triggerEvent: this.dispatch.bind(this),
      root: this.#shadowRoot,
      isRootComponent: true,
      components: options.components,
      component: this.#component,
      dataSignal: this.#signal,
      formulaCache: {},
      apis: {},
      abortSignal: abortController.signal,
      children: {},
      providers: {},
      package: undefined,
      toddle,
      env,
    }
  }

  connectedCallback() {
    sortApiObjects(Object.entries(this.#component.apis)).forEach(
      ([name, api]) => {
        if (isLegacyApi(api)) {
          this.#ctx.apis[name] = createLegacyAPI(api, this.#ctx)
        } else {
          this.#ctx.apis[name] = createAPI({
            apiRequest: api,
            ctx: this.#ctx,
            componentData: this.#signal.get(),
          })
        }
      },
    )
    Object.values(this.#ctx.apis)
      .filter(isContextApiV2)
      .forEach((api) => {
        api.triggerActions(this.#signal.get())
      })

    let providers = this.#ctx.providers
    if (isContextProvider(this.#component)) {
      // Subscribe to exposed formulas and update the component's data signal
      const formulaDataSignals = Object.fromEntries(
        Object.entries(this.#component.formulas ?? {})
          .filter(([, formula]) => formula.exposeInContext)
          .map(([name, formula]) => [
            name,
            this.#signal.map(
              (data) =>
                applyFormula(formula.formula, {
                  data,
                  component: this.#component,
                  formulaCache: this.#ctx.formulaCache,
                  root: this.#ctx.root,
                  package: this.#ctx.package,
                  toddle: this.#ctx.toddle,
                  env: this.#ctx.env,
                }) as any,
            ),
          ]),
      )

      providers = {
        ...providers,
        [this.#component.name]: {
          component: this.#component,
          formulaDataSignals,
          ctx: this.#ctx,
        },
      }
    }

    this.#ctx.providers = providers
    this.render()
  }

  disconnectedCallback() {
    this.#signal.destroy()
  }

  dispatch(eventName: string, data: any) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail: data,
        bubbles: true,
        composed: true,
      }),
    )
  }

  render() {
    const elements = renderComponent({
      ...this.#ctx,
      path: '0',
      onEvent: this.dispatch.bind(this),
      parentElement: this.#shadowRoot,
      instance: { [this.#component.name]: 'root' },
    })

    this.#shadowRoot.innerHTML = ''
    const styles = createStylesheet(
      this.#ctx.component,
      this.#ctx.components,
      this.#files.themes ? Object.values(this.#files.themes)[0] : defaultTheme,
      { includeResetStyle: true, createFontFaces: false },
    )
    const stylesElem = document.createElement('style')
    stylesElem.appendChild(document.createTextNode(styles))
    this.#shadowRoot.appendChild(stylesElem)
    const rootElement = elements[0] as Element | null
    if (rootElement) {
      this.#shadowRoot.appendChild(rootElement)
    }
  }

  // Overload the setAttribute method to allow setting complex attributes
  setAttribute(name: string, value: unknown) {
    switch (typeof value) {
      case 'number':
        super.setAttribute(name, String(value))
        break
      case 'string':
        super.setAttribute(name, value)
        // Return early, as signal is updated through attributeChangedCallback on string values
        return this
      default:
        super.setAttribute(name, `[Object ${typeof value}]`)
        break
    }

    // Update the signal with complex value
    this.#signal.set({
      ...this.#signal.get(),
      Attributes: {
        ...this.#signal.get().Attributes,
        [name]: value,
      },
    })

    return this
  }

  // Overload the getAttribute method to point to source of truth (the signal)
  getAttribute<T>(name: string) {
    return (
      (this.#signal.get().Attributes[name] as T) || super.getAttribute(name)
    )
  }

  attributeChangedCallback(name: string, oldValue: never, newValue: string) {
    const attributeName = this.getAttributeCaseInsensitive(name)
    const currentRawValue = this.getAttribute(attributeName)
    // Is this is a complex value that has already been set by `setAttribute`
    if (newValue === '[Object object]') {
      return
    }

    //Has this just been set by `setAttribute` as a number
    if (parseFloat(newValue) === currentRawValue) {
      return
    }

    this.#signal.set({
      ...this.#signal.get(),
      Attributes: {
        ...this.#signal.get().Attributes,
        [attributeName]: newValue,
      },
    })
  }

  private getAttributeCaseInsensitive(name: string) {
    const attributeName = Object.keys(this.#signal.get().Attributes).find(
      (key) => key.toLowerCase() === name.toLowerCase(),
    )

    // This should never happen (TM) as we only observe attributes that are defined on the component
    if (!attributeName) {
      throw new Error(
        `Unable to find attribute ${name} on component ${this.#component.name}`,
      )
    }

    return attributeName
  }

  // Debugging purposes
  get __component() {
    return this.#component
  }

  get __ctx() {
    return this.#ctx
  }

  get __signal() {
    return this.#signal
  }
}

export const createSignal = ({
  component,
  root,
  toddle,
  env,
}: {
  component: Component
  root: ShadowRoot
  toddle: Toddle<LocationSignal, never>
  env: ToddleEnv
}) => {
  return signal<ComponentData>({
    // Pages are not supported as custom elements, so no need to add location signal
    Location: undefined,
    Variables: mapObject(component.variables, ([name, { initialValue }]) => {
      if (!component) {
        throw new Error(`Component not found`)
      }
      return [
        name,
        applyFormula(initialValue, {
          data: {
            Attributes: {},
          },
          component: component,
          root,
          package: undefined,
          toddle,
          env,
        }),
      ]
    }),
    Attributes: mapObject(component.attributes, ([name]) => [
      name,
      // TODO: Perhaps we can get it from the DOM already and set initial attributes already?
      undefined,
    ]),
    Apis: mapObject(component.apis, ([name]) => [
      name,
      { data: null, isLoading: false, error: null },
    ]),
  })
}
