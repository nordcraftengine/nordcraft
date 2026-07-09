import type {
  Component,
  ComponentData,
  SupportedNamespaces,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import type { FormulaEvaluationReporter } from '@nordcraft/core/dist/formula/formulaTypes'
import type { Toddle } from '@nordcraft/core/dist/types'
import { measure } from '@nordcraft/core/dist/utils/measure'
import fastDeepEqual from 'fast-deep-equal'
import { handleAction } from '../events/handleAction'
import type { Signal } from '../signal/signal'
import type {
  ComponentChild,
  ComponentContext,
  ContextApi,
  FormulaCache,
  LocationSignal,
  PreviewShowSignal,
} from '../types'
import { BatchQueue } from '../utils/BatchQueue'
import { createNode } from './createNode'

export interface RenderComponentProps {
  component: Component
  components: Component[]
  dataSignal: Signal<ComponentData>
  apis: Record<string, ContextApi>
  abortSignal: AbortSignal
  onEvent: (event: string, data: unknown) => void
  isRootComponent: boolean
  formulaCache: FormulaCache
  path: string
  children: Record<string, Array<ComponentChild>>
  root: Document | ShadowRoot
  providers: Record<
    string,
    {
      component: Component
      formulaDataSignals: Record<string, Signal<ComponentData>>
      ctx: ComponentContext
    }
  >
  stores: {
    theme: Signal<string | null>
  }
  package: string | undefined
  parentElement: Element | ShadowRoot
  instance: Record<string, string>
  toddle: Toddle<LocationSignal, PreviewShowSignal>
  namespace?: SupportedNamespaces
  env: ToddleEnv
  jsonPath: Array<string | number> | undefined
  reportFormulaEvaluation?: FormulaEvaluationReporter
  hydrate?: { isHydrating: boolean }
}

const BATCH_QUEUE = new BatchQueue()

export function renderComponent({
  component,
  dataSignal,
  onEvent,
  isRootComponent,
  path,
  children,
  formulaCache,
  components,
  apis,
  abortSignal,
  root,
  providers,
  package: packageName,
  stores,
  parentElement,
  instance,
  toddle,
  namespace,
  env,
  jsonPath,
  reportFormulaEvaluation,
  hydrate,
}: RenderComponentProps): ReadonlyArray<Element | Text> {
  const stopMeasure = measure(
    `Render component: ${component.name}`,
    {
      component: component.name,
      path,
    },
    'component',
  )
  const ctx: ComponentContext = {
    triggerEvent: onEvent,
    component,
    components,
    dataSignal,
    isRootComponent,
    apis,
    formulaCache,
    children,
    abortSignal,
    root,
    providers,
    stores,
    package: packageName,
    toddle,
    env,
    jsonPath,
    reportFormulaEvaluation,
    hydrate,
  }

  const rootElem = createNode({
    id: 'root',
    path,
    dataSignal,
    ctx: { ...ctx, jsonPath: ['nodes', 'root'] },
    parentElement,
    namespace,
    instance,
  })
  BATCH_QUEUE.add(() => {
    let prev: Record<string, any> | undefined
    if (
      component.onAttributeChange?.actions &&
      component.onAttributeChange.actions.length > 0
    ) {
      dataSignal
        .map((data) => data.Attributes)
        .subscribe((props) => {
          if (prev) {
            component.onAttributeChange?.actions?.forEach((action) => {
              void handleAction(
                action,
                dataSignal.get(),
                ctx,
                new CustomEvent('attribute-change', {
                  detail: Object.entries(props).reduce(
                    (
                      changes: Record<string, { current: any; new: any }>,
                      [key, value],
                    ) => {
                      if (
                        fastDeepEqual(value, prev![key]) === false &&
                        component.attributes?.[key]?.name
                      ) {
                        changes[component.attributes?.[key]?.name] = {
                          current: prev![key],
                          new: value,
                        }
                      }
                      return changes
                    },
                    {},
                  ),
                }),
              )
            })
          }
          prev = props
        })
    }
    component.onLoad?.actions?.forEach((action) => {
      void handleAction(action, dataSignal.get(), ctx)
    })
  })
  stopMeasure()
  return rootElem
}

/* eslint-disable no-console */
export function hydrateComponent(props: RenderComponentProps) {
  const hydrate = { isHydrating: true }
  console.time(`Hydrate component: ${props.component.name}`)
  renderComponent({
    ...props,
    hydrate,
  })
  console.timeEnd(`Hydrate component: ${props.component.name}`)
  hydrate.isHydrating = false

  const misses = Array.from(document.querySelectorAll('[data-hk]'))
  // Misses are not necessarily a problem, as we have a few cases where things may be different:
  // - Use of formula `is Server` for conditional rendering
  // - API data that only loads on client that is cached or very fast, so have loaded before hydration
  if (misses.length > 0) {
    console.warn(
      `Hydration misses for component: ${props.component.name}`,
      misses,
    )
    misses.forEach((miss) => {
      miss.remove()
    })
  }
}
