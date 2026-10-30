import type {
  ActionHandler,
  ArgumentInputDataFunction,
  Component,
  ComponentAPI,
  ComponentData,
  ComponentFormula,
  ComponentVariable,
  FormulaHandler,
  FormulaHandlerV2,
  Nullable,
  PluginActionV2,
  PluginFormula,
  Toddle,
  ToddleEnv,
} from '@nordcraft/core'
import {
  applyFormula,
  filterObject,
  isDefined,
  isLegacyApi,
  mapObject,
  THEME_DATA_ATTRIBUTE,
  VOID_HTML_ELEMENTS,
} from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import * as libActions from '@nordcraft/std-lib/actions'
import * as libFormulas from '@nordcraft/std-lib/formulas'
import fastDeepEqual from 'fast-deep-equal'
import { match } from 'path-to-regexp'
import { isContextApiV2 } from './api/apiUtils'
import { createLegacyAPI } from './api/createAPI'
import { createAPI } from './api/createAPIv2'
import { sortApis } from './api/sortApis'
import { getDynamicMetaEntries } from './components/meta'
import { renderComponent } from './components/renderComponent'
import { isContextProvider } from './context/isContextProvider'
import { initLogState, registerComponentToLogState } from './debug/logState'
import type { Signal } from './signal/signal'
import { signal } from './signal/signal'
import type { ComponentContext, LocationSignal } from './types'
import { getThemeSignal } from './utils/getThemeSignal'

initLogState()

let env: ToddleEnv

export const initGlobalObject = (code?: {
  formulas: Record<string, Record<string, PluginFormula<FormulaHandlerV2>>>
  actions: Record<string, Record<string, PluginActionV2>>
}) => {
  const component = window.__toddle.component
  const { params, hash, query } = parseUrl(component)
  env = {
    isServer: false,
    branchName: window.__toddle.branch,
    request: undefined,
    runtime: 'page',
    logErrors: true,
  }
  window.toddle = (() => {
    const legacyActions: Record<string, ActionHandler> = {}
    const legacyFormulas: Record<string, FormulaHandler> = {}
    const argumentInputDataList: Record<string, ArgumentInputDataFunction> = {}
    const toddle: Toddle<LocationSignal, never> = {
      isEqual: fastDeepEqual,
      errors: [],
      project: window.__toddle.project,
      branch: window.__toddle.branch,
      commit: window.__toddle.commit,
      components: window.__toddle.components,
      formulas: code?.formulas ?? {},
      actions: code?.actions ?? {},
      registerAction: (name, handler) => {
        if (legacyActions[name]) {
          // eslint-disable-next-line no-console
          console.error('There already exists an action with the name ', name)
          return
        }
        legacyActions[name] = handler
      },
      getAction: (name) => legacyActions[name],
      registerFormula: (name, handler, getArgumentInputData) => {
        if (legacyFormulas[name]) {
          // eslint-disable-next-line no-console
          console.error('There already exists a formula with the name ', name)
          return
        }
        legacyFormulas[name] = handler
        if (getArgumentInputData) {
          argumentInputDataList[name] = getArgumentInputData
        }
      },
      getFormula: (name) => legacyFormulas[name],
      getCustomAction: (name, packageName) => {
        return (
          toddle.actions[packageName ?? window.__toddle.project]?.[name] ??
          toddle.actions[window.__toddle.project]?.[name]
        )
      },
      getCustomFormula: (name, packageName) => {
        return (
          toddle.formulas[packageName ?? window.__toddle.project]?.[name] ??
          toddle.formulas[window.__toddle.project]?.[name]
        )
      },
      // eslint-disable-next-line max-params
      getArgumentInputData: (formulaName, args, argIndex, data) =>
        argumentInputDataList[formulaName]?.(args, argIndex, data) || data,
      data: {},
      locationSignal: signal<any>({
        route: component.route,
        page: component.page as string,
        path: window.location.pathname,
        params,
        query,
        hash,
      }),
      eventLog: [],
      pageState: window.__toddle.pageState,
      env,
    }
    return toddle
  })()

  // load default formulas and actions
  for (const name in libFormulas) {
    const module = (libFormulas as Record<string, any>)[name]
    window.toddle.registerFormula(
      '@toddle/' + name,
      module.default as FormulaHandler,
      'getArgumentInputData' in module
        ? module.getArgumentInputData
        : undefined,
    )
  }
  for (const name in libActions) {
    const module = (libActions as Record<string, any>)[name]
    window.toddle.registerAction('@toddle/' + name, module.default)
  }
}

