import type { Component, ComponentData } from './component/component.types'
import type { Formula, ToddleEnv } from './formula/formula'
import type { PluginFormula } from './formula/formulaTypes'

export type FormulaHandlerV2<R = unknown> = (
  // For v2 of formulas
  args: Record<string, unknown>,
  ctx: {
    root: Document | ShadowRoot
    env: ToddleEnv
  },
) => R | null

export type ActionHandlerV2 = (
  // For v2 of actions
  args: Record<string, unknown>,
  ctx: {
    triggerActionEvent: (trigger: string, data: any, event?: Event) => void
    root: Document | ShadowRoot
  },
  event?: Event,
  // If the action returns a function, that function will be called
  // from our abort signal (for cleanup)
) => void | (() => void) | Promise<void> | Promise<() => void>

export type ActionHandler<Args = unknown[]> = (
  args: Args,
  ctx: {
    triggerActionEvent: (trigger: string, data: any, event?: Event) => void
    env: ToddleEnv
    abortSignal: AbortSignal
  },
  event?: Event,
) => void

export type FormulaHandler<T = void> = (
  args: unknown[],
  ctx: {
    component: Component
    data: ComponentData
    root: Document | ShadowRoot
    env: ToddleEnv
  },
) => T | null

interface PluginActionBase {
  name: string
  description?: string
  arguments: Array<{
    name: string
    formula: Formula
  }>
  variableArguments: boolean | null
}

export interface PluginActionV2 extends PluginActionBase {
  handler: ActionHandlerV2
  version: 2
}

export type ArgumentInputDataFunction = (
  items: unknown[],
  index: number,
  input: any,
) => ComponentData

export type CustomFormulaHandler = (
  name: string,
  packageName: string | undefined,
) => PluginFormula<FormulaHandlerV2> | undefined

export type FormulaLookup = (name: string) => FormulaHandler | undefined

export interface Toddle<LocationSignal, ShowSignal> {
  project: string
  branch: string
  commit: string
  errors: Error[]
  formulas: Record<string, Record<string, PluginFormula<FormulaHandlerV2>>>
  actions: Record<string, Record<string, PluginActionV2>>
  isEqual: (a: any, b: any) => boolean
  registerAction: (name: string, handler: ActionHandler) => void
  registerFormula: (
    name: string,
    handler: FormulaHandler,
    getArgumentInputData?: ArgumentInputDataFunction,
  ) => void
  wipeLegacyActions?: () => void
  wipeLegacyFormulas?: () => void
  getAction: (name: string) => ActionHandler | undefined
  getFormula: FormulaLookup
  getCustomFormula: CustomFormulaHandler
  getCustomAction: (
    name: string,
    packageName: string | undefined,
  ) => PluginActionV2 | undefined
  // eslint-disable-next-line max-params
  getArgumentInputData: (
    name: string,
    items: unknown[],
    index: number,
    input: any,
  ) => ComponentData
  data: Record<string, unknown>
  components: Component[]
  locationSignal: LocationSignal
  eventLog: Array<{
    component: string
    node: string
    nodeId: string
    event: string
    time: number
    data: any
  }>
  pageState: ComponentData
  _preview?: {
    showSignal: ShowSignal
  }
  // We temporarily expose the env here until we add a new version of
  // the APPLY_FORMULA function that can handle the env as an argument
  env: ToddleEnv
}

export interface ToddleInternals {
  project: string
  branch: string
  commit: string
  pageState: ComponentData
  component: Component
  components: Component[]
  // Flag that indicates if the page is done with the createRoot function.
  isPageLoaded: boolean
  cookies: string[]
}

export interface Comment {
  text: string
}

export interface NordcraftMetadata {
  '@nordcraft/metadata'?: {
    comments: Record<string, Comment & { index: number }> | null
  } | null
}

export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>
}

export type NestedOmit<
  Schema,
  Path extends string,
> = Path extends `${infer Head}.${infer Tail}`
  ? Head extends keyof Schema
    ? {
        [K in keyof Schema]: K extends Head
          ? NestedOmit<Schema[K], Tail>
          : Schema[K]
      }
    : Schema
  : Omit<Schema, Path>

export type Runtime = 'page' | 'custom-element' | 'preview'
