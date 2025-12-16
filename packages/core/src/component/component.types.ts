import type { ApiStatus, ComponentAPI, LegacyApiStatus } from '../api/apiTypes'
import type { Formula } from '../formula/formula'
import type { StyleTokenCategory } from '../styling/theme'
import type { StyleVariant } from '../styling/variantSelector'
import type { NordcraftMetadata, RequireFields } from '../types'

interface ListItem {
  Item: unknown
  Index: number
  Parent?: ListItem
}

export interface ComponentData {
  Location?: {
    page?: string
    path: string
    // params is a combination of path and query parameters
    params: Record<string, string | null>
    query: Record<string, string | null>
    hash: string
  }
  Attributes: Record<string, unknown>
  Variables?: Record<string, unknown>
  Contexts?: Record<string, Record<string, unknown>>
  'URL parameters'?: Record<string, string | null>
  // { path: { docs: null }, query: { embed: everything } }
  'Route parameters'?: {
    path: Record<string, string | null>
    query: Record<string, string | null>
  }
  Apis?: Record<
    string,
    LegacyApiStatus | (ApiStatus & { inputs?: Record<string, unknown> })
  >
  Args?: unknown
  Parameters?: Record<string, unknown>
  Event?: unknown
  ListItem?: ListItem
}

export interface AnimationKeyframe {
  position: number
  key: string
  value: string
  easing?: never
}

export type NodeStyleModel = Record<string, string | number>

export interface TextNodeModel {
  id?: string | null
  type: 'text'
  condition?: Formula | null
  repeat?: Formula | null
  slot?: string | null
  repeatKey?: Formula | null
  value: Formula
  children?: undefined
}

export type CustomPropertyName = `--${string}`

export type CustomProperty = {
  formula: Formula
  unit?: string | null
}

/**
 * @deprecated - use CustomProperties instead
 */
export type StyleVariable = {
  category: StyleTokenCategory
  name: string
  formula: Formula
  unit?: string
}

export interface ElementNodeModel {
  id?: string
  type: 'element'
  slot?: string
  condition?: Formula | null
  repeat?: Formula | null
  repeatKey?: Formula | null
  tag: string
  attrs: Partial<Record<string, Formula>>
  style?: NodeStyleModel | null
  variants?: StyleVariant[] | null
  animations?: Record<string, Record<string, AnimationKeyframe>>
  children: string[]
  events: Partial<Record<string, EventModel | null>>
  classes?: Record<string, { formula?: Formula }> | null
  'style-variables'?: Array<StyleVariable>
  customProperties?: Record<CustomPropertyName, CustomProperty>
}

export interface ComponentNodeModel {
  id?: string
  type: 'component'
  slot?: string
  path?: string
  name: string
  package?: string
  condition?: Formula | null
  repeat?: Formula | null
  repeatKey?: Formula | null
  style?: NodeStyleModel | null
  variants?: StyleVariant[] | null
  animations?: Record<string, Record<string, AnimationKeyframe>>
  attrs: Record<string, Formula>
  children: string[]
  events: Record<string, EventModel>
  customProperties?: Record<CustomPropertyName, CustomProperty>
}

export interface SlotNodeModel {
  type: 'slot'
  slot?: string
  name?: string
  condition?: Formula | null
  repeat?: undefined | null
  repeatKey?: undefined | null
  children: string[]
}
export type NodeModel =
  | TextNodeModel
  | SlotNodeModel
  | ComponentNodeModel
  | ElementNodeModel

export interface MetaEntry {
  tag: HeadTagTypes
  attrs: Record<string, Formula>
  content?: Formula | null
  index?: number | null
}

export interface StaticPathSegment {
  type: 'static'
  optional?: boolean
  testValue?: undefined
  name: string
}

export interface DynamicPathSegment {
  type: 'param'
  testValue: string
  optional?: boolean
  name: string
}

export type MediaQuery = {
  'min-width'?: string
  'max-width'?: string
  'min-height'?: string
  'max-height'?: string
}

export interface Component {
  name: string // component name
  /**
   * version 2 indicates that the component's name is no longer prefixed, but will be automatically prefixed by the project name
   *
   * @default undefined (version 1)
   * @deprecated - we are no longer using version 2 components, but we are keeping this field for backwards compatibility
   */
  version?: 2 | null
  // @deprecated - use route->path instead
  page?: string | null // page url /projects/:id - only for pages
  route?: PageRoute | null
  attributes?: Record<string, ComponentAttribute> | null
  variables?: Record<string, ComponentVariable> | null
  formulas?: Record<string, ComponentFormula> | null
  contexts?: Record<
    // `componentName` or `packageName/componentName` if the context comes from a different package than the component itself
    string,
    ComponentContext
  > | null
  workflows?: Record<string, ComponentWorkflow> | null
  apis?: Record<string, ComponentAPI> | null
  nodes?: Record<string, NodeModel> | null
  events?: ComponentEvent[] | null
  onLoad?: EventModel | null
  onAttributeChange?: EventModel | null
  // exported indicates that a component is exported in a package
  exported?: boolean | null
  customElement?: {
    // Later, we will add information about allowed origins here
    enabled?: Formula
  }
}

export interface ComponentFormula extends NordcraftMetadata {
  name: string
  arguments?: Array<{ name: string; testValue: any }> | null
  memoize?: boolean
  exposeInContext?: boolean
  formula: Formula
}