export const createRoot = (domNode: HTMLElement) => {
  const component = window.__toddle.component
  if (!domNode) {
    throw new Error('Cant find root domNode')
  }

  if (!window.toddle.components) {
    throw new Error('Missing components')
  }

  window.addEventListener('popstate', () => {
    if (!component) {
      return
    }
    const { params, hash, query } = parseUrl(component)
    window.toddle.locationSignal.update(() => {
      return {
        route: component?.route,
        page: component!.page as string,
        path: window.location.pathname,
        params,
        query,
        hash,
      }
    })
  })

  const routeSignal = window.toddle.locationSignal.map(({ query, params }) => {
    return { ...query, ...params }
  })

  const dataSignal = signal<ComponentData>({
    ...window.toddle.pageState,
    // Re-initialize variables since some of them might rely on client-side
    // state (e.g. localStorage, sensors etc.)
    Variables: mapObject(
      filterObject<Nullable<ComponentVariable>, ComponentVariable>(
        component.variables ?? {},
        ([_, variable]) => isDefined(variable),
      ),
      ([name, variable]) => [
        name,
        applyFormula(
          variable.initialValue,
          {
            component,
            formulaCache: {},
            root: document,
            package: undefined,
            toddle: window.toddle,
            env,
          },
          window.toddle.pageState,
        ),
      ],
    ),
  })

  registerComponentToLogState(component, dataSignal)

  routeSignal.subscribe((route) =>
    dataSignal.update(
      (data) => ({
        ...data,
        'URL parameters': route as Record<string, string>,
        Attributes: route,
      }),
      { force: true },
    ),
  )

  // Call the abort signal if the component's datasignal is destroyed (component unmounted) to cancel any pending requests
  const abortController = new AbortController()
  dataSignal.subscriptions.push(() =>
    abortController.abort(`Component ${component.name} unmounted`),
  )

  const ctx: ComponentContext = {
    component,
    components: window.toddle.components,
    root: document,
    isRootComponent: true,
    dataSignal,
    abortSignal: abortController.signal,
    children: {},
    formulaCache: {},
    providers: {},
    stores: {
      theme: getThemeSignal(component, dataSignal, env),
    },
    apis: {},
    toddle: window.toddle,
    triggerEvent: () => {},
    package: undefined,
    env,
  }

  // Note: this function must run procedurally to ensure apis (which are in correct order) can reference each other
  const apiEntries: [string, ComponentAPI][] = []
  if (component.apis) {
    for (const name in component.apis) {
      const api = component.apis[name]
      if (isDefined(api)) {
        apiEntries.push([name, api])
      }
    }
  }
  for (const [name, api] of sortApis(apiEntries)) {
    if (isLegacyApi(api)) {
      ctx.apis[name] = createLegacyAPI(api, ctx)
    } else {
      ctx.apis[name] = createAPI({
        apiRequest: api,
        ctx,
        componentData: dataSignal.get(),
      })
    }
  }
  // Trigger actions for all APIs after all of them are created.
  for (const apiName in ctx.apis) {
    const api = ctx.apis[apiName]
    if (isContextApiV2(api)) {
      api.triggerActions(dataSignal.get())
    }
  }

  let providers = ctx.providers
  if (isContextProvider(component)) {
    // Subscribe to exposed formulas and update the component's data signal
    const formulaDataSignals: Record<string, Signal<any>> = {}
    if (component.formulas) {
      for (const name in component.formulas) {
        const formula = component.formulas[name]
        if (formula?.exposeInContext) {
          formulaDataSignals[name] = dataSignal.map((data) =>
            applyFormula((formula as ComponentFormula).formula, ctx, data),
          )
        }
      }
    }

    providers = {
      ...providers,
      [component.name]: {
        component,
        formulaDataSignals,
        ctx,
      },
    }
  }

  ctx.stores.theme.subscribe((newTheme) => {
    // The page's dataSignal also needs to be updated so that `Page.Theme` formulas works on page components
    if (dataSignal.get().Page?.Theme !== newTheme) {
      dataSignal.update(
        (data) => ({
          ...data,
          Page: {
            ...(data.Page ?? {}),
            Theme: newTheme,
          },
        }),
        { force: true },
      )
    }
    if (isDefined(newTheme)) {
      document.documentElement.setAttribute(THEME_DATA_ATTRIBUTE, newTheme)
    } else {
      document.documentElement.removeAttribute(THEME_DATA_ATTRIBUTE)
    }
  })

  // We can only setup meta updates after the dataSignal has been initiated with API data etc.
  setupMetaUpdates(component, dataSignal)

  const elements = renderComponent({
    ...ctx,
    providers,
    path: '0',
    package: undefined,
    onEvent: ctx.triggerEvent,
    parentElement: domNode,
    instance: {},
  })
  domNode.innerText = ''
  for (const elem of elements) {
    domNode.appendChild(elem)
  }
  window.__toddle.isPageLoaded = true
}

