import { isLegacyApi, sortApiObjects } from '@nordcraft/core/dist/api/api'
import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import type { PluginFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import type {
  ActionHandler,
  ArgumentInputDataFunction,
  FormulaHandler,
  FormulaHandlerV2,
  PluginActionV2,
  RequireFields,
  Toddle,
} from '@nordcraft/core/dist/types'
import { mapObject } from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import * as libActions from '@nordcraft/std-lib/dist/actions'
import * as libFormulas from '@nordcraft/std-lib/dist/formulas'
import fastDeepEqual from 'fast-deep-equal'
import { match } from 'path-to-regexp'
import { createLegacyAPI } from './api/createAPI'
import { createAPI } from './api/createAPIv2'
import { renderComponent } from './components/renderComponent'
import { isContextProvider } from './context/isContextProvider'
import { initLogState, registerComponentToLogState } from './debug/logState'
import { signal } from './signal/signal'
import type { ComponentContext, ContextApi, LocationSignal } from './types'

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
  Object.entries(libFormulas).forEach(([name, module]) =>
    window.toddle.registerFormula(
      '@toddle/' + name,
      module.default as FormulaHandler,
      'getArgumentInputData' in module
        ? module.getArgumentInputData
        : undefined,
    ),
  )
  Object.entries(libActions).forEach(([name, module]) =>
    window.toddle.registerAction('@toddle/' + name, module.default),
  )
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
    Variables: mapObject(component.variables, ([name, variable]) => [
      name,
      applyFormula(variable.initialValue, {
        data: window.toddle.pageState,
        component,
        formulaCache: {},
        root: document,
        package: undefined,
        toddle: window.toddle,
        env,
      }),
    ]),
  })

  // Handle dynamic updates of <head> elements (title, og:image etc.)
  const titleFormula = component.route?.info?.title?.formula
  const dynamicTitle = titleFormula && titleFormula.type !== 'value'
  if (dynamicTitle) {
    dataSignal
      .map<string | null>(() =>
        component
          ? (applyFormula(titleFormula, {
              data: dataSignal.get(),
              component,
              root: document,
              package: undefined,
              toddle: window.toddle,
              env,
            }) as any)
          : null,
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
  const dynamicMetaFormulas = Object.values(meta ?? {}).some((r) =>
    Object.values(
      r.attrs ?? {}, // fallback to make sure we don't crash on legacy values
    ).some((a) => a.type !== 'value'),
  )
  if (dynamicDescription || dynamicMetaFormulas) {
    const findMetaElement = (name: string) =>
      [...document.getElementsByTagName('meta')].find(
        (el) => el.name === name || el.getAttribute('property') === name,
      ) ?? null

    const updateMetaElement = (
      entry: { tag: string; attrs: Record<string, string> },
      id?: string,
    ) => {
      let existingElement: HTMLElement | null = null
      if (isDefined(id)) {
        existingElement = document.querySelector(`[data-toddle-id="${id}"]`)
      } else {
        const identifier = Object.entries(entry.attrs ?? {}).find(([key]) =>
          ['property', 'name'].includes(key.toLowerCase()),
        )?.[1]
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
      Object.entries(entry.attrs ?? {}).forEach(([key, value]) => {
        if (!component) {
          return
        }
        existingElement!.setAttribute(key, value)
      })
    }
    if (dynamicDescription) {
      dataSignal
        .map<string | null>((data) =>
          component
            ? (applyFormula(descriptionFormula, {
                data,
                component,
                root: document,
                package: undefined,
                toddle: window.toddle,
                env,
              }) as any)
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
            if (
              meta &&
              !Object.values(meta).some((m) =>
                Object.entries(m.attrs ?? {}).some(
                  ([k, value]) =>
                    k.toLowerCase() === 'property' &&
                    value.type === 'value' &&
                    typeof value.value === 'string' &&
                    value.value.toLowerCase() === 'og:description',
                ),
              )
            ) {
              // If there is no formula for the og:description meta tag,
              // add it with the same value as the description meta tag
              // this mimics the behavior from our SSR
              updateMetaElement({
                tag: 'meta',
                attrs: {
                  property: 'og:description',
                  content: newDescription,
                },
              })
            }
          }
        })
    }
    if (dynamicMetaFormulas) {
      Object.entries(meta ?? {})
        // Filter out meta tags that have no dynamic formulas
        .filter(([_, entry]) =>
          // fallback to make sure we don't crash on legacy values.
          Object.values(entry.attrs ?? {}).some((a) => a.type !== 'value'),
        )
        .forEach(([id, entry]) => {
          dataSignal
            .map<Record<string, string>>((data) => {
              // Return the new values for all attributes (we assume they're strings)
              const values = Object.entries(entry.attrs ?? {}).reduce(
                (agg, [key, formula]) =>
                  component
                    ? {
                        ...agg,
                        [key]: applyFormula(formula, {
                          data,
                          component,
                          root: document,
                          package: undefined,
                          toddle: window.toddle,
                          env,
                        }),
                      }
                    : agg,
                {},
              )
              return values
            })
            .subscribe((attrs) =>
              // Update the meta tags with the new values
              updateMetaElement({ tag: entry.tag, attrs }, id),
            )
        })
    }
  }

  registerComponentToLogState(component, dataSignal)

  routeSignal.subscribe((route) =>
    dataSignal.update((data) => ({
      ...data,
      'URL parameters': route as Record<string, string>,
      Attributes: route,
    })),
  )

  // Call the abort signal if the component's datasignal is destroyed (component unmounted) to cancel any pending requests
  const abortController = new AbortController()
  dataSignal.subscribe(() => {}, {
    destroy: () =>
      abortController.abort(`Component ${component.name} unmounted`),
  })

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
    apis: {},
    toddle: window.toddle,
    triggerEvent: (event: string, data: unknown) =>
      // eslint-disable-next-line no-console
      console.info('EVENT FIRED', event, data),
    package: undefined,
    env,
  }

  // Note: this function must run procedurally to ensure apis (which are in correct order) can reference each other
  sortApiObjects(Object.entries(component.apis)).forEach(([name, api]) => {
    if (isLegacyApi(api)) {
      ctx.apis[name] = createLegacyAPI(api, ctx)
    } else {
      ctx.apis[name] = createAPI(api, ctx)
    }
  })
  // Trigger actions for all APIs after all of them are created.
  Object.values(ctx.apis)
    .filter(
      (api): api is RequireFields<ContextApi, 'triggerActions'> =>
        api.triggerActions !== undefined,
    )
    .forEach((api) => {
      api.triggerActions()
    })

  let providers = ctx.providers
  if (isContextProvider(component)) {
    // Subscribe to exposed formulas and update the component's data signal
    const formulaDataSignals = Object.fromEntries(
      Object.entries(component.formulas ?? {})
        .filter(([, formula]) => formula.exposeInContext)
        .map(([name, formula]) => [
          name,
          dataSignal.map(
            (data) =>
              applyFormula(formula.formula, {
                data,
                component,
                formulaCache: ctx.formulaCache,
                root: ctx.root,
                package: ctx.package,
                toddle: window.toddle,
                env,
              }) as any,
          ),
        ]),
    )

    providers = {
      ...providers,
      [component.name]: {
        component,
        formulaDataSignals,
        ctx,
      },
    }
  }

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
  elements.forEach((elem) => {
    domNode.appendChild(elem)
  })
  window.__toddle.isPageLoaded = true
}

function parseUrl(component: Component) {
  const path = window.location.pathname.split('/').slice(1)
  let params: Record<string, string | null> = {}
  if (component.route) {
    component.route.path.forEach((segment, i) => {
      if (segment.type === 'param') {
        if (isDefined(path[i]) && path[i] !== '') {
          params[segment.name] = decodeURIComponent(path[i])
        } else {
          params[segment.name] = null
        }
      } else {
        params[segment.name] = segment.name
      }
    })
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
  const defaultQueryParams = Object.keys(component.route?.query ?? {}).reduce<
    Record<string, null>
  >((params, key) => ({ ...params, [key]: null }), {})
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
