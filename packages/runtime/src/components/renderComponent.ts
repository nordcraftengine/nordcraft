import '@nordcraft/core/dist/compileTime'
import type {
  Component,
  ComponentAttribute,
  ComponentData,
  SupportedNamespaces,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import type { FormulaEvaluationReporter } from '@nordcraft/core/dist/formula/formulaTypes'
import type { Nullable, Toddle } from '@nordcraft/core/dist/types'
import {
  isMeasureEnabled,
  measure,
  noopMeasure,
} from '@nordcraft/core/dist/utils/measure'
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

interface RenderComponentProps {
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
  jsonPath?: Array<string | number> | undefined
  reportFormulaEvaluation?: FormulaEvaluationReporter
  slotRepeatIndex?: number
  slotSuffix?: string
}

const BATCH_QUEUE = new BatchQueue()

export function renderComponent(
  props: RenderComponentProps,
): ReadonlyArray<Element | Text> {
  const {
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
    slotRepeatIndex,
    slotSuffix,
  } = props
  const stopMeasure = isMeasureEnabled()
    ? measure(
        `Render component: ${component.name}`,
        {
          component: component.name,
          path,
        },
        'component',
      )
    : noopMeasure
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
    ...(IS_PREVIEW
      ? {
          jsonPath: props.jsonPath,
          reportFormulaEvaluation: props.reportFormulaEvaluation,
        }
      : {}),
  }

  const rootElem = createNode({
    id: 'root',
    path,
    dataSignal,
    ctx:
      IS_PREVIEW && (ctx.reportFormulaEvaluation || ctx.jsonPath)
        ? { ...ctx, jsonPath: ['nodes', 'root'] }
        : ctx,
    parentElement,
    namespace,
    instance,
    slotRepeatIndex,
    slotSuffix,
  })
  const hasAttributeChangeActions =
    (component.onAttributeChange?.actions?.length ?? 0) > 0
  const hasOnLoadActions = (component.onLoad?.actions?.length ?? 0) > 0
  if (hasAttributeChangeActions || hasOnLoadActions) {
    BATCH_QUEUE.add(() => {
      let prev: Record<string, any> | undefined
      if (hasAttributeChangeActions) {
        dataSignal
          .map((data) => data.Attributes)
          .subscribe((props) => {
            const previous = prev
            prev = props // always update, regardless of early returns below

            if (!previous) return

            const actions = component.onAttributeChange?.actions
            if (!actions?.length) return

            const event = new CustomEvent('attribute-change', {
              detail: getAttributeChanges(
                component.attributes,
                previous,
                props,
              ),
            })
            const data = dataSignal.get()

            for (const action of actions) {
              void handleAction(action, data, ctx, event)
            }
          })
      }
      if (hasOnLoadActions) {
        component.onLoad?.actions?.forEach((action) => {
          void handleAction(action, dataSignal.get(), ctx)
        })
      }
    })
  }
  stopMeasure()
  return rootElem
}

type AttributeChanges = Record<string, { current: any; new: any }>

function getAttributeChanges(
  attributes: Nullable<Record<string, Nullable<ComponentAttribute>>>,
  previous: Record<string, unknown>,
  next: Record<string, unknown> | null | undefined,
): AttributeChanges {
  const changes: AttributeChanges = {}
  if (!attributes || !next) return changes

  for (const key of Object.keys(next)) {
    // Cheap lookup first, so we skip the deep-equal for unmapped attributes
    const name = attributes[key]?.name
    if (!name) continue

    const current = previous[key]
    const value = next[key]
    if (!fastDeepEqual(current, value)) {
      changes[name] = { current, new: value }
    }
  }

  return changes
}