function parseUrl(component: Component) {
  const path = window.location.pathname.split('/').slice(1)
  let params: Record<string, string | null> = {}
  if (component.route) {
    for (let i = 0; i < component.route.path.length; i++) {
      const segment = component.route.path[i]!
      if (segment.type === 'param') {
        if (isDefined(path[i]) && path[i] !== '') {
          params[segment.name] = decodeURIComponent(path[i]!)
        } else {
          params[segment.name] = null
        }
      } else {
        params[segment.name] = segment.name
      }
    }
  } else {
    const urlPattern = match<Record<string, string>>(component.page ?? '', {
      decode: decodeURIComponent,
    })
    const res = urlPattern(window.location.pathname) || {
      params: {},
    }
    params = res.params
  }

  const [hash] = window.location.hash.split('?')
  const query = parseQuery(window.location.search) as Record<string, string>
  // Explicitly set all query params to null by default
  // to avoid undefined values in the runtime
  const defaultQueryParams: Record<string, null> = {}
  if (component.route?.query) {
    for (const key in component.route.query) {
      defaultQueryParams[key] = null
    }
  }
  return {
    params,
    hash: hash?.slice(1),
    query: { ...defaultQueryParams, ...query },
  }
}

const parseQuery = (queryString: string) =>
  Object.fromEntries(
    queryString
      .replace('?', '')
      .split('&')
      .filter((pair) => pair !== '')
      .map((pair: string) => {
        return pair.split('=').map(decodeURIComponent)
      }),
  )

