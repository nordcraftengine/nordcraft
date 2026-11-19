import type {
  ComponentData,
  ComponentNodeModel,
  FormulaContext,
  SupportedNamespaces,
} from '@nordcraft/core'
import {
  applyFormula,
  getNodeSelector,
  isDefined,
  isLegacyApi,
  ROOT_NODE_ID,
  slotBasePath,
} from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import fastDeepEqual from 'fast-deep-equal'
import { isContextApiV2 } from '../api/apiUtils'
import { createLegacyAPI } from '../api/createAPI'
import { createAPI } from '../api/createAPIv2'
import { sortApiEntries } from '../api/sortApis'
import {
  createFormulaDataSignals,
  isContextProvider,
} from '../context/isContextProvider'
import { subscribeToContext } from '../context/subscribeToContext'
import { registerComponentToLogState } from '../debug/logState'
import { handleAction } from '../events/handleAction'
import type { Signal } from '../signal/signal'
import { FORCE_UPDATE, signal } from '../signal/signal'
import type { ComponentChild, ComponentContext, ContextApi } from '../types'
import { createFormulaCache } from '../utils/createFormulaCache'
import { getComponent } from '../utils/getComponent'
import { bindCustomProperties } from '../utils/subscribeCustomProperty'
import type { HydrationState } from './hydration'
import { renderComponent } from './renderComponent'

export type RenderComponentNodeProps = {
  path: string
  node: ComponentNodeModel
  id?: string
  dataSignal: Signal<ComponentData>
  ctx: ComponentContext
  parentElement: Element | ShadowRoot
  instance: Record<string, string>
  namespace?: SupportedNamespaces
  slotRepeatIndex?: number
  slotSuffix?: string
  hydration?: HydrationState
}

