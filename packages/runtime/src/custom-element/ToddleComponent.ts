import type {
  Component,
  ComponentData,
  ComponentFormula,
  Theme,
  Toddle,
  ToddleEnv,
} from '@nordcraft/core'
import {
  applyFormula,
  createStylesheet,
  theme as defaultTheme,
  isDefined,
  isLegacyApi,
  THEME_DATA_ATTRIBUTE,
} from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import fastDeepEqual from 'fast-deep-equal'
import { isContextApiV2 } from '../api/apiUtils'
import { createLegacyAPI } from '../api/createAPI'
import { createAPI } from '../api/createAPIv2'
import { sortApiEntries } from '../api/sortApis'
import { renderComponent } from '../components/renderComponent'
import { isContextProvider } from '../context/isContextProvider'
import { Signal, signal } from '../signal/signal'
import type { ComponentContext, LocationSignal } from '../types'
import { createFormulaCache } from '../utils/createFormulaCache'
import { getThemeSignal } from '../utils/getThemeSignal'
import { isStaticFormula } from '../utils/isStaticFormula'

const DEFAULT_THEMES = { defaultTheme }

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
  #files: { themes: Record<string, Theme> }
  // Maps lowercased attribute names to their original case, so attributeChangedCallback
  // (which receives lowercased names from observedAttributes) can look them up in the
  // component's attributes without scanning the whole object on every change.
  #attributeNames: Map<string, string>

  constructor(
    component: Component,
    options: { components: Component[]; themes: Record<string, Theme> },
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
    this.#attributeNames = new Map()
    const componentAttrs = component.attributes
    if (componentAttrs) {
      for (const key in componentAttrs) {
        this.#attributeNames.set(key.toLowerCase(), key)
      }
    }

    // Call the abort signal if the component's datasignal is destroyed (component unmounted) to cancel any pending requests
    const abortController = new AbortController()
    this.#signal.subscriptions.push(() =>
      abortController.abort(`Component ${component.name} unmounted`),
    )

    const themeSignal = getThemeSignal(component, this.#signal, env)
    this.#signal.value.Page = {
      ...this.#signal.value.Page,
      Theme: themeSignal.get(),
    }

    this.#ctx = {
      triggerEvent: this.dispatch.bind(this),
      root: this.#shadowRoot,
      isRootComponent: true,
      components: options.components,
      component: this.#component,
      dataSignal: this.#signal,
      formulaCache: createFormulaCache(component),
      apis: {},
      abortSignal: abortController.signal,
      children: {},
      providers: {},
      stores: {
        theme: themeSignal,
      },
      package: undefined,
      toddle,
      env,
      ...(IS_PREVIEW ? { jsonPath: [] } : {}),
    }
  }

  connectedCallback() {
    if (this.#ctx.abortSignal.aborted) {
      const abortController = new AbortController()
      this.#signal.subscriptions.push(() =>
        abortController.abort(`Component ${this.#component.name} unmounted`),
      )
      this.#ctx.abortSignal = abortController.signal
      const themeSignal = getThemeSignal(
        this.#component,
        this.#signal,
        this.#ctx.env,
      )
      this.#ctx.stores.theme = themeSignal
      this.#signal.value.Page = {
        ...this.#signal.value.Page,
        Theme: themeSignal.get(),
      }
    }
    sortApiEntries(this.#component.apis).forEach(([name, api]) => {
      if (isLegacyApi(api)) {
        this.#ctx.apis[name] = createLegacyAPI(
          api,
          IS_PREVIEW ? { ...this.#ctx, jsonPath: ['apis', name] } : this.#ctx,
        )
      } else {
        this.#ctx.apis[name] = createAPI({
          apiRequest: api,
          ctx: IS_PREVIEW
            ? { ...this.#ctx, jsonPath: ['apis', name] }
            : this.#ctx,
          componentData: this.#signal.get(),
        })
      }
    })
    // Plain loop: `Object.values(...).filter(...)` allocated two arrays per
    // custom element even when there are no APIs at all.
    for (const name in this.#ctx.apis) {
      const api = this.#ctx.apis[name]
      if (api && isContextApiV2(api)) {
        api.triggerActions(this.#signal.get())
      }
    }

    let providers = this.#ctx.providers
    if (isContextProvider(this.#component)) {
      // Subscribe to exposed formulas and update the component's data signal
      const formulaDataSignals: Record<string, Signal<ComponentData>> = {}
      const componentFormulas = this.#component.formulas
      if (componentFormulas) {
        for (const name in componentFormulas) {
          const formula = componentFormulas[name]
          if (!formula?.exposeInContext) {
            continue
          }
          const exposed = (formula as ComponentFormula).formula
          // Static exposed formula: evaluate once into a detached signal
          // (see createComponent).
          formulaDataSignals[name] = isStaticFormula(exposed)
            ? signal(applyFormula(exposed, this.#ctx, this.#signal.get()))
            : this.#signal.map((data) =>
                applyFormula(
                  exposed,
                  this.#ctx,
                  data,
                  IS_PREVIEW ? ['formulas', name] : undefined,
                ),
              )
        }
      }

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

    this.#ctx.stores.theme.subscribe((newTheme) => {
      if (this.#signal.get().Page?.Theme !== newTheme) {
        const data = this.#signal.value
        this.#signal.set(
          {
            ...data,
            Page: {
              ...data.Page,
              Theme: newTheme,
            },
          },
          Signal.FORCE_UPDATE,
        )
      }
      if (isDefined(newTheme)) {
        this.setAttribute(THEME_DATA_ATTRIBUTE, newTheme)
      } else {
        this.removeAttribute(THEME_DATA_ATTRIBUTE)
      }
    })
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
      Object.keys(this.#files.themes ?? {}).length > 0
        ? this.#files.themes
        : DEFAULT_THEMES,
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
    const data = this.#signal.value
    const currentAttr = data.Attributes?.[name]
    if (fastDeepEqual(currentAttr, value) === false) {
      this.#signal.set(
        {
          ...data,
          Attributes: {
            ...data.Attributes,
            [name]: value,
          },
        },
        Signal.FORCE_UPDATE,
      )
    }

    return this
  }

  // Overload the getAttribute method to point to source of truth (the signal)
  getAttribute<T>(name: string) {
    return (
      (this.#signal.get().Attributes?.[name] as T) || super.getAttribute(name)
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

    const data = this.#signal.value
    const currentAttr = data.Attributes?.[attributeName]
    if (fastDeepEqual(currentAttr, newValue) === false) {
      this.#signal.set(
        {
          ...data,
          Attributes: {
            ...data.Attributes,
            [attributeName]: newValue,
          },
        },
        Signal.FORCE_UPDATE,
      )
    }
  }

  private getAttributeCaseInsensitive(name: string) {
    const attributeName = this.#attributeNames.get(name.toLowerCase())

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
  const formulaCtx = {
    component,
    root,
    package: undefined,
    toddle,
    env,
  }
  const initialVariables: Record<string, unknown> = {}
  const componentVariables = component.variables
  if (componentVariables) {
    for (const name in componentVariables) {
      const variable = componentVariables[name]
      if (isDefined(variable)) {
        initialVariables[name] = applyFormula(
          variable.initialValue,
          formulaCtx,
          undefined,
        )
      }
    }
  }
  const initialAttributes: Record<string, unknown> = {}
  const componentAttributes = component.attributes
  if (componentAttributes) {
    for (const name in componentAttributes) {
      // TODO: Perhaps we can get it from the DOM already and set initial attributes already?
      initialAttributes[name] = undefined
    }
  }
  const initialApis: Record<
    string,
    { data: null; isLoading: boolean; error: null }
  > = {}
  const componentApis = component.apis
  if (componentApis) {
    for (const name in componentApis) {
      initialApis[name] = { data: null, isLoading: false, error: null }
    }
  }
  return signal<ComponentData>({
    // Pages are not supported as custom elements, so no need to add location signal
    Location: undefined,
    Variables: initialVariables,
    Attributes: initialAttributes,
    Apis: initialApis,
  })
}