const setupMetaUpdates = (
  component: Component,
  dataSignal: Signal<ComponentData>,
) => {
  const formulaContext = {
    component,
    root: document,
    package: undefined,
    toddle: window.toddle,
    env,
  }
  // Handle dynamic updates of the document language
  const langFormula = component.route?.info?.language?.formula
  const dynamicLang = langFormula && langFormula.type !== 'value'
  if (dynamicLang) {
    dataSignal
      .map((data) =>
        component ? applyFormula(langFormula, formulaContext, data) : null,
      )
      .subscribe((newLang) => {
        if (isDefined(newLang) && document.documentElement.lang !== newLang) {
          document.documentElement.setAttribute('lang', newLang)
        }
      })
  }

  // Handle dynamic updates of <head> elements (title, og:image etc.)
  const titleFormula = component.route?.info?.title?.formula
  const dynamicTitle = titleFormula && titleFormula.type !== 'value'
  if (dynamicTitle) {
    dataSignal
      .map((data) =>
        component ? applyFormula(titleFormula, formulaContext, data) : null,
      )
      .subscribe((newTitle) => {
        if (isDefined(newTitle) && document.title !== newTitle) {
          document.title = newTitle
        }
      })
  }

  const descriptionFormula = component.route?.info?.description?.formula
  const meta = component.route?.info?.meta
  const dynamicDescription =
    descriptionFormula && descriptionFormula.type !== 'value'
  const dynamicMetaFormulas = getDynamicMetaEntries(meta)
  let hasDynamicMetaFormulas = false
  for (const _ in dynamicMetaFormulas) {
    hasDynamicMetaFormulas = true
    break
  }
  if (dynamicDescription || hasDynamicMetaFormulas) {
    const findMetaElement = (name: string) =>
      [...document.getElementsByTagName('meta')].find(
        (el) => el.name === name || el.getAttribute('property') === name,
      ) ?? null

    const updateMetaElement = (
      entry: {
        tag: string
        attrs: Record<string, string>
        content: string | undefined
      },
      id?: string,
    ) => {
      let existingElement: HTMLElement | null = null
      if (isDefined(id)) {
        existingElement = document.querySelector(`[data-toddle-id="${id}"]`)
      } else {
        let identifier: string | undefined
        if (entry.attrs) {
          for (const key in entry.attrs) {
            const lower = key.toLowerCase()
            if (lower === 'property' || lower === 'name') {
              identifier = entry.attrs[key]
              break
            }
          }
        }
        if (isDefined(identifier)) {
          existingElement = findMetaElement(identifier)
        }
      }
      if (!existingElement) {
        // If the element didn't already exist, create it
        existingElement = document.createElement(entry.tag)
        if (isDefined(id)) {
          existingElement.setAttribute('data-toddle-id', id)
        }
        document.getElementsByTagName('head')[0].appendChild(existingElement)
      }
      // Apply all attributes to the element
      if (component && entry.attrs) {
        for (const key in entry.attrs) {
          existingElement!.setAttribute(key, entry.attrs[key])
        }
      }
      if (
        typeof entry.content === 'string' &&
        !VOID_HTML_ELEMENTS.includes(entry.tag.toLowerCase())
      ) {
        existingElement.textContent = entry.content
      }
    }
    if (dynamicDescription) {
      dataSignal
        .map((data) =>
          component
            ? applyFormula(descriptionFormula, formulaContext, data)
            : null,
        )
        .subscribe((newDescription) => {
          if (isDefined(newDescription)) {
            let descriptionElement = document
              .getElementsByTagName('meta')
              .namedItem('description')
            if (!descriptionElement) {
              descriptionElement = document.createElement('meta')
              descriptionElement.name = 'description'
            }
            descriptionElement.content = newDescription
            document
              .getElementsByTagName('head')[0]
              .appendChild(descriptionElement)
            let hasOgDescription = false
            if (meta) {
              for (const mKey in meta) {
                const m = meta[mKey]
                if (m.attrs) {
                  for (const k in m.attrs) {
                    const value = m.attrs[k]
                    if (
                      k.toLowerCase() === 'property' &&
                      value?.type === 'value' &&
                      typeof value.value === 'string' &&
                      value.value.toLowerCase() === 'og:description'
                    ) {
                      hasOgDescription = true
                      break
                    }
                  }
                  if (hasOgDescription) break
                }
              }
            }
            if (meta && !hasOgDescription) {
              // If there is no formula for the og:description meta tag,
              // add it with the same value as the description meta tag
              // this mimics the behavior from our SSR
              updateMetaElement({
                tag: 'meta',
                attrs: {
                  property: 'og:description',
                  content: newDescription,
                },
                content: undefined,
              })
            }
          }
        })
    }
    if (hasDynamicMetaFormulas) {
      for (const id in dynamicMetaFormulas) {
        const entry = dynamicMetaFormulas[id]
        if (entry) {
          dataSignal
            .map((data) => {
              // Return the new values for all attributes (we assume they're strings)
              const values: Record<string, any> = {}
              if (component && entry.attrs) {
                for (const key in entry.attrs) {
                  values[key] = applyFormula(
                    entry.attrs[key],
                    formulaContext,
                    data,
                  )
                }
              }
              return {
                attrs: values,
                content: entry.content
                  ? applyFormula(entry.content, formulaContext, data)
                  : undefined,
              }
            })
            .subscribe(({ attrs, content }) =>
              // Update the meta tags with the new values
              updateMetaElement({ tag: entry.tag, attrs, content }, id),
            )
        }
      }
    }
  }
}