export function createComponent({
  node,
  id,
  path,
  dataSignal,
  ctx,
  parentElement,
  instance,
  namespace,
  slotRepeatIndex,
  slotSuffix,
  hydration,
}: RenderComponentNodeProps): ReadonlyArray<Element | Text> {
  const nodeId = id ?? node.id
  const nodeLookupKey = ctx.package ? `${ctx.package}/${node.name}` : node.name
  const component = getComponent(nodeLookupKey, ctx.components, !IS_PREVIEW)
  if (!component) {
    // eslint-disable-next-line no-console
    console.warn(
      `Could not find component "${nodeLookupKey}" for component "${
        ctx.component.name
      }". Available components are: ["${ctx.components
        .map((c) => c.name)
        .join('", "')}"]`,
    )
    return []
  }
  const formulaCtx =
    IS_PREVIEW && (ctx.reportFormulaEvaluation || ctx.jsonPath)
      ? {
          component: ctx.component,
          formulaCache: ctx.formulaCache,
          root: ctx.root,
          package: ctx.package,
          toddle: ctx.toddle,
          env: ctx.env,
          reportFormulaEvaluation: ctx.reportFormulaEvaluation,
        }
      : ctx
  const attrs = node.attrs
  let hasDynamicAttrs = IS_PREVIEW
  const initialData = dataSignal.get()
  const initialAttributes: Record<string, unknown> = {}
  for (const attr in attrs) {
    const value = attrs[attr]
    if (value?.type !== 'value') {
      hasDynamicAttrs = true
      initialAttributes[attr] = applyFormula(
        value,
        formulaCtx,
        initialData,
        IS_PREVIEW && ctx.reportFormulaEvaluation ? ['attrs', attr] : undefined,
      )
    } else {
      initialAttributes[attr] = value.value
    }
  }

  const formulaCache = createFormulaCache(component)
  const apiFormulaCtx: FormulaContext = {
    ...formulaCtx,
    component,
    formulaCache,
  }
  const initialApis: Record<
    string,
    { data: null; isLoading: boolean; error: null }
  > = {}
  for (const name in component.apis) {
    const api = component.apis[name]
    if (isDefined(api)) {
      initialApis[name] = {
        data: null,
        isLoading: Boolean(
          api.autoFetch &&
          applyFormula(
            api.autoFetch,
            apiFormulaCtx,
            initialData,
            IS_PREVIEW ? ['apis', name, 'autoFetch'] : undefined,
          ),
        ),
        error: null,
      }
    }
  }
  const initialTheme = ctx.stores.theme.get()
  const componentDataSignal = signal<ComponentData>({
    Location: initialData.Location,
    Attributes: initialAttributes,
    Apis: initialApis,
    ...(initialTheme !== undefined ? { Page: { Theme: initialTheme } } : {}),
  })

  // Subscribe to global stores (currently only theme)
  // We subscribe before calculating variable initial values to ensure they can reference global store values
  componentDataSignal.subscriptions.push(
    ctx.stores.theme.subscribe((newTheme) => {
      if (componentDataSignal.get().Page?.Theme !== newTheme) {
        const data = componentDataSignal.value
        componentDataSignal.set(
          {
            ...data,
            Page: {
              ...data.Page,
              Theme: newTheme,
            },
          },
          FORCE_UPDATE,
        )
      }
    }),
  )

  // Subscribe context before calculating variable initial values to ensure they can reference context values
  subscribeToContext(componentDataSignal, component, ctx)
  const initialVariables: Record<string, unknown> = {}
  for (const name in component.variables) {
    const variable = component.variables[name]
    if (isDefined(variable)) {
      initialVariables[name] = applyFormula(
        variable.initialValue,
        apiFormulaCtx,
        componentDataSignal.get(),
        IS_PREVIEW ? ['variables', name] : undefined,
      )
    }
  }
  componentDataSignal.value.Variables = initialVariables
  registerComponentToLogState(component, componentDataSignal)

  // Call the abort signal if the component's datasignal is destroyed (component unmounted) to cancel any pending requests
  const abortController = new AbortController()
  componentDataSignal.subscriptions.push(() =>
    abortController.abort(`Component ${component.name} unmounted`),
  )
  if (IS_PREVIEW && ctx.reportFormulaEvaluation) {
    componentDataSignal.subscribe((data) => {
      const vars = data.Variables
      if (vars) {
        for (const name in vars) {
          ctx.reportFormulaEvaluation?.(['variables', name], vars[name], ctx)
        }
      }
    })
  }

  // Note: this function must run procedurally to ensure apis (which are in correct order) can reference each other
  const apis: Record<string, ContextApi> = {}
  const onEvent = (eventTrigger: string, data: unknown) => {
    const events = node.events
    if (!events) {
      return
    }
    for (const key in events) {
      const eventHandler = events[key]
      if (eventHandler?.trigger === eventTrigger) {
        const actions = eventHandler.actions
        if (actions) {
          for (let i = 0; i < actions.length; i++) {
            void handleAction(
              actions[i]!,
              { ...dataSignal.get(), Event: data },
              ctx,
            )
          }
        }
        return
      }
    }
  }
  if (component.apis) {
    for (const [name, api] of sortApiEntries(component.apis)) {
      if (isLegacyApi(api)) {
        apis[name] = createLegacyAPI(api, {
          ...ctx,
          apis,
          component,
          dataSignal: componentDataSignal,
          abortSignal: abortController.signal,
          isRootComponent: false,
          formulaCache,
          package: node.package ?? ctx.package,
          triggerEvent: onEvent,
        })
      } else {
        apis[name] = createAPI({
          apiRequest: api,
          ctx: {
            ...ctx,
            apis,
            component,
            dataSignal: componentDataSignal,
            abortSignal: abortController.signal,
            isRootComponent: false,
            formulaCache,
            package: node.package ?? ctx.package,
            triggerEvent: onEvent,
          },
          componentData: componentDataSignal.get(),
        })
      }
    }
    for (const name in apis) {
      const api = apis[name]
      if (api && isContextApiV2(api)) {
        api.triggerActions(componentDataSignal.get())
      }
    }
  }

  let providers = ctx.providers
  if (isContextProvider(component)) {
    // Subscribe to exposed formulas and update the component's data signal
    const providerFormulaCtx: FormulaContext =
      IS_PREVIEW && (ctx.reportFormulaEvaluation || ctx.jsonPath)
        ? {
            ...apiFormulaCtx,
            jsonPath: ctx.jsonPath,
            reportFormulaEvaluation: ctx.reportFormulaEvaluation,
          }
        : apiFormulaCtx
    const formulaDataSignals = createFormulaDataSignals(
      component,
      componentDataSignal,
      providerFormulaCtx,
    )

    providers = {
      ...providers,
      [component.name]: {
        component,
        formulaDataSignals,
        ctx: {
          ...ctx,
          apis,
          component,
          dataSignal: componentDataSignal,
          abortSignal: abortController.signal,
          triggerEvent: onEvent,
        },
      },
    }
  }

  const children: Record<string, Array<ComponentChild>> = {}
  const nodeChildren = node.children
  if (nodeChildren) {
    const slotChildPackage = node.package ?? ctx.package
    const slotChildCtx =
      slotChildPackage === ctx.package
        ? ctx
        : { ...ctx, package: slotChildPackage }
    for (let i = 0; i < nodeChildren.length; i++) {
      const childId = nodeChildren[i]
      if (childId === undefined) {
        continue
      }
      const childNode = ctx.component.nodes?.[childId]
      const slotName = childNode?.slot ?? 'default'
      children[slotName] = children[slotName] ?? []
      children[slotName].push({
        id: childId,
        path: slotBasePath(path, i, slotName),
        dataSignal,
        ctx: slotChildCtx,
      })
    }
  }

  if (hasDynamicAttrs) {
    let skipData: ComponentData | undefined = initialData
    dataSignal.subscribe(
      (data) => {
        if (data === skipData) {
          skipData = undefined
          return
        }
        skipData = undefined
        const prevAttrs = componentDataSignal.value.Attributes
        let nextAttrs: Record<string, unknown> | undefined
        for (const attr in attrs) {
          const value = attrs[attr]
          if (!IS_PREVIEW && value?.type === 'value') {
            continue
          }
          const nextVal = applyFormula(
            value,
            formulaCtx,
            data,
            IS_PREVIEW && ctx.reportFormulaEvaluation
              ? ['attrs', attr]
              : undefined,
          )
          if (nextAttrs) {
            nextAttrs[attr] = nextVal
          } else if (
            nextVal !== prevAttrs?.[attr] &&
            !fastDeepEqual(nextVal, prevAttrs?.[attr])
          ) {
            nextAttrs = { ...prevAttrs, [attr]: nextVal }
          }
        }
        if (nextAttrs) {
          componentDataSignal.set(
            {
              ...componentDataSignal.value,
              Attributes: nextAttrs,
            },
            FORCE_UPDATE,
          )
        }
      },
      { destroy: () => componentDataSignal.destroy() },
    )
  } else {
    dataSignal.subscriptions.push(() => componentDataSignal.destroy())
  }

  const renderedComponent = renderComponent({
    dataSignal: componentDataSignal,
    component,
    components: ctx.components,
    path,
    root: ctx.root,
    isRootComponent: false,
    children,
    formulaCache,
    providers,
    stores: ctx.stores,
    apis,
    abortSignal: abortController.signal,
    package: node.package ?? ctx.package,
    parentElement,
    onEvent,
    toddle: ctx.toddle,
    env: ctx.env,
    namespace,
    hydration,
    // If the root node is another component, then append and forward previous instance
    instance:
      nodeId === ROOT_NODE_ID
        ? { ...instance, [ctx.component.name]: ROOT_NODE_ID }
        : { [ctx.component.name]: nodeId ?? '' },
    ...(IS_PREVIEW
      ? {
          jsonPath: ctx.jsonPath,
          reportFormulaEvaluation: ctx.reportFormulaEvaluation,
        }
      : {}),
    slotRepeatIndex,
    slotSuffix,
  })

  // Custom properties instance overrides are added after the child tree is rendered to ensure correct order
  if (node.customProperties) {
    bindCustomProperties(
      node.customProperties,
      () =>
        getNodeSelector(path, {
          componentName: ctx.component.name,
          nodeId,
        }),
      {
        dataSignal,
        formulaCtx,
        ctx,
        reportPrefix: IS_PREVIEW ? ['customProperties'] : undefined,
      },
    )
  }
  if (node.variants) {
    for (const variant of node.variants) {
      if (variant.customProperties) {
        bindCustomProperties(
          variant.customProperties,
          () =>
            getNodeSelector(path, {
              componentName: ctx.component.name,
              nodeId,
              variant,
            }),
          {
            variant,
            dataSignal,
            formulaCtx,
            ctx,
            reportPrefix: IS_PREVIEW ? ['customProperties'] : undefined,
          },
        )
      }
    }
  }

  return renderedComponent
}