export interface ComponentWorkflow extends NordcraftMetadata {
  name: string
  parameters: Array<{ name: string; testValue: any }>
  callbacks?: Array<{ name: string; testValue: any }>
  actions: ActionModel[]
  exposeInContext?: boolean
  testValue?: unknown
}

export interface ComponentContext {
  formulas: string[]
  workflows: string[]
  componentName?: string
  package?: string
}

export type PageComponent = RequireFields<Component, 'route'>

export interface RouteDeclaration {
  path: Array<StaticPathSegment | DynamicPathSegment>
  query: Record<string, { name: string; testValue: any }>
}

export interface PageRoute extends RouteDeclaration {
  // Information for the <head> element
  // only relevant for pages - not for regular
  // components
  info?: {
    // value for <html lang= > - defaults to 'en'
    language?: { formula: Formula }
    // title (for <title>) - defaults to page name
    title?: { formula: Formula }
    description?: { formula: Formula }
    // links - only icon (+icon:16 and icon:32) for now:
    // - manifest
    // - mask-icon
    // - apple-touch-icon
    // - icon
    // - icon (32)
    // - icon (16)
    // cSpell:ignore Vhmkm
    icon?: { formula: Formula } // /cdn-cgi/imagedelivery/ZIty0Vhmkm0nD-fBKJrTZQ/my-icon
    charset?: { formula: Formula } // defaults to utf-8

    // meta:
    // - viewport <meta name="viewport" content="width=device-width, initial-scale=1">
    // - description <meta name="description" content="My Page description">
    // - apple-mobile-web-app-title
    // - application-name <meta name="application-name" content="My App">
    // - msapplication-TileColor
    // - theme-color
    // - og:title - defaults to page name <meta property="og:title" content="My Page">
    // - og:type - defaults to "website" - see https://stackoverflow.com/a/54741252 for more types e.g. "product"
    // - og:description - defaults to page description <meta property="og:description" content="My Page description">
    // - og:image <meta property="og:image" content="https://example.com/image.jpg">
    // - og:url - defaults to page url (with no query params etc.)
    // - og:locale
    // - twitter:card
    // - twitter:site
    // - twitter:creator
    meta?: Record<string, MetaEntry>
  }
}

export enum HeadTagTypes {
  Meta = 'meta',
  Link = 'link',
  Script = 'script',
  NoScript = 'noscript',
  Style = 'style',
}

export interface EventModel {
  trigger: string
  actions?: ActionModel[] | null
}

export interface CustomActionArgument {
  name: string
  formula?: Formula
  type?: any
  description?: string
}

export interface ActionModelActions {
  actions: ActionModel[]
}

export interface CustomActionModel {
  // Some legacy custom actions use an undefined type
  type?: 'Custom'
  package?: string
  name: string
  description?: string
  group?: string
  data?: string | number | boolean | Formula
  arguments?: Partial<CustomActionArgument[]>
  events?: Record<string, ActionModelActions>
  version?: 2 | never
  label?: string
}

export interface SwitchActionModel {
  type: 'Switch'
  data?: string | number | boolean | Formula
  cases: Array<{
    condition: Formula | null
    actions: ActionModel[]
  }>
  default: ActionModelActions
}

export interface VariableActionModel {
  type: 'SetVariable'
  variable: string
  data: Formula | null
}
export interface FetchActionModel {
  type: 'Fetch'
  api: string
  inputs?: Record<string, { formula: Formula | null }>
  onSuccess: ActionModelActions
  onError: ActionModelActions
  onMessage?: ActionModelActions
}

export interface SetURLParameterAction {
  type: 'SetURLParameter'
  parameter: string
  data: Formula | null
  historyMode?: 'replace' | 'push' | null
}

export interface SetMultiUrlParameterAction {
  type: 'SetURLParameters'
  parameters: Record<string, Formula>
  historyMode?: 'replace' | 'push' | null
}

export interface EventActionModel {
  type: 'TriggerEvent'
  event: string
  data: Formula | null
}

export interface WorkflowActionModel {
  type: 'TriggerWorkflow'
  workflow: string
  parameters: Record<string, { formula?: Formula }> | null
  callbacks?: Record<string, { actions?: ActionModel[] | null }>
  contextProvider?: string
}

export interface WorkflowCallbackActionModel {
  type: 'TriggerWorkflowCallback'
  event: string
  data: Formula | null
}

export type ActionModel =
  | VariableActionModel
  | EventActionModel
  | SwitchActionModel
  | FetchActionModel
  | CustomActionModel
  | SetURLParameterAction
  | SetMultiUrlParameterAction
  | WorkflowActionModel
  | WorkflowCallbackActionModel

export interface ComponentEvent extends NordcraftMetadata {
  name: string
  // eslint-disable-next-line inclusive-language/use-inclusive-words
  dummyEvent: any
}

export interface ComponentVariable extends NordcraftMetadata {
  initialValue: Formula
}

export interface ComponentAttribute extends NordcraftMetadata {
  name: string
  testValue: unknown
}

/**
 * We must specify the namespace for some nodes when created programmatically that are not in the default namespace.
 * We infer the namespace based on the tag name, but it would be interesting to also allow the user to specify it explicitly with the `xmlns` attribute.
 */
export type SupportedNamespaces =
  | 'http://www.w3.org/1999/xhtml'
  | 'http://www.w3.org/2000/svg'
  | 'http://www.w3.org/1998/Math/MathML'
