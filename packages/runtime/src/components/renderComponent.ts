import type {
  Component,
  ComponentData,
  SupportedNamespaces,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import type { Toddle } from '@nordcraft/core/dist/types'
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
  package: string | undefined
  parentElement: Element | ShadowRoot
  instance: Record<string, string>
  toddle: Toddle<LocationSignal, PreviewShowSignal>
  namespace?: SupportedNamespaces
  env: ToddleEnv
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
  parentElement,
  instance,
  toddle,
  namespace,
  env,
}: RenderComponentProps): ReadonlyArray<Element | Text> {
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
    package: packageName,
    toddle,
    env,
  }

  const rootElem = createNode({
    id: 'root',
    path,
    dataSignal,
    ctx,
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
            component.onAttributeChange?.actions.forEach((action) => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              handleAction(
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
                        component.attributes[key]?.name
                      ) {
                        changes[component.attributes[key]?.name] = {
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
    component.onLoad?.actions.forEach((action) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      handleAction(action, dataSignal.get(), ctx)
    })
  })
  return rootElem
}
