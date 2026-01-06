import type { ApiStatus, ComponentAPI, LegacyApiStatus } from '../api/apiTypes'
import type { Formula } from '../formula/formula'
import type { StyleTokenCategory } from '../styling/theme'
import type { StyleVariant } from '../styling/variantSelector'
import type { NordcraftMetadata, Nullable, RequireFields } from '../types'

interface ListItem {
  Item: unknown
  Index: number
  Parent?: Nullable<ListItem>
}

export interface ComponentData {
  Location?: Nullable<{
    page?: Nullable<string>
    path: string
    // params is a combination of path and query parameters
    params: Record<string, Nullable<string>>
    query: Record<string, Nullable<string>>
    hash: string
  }>
  Attributes: Record<string, unknown>
  Variables?: Nullable<Record<string, unknown>>
  Contexts?: Nullable<Record<string, Record<string, unknown>>>
  'URL parameters'?: Nullable<Record<string, Nullable<string>>>
  // { path: { docs: null }, query: { embed: everything } }
  'Route parameters'?: Nullable<{
    path: Record<string, Nullable<string>>
    query: Record<string, Nullable<string>>
  }>
  Apis?: Nullable<
    Record<
      string,
      | LegacyApiStatus
      | (ApiStatus & { inputs?: Nullable<Record<string, unknown>> })
    >
  >
  Args?: Nullable<unknown>
  Parameters?: Nullable<Record<string, unknown>>
  Event?: Nullable<unknown>
  ListItem?: Nullable<ListItem>
  Page?: Nullable<{
    Theme: string | null
  }>
}

export interface AnimationKeyframe {
  position: number
  key: string
  value: string
  easing?: Nullable<never>
}

export type NodeStyleModel = Record<string, string | number>

export interface TextNodeModel {
  id?: Nullable<string>
  type: 'text'
  condition?: Nullable<Formula>
  repeat?: Nullable<Formula>
  slot?: Nullable<string>
  repeatKey?: Nullable<Formula>
  value: Formula
  children?: Nullable<never>
}

export type CustomPropertyName = `--${string}`

export type CustomProperty = {
  formula: Formula
  unit?: Nullable<string>
}

/**
 * @deprecated - use CustomProperties instead
 */
export type StyleVariable = {
  category: StyleTokenCategory
  name: string
  formula: Formula
  unit?: Nullable<string>
}

export interface ElementNodeModel {
  id?: Nullable<string>
  type: 'element'
  slot?: Nullable<string>
  condition?: Nullable<Formula>
  repeat?: Nullable<Formula>
  repeatKey?: Nullable<Formula>
  tag: string
  attrs: Partial<Record<string, Formula>>
  style?: Nullable<NodeStyleModel>
  variants?: Nullable<StyleVariant[]>
  animations?: Nullable<Record<string, Record<string, AnimationKeyframe>>>
  children: string[]
  events: Partial<Record<string, Nullable<EventModel>>>
  classes?: Nullable<Record<string, { formula?: Nullable<Formula> }>>
  'style-variables'?: Nullable<Array<StyleVariable>>
  customProperties?: Nullable<Record<CustomPropertyName, CustomProperty>>
}

export interface ComponentNodeModel {
  id?: Nullable<string>
  type: 'component'
  slot?: Nullable<string>
  path?: Nullable<string>
  name: string
  package?: Nullable<string>
  condition?: Nullable<Formula>
  repeat?: Nullable<Formula>
  repeatKey?: Nullable<Formula>
  style?: Nullable<NodeStyleModel>
  variants?: Nullable<StyleVariant[]>
  animations?: Nullable<Record<string, Record<string, AnimationKeyframe>>>
  attrs: Record<string, Formula>
  children: string[]
  events: Record<string, EventModel>
  customProperties?: Nullable<Record<CustomPropertyName, CustomProperty>>
}

export interface SlotNodeModel {
  type: 'slot'
  slot?: Nullable<string>
  name?: Nullable<string>
  condition?: Nullable<Formula>
  repeat?: Nullable<never>
  repeatKey?: Nullable<never>
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
  content?: Nullable<Formula>
  index?: Nullable<number>
}

export interface StaticPathSegment {
  type: 'static'
  optional?: Nullable<boolean>
  testValue?: Nullable<never>
  name: string
}

export interface DynamicPathSegment {
  type: 'param'
  testValue: string
  optional?: Nullable<boolean>
  name: string
}

export type MediaQuery = {
  'min-width'?: Nullable<string>
  'max-width'?: Nullable<string>
  'min-height'?: Nullable<string>
  'max-height'?: Nullable<string>
  'prefers-reduced-motion'?: Nullable<'reduce' | 'no-preference'>
}

export interface Component {
  name: string // component name
  /**
   * version 2 indicates that the component's name is no longer prefixed, but will be automatically prefixed by the project name
   *
   * @default undefined (version 1)
   * @deprecated - we are no longer using version 2 components, but we are keeping this field for backwards compatibility
   */
  version?: Nullable<2>
  // @deprecated - use route->path instead
  page?: Nullable<string> // page url /projects/:id - only for pages
  route?: Nullable<PageRoute>
  attributes?: Nullable<Record<string, ComponentAttribute>>
  variables?: Nullable<Record<string, ComponentVariable>>
  formulas?: Nullable<Record<string, ComponentFormula>>
  contexts?: Nullable<
    Record<
      // `componentName` or `packageName/componentName` if the context comes from a different package than the component itself
      string,
      ComponentContext
    >
  >
  workflows?: Nullable<Record<string, ComponentWorkflow>>
  apis?: Nullable<Record<string, ComponentAPI>>
  nodes?: Nullable<Record<string, NodeModel>>
  events?: Nullable<ComponentEvent[]>
  onLoad?: Nullable<EventModel>
  onAttributeChange?: Nullable<EventModel>
  // exported indicates that a component is exported in a package
  exported?: Nullable<boolean>
  customElement?: Nullable<{
    // Later, we will add information about allowed origins here
    enabled?: Nullable<Formula>
  }>
}

export interface ComponentFormula extends NordcraftMetadata {
  name: string
  arguments?: Nullable<Array<{ name: string; testValue: any }>>
  memoize?: Nullable<boolean>
  exposeInContext?: Nullable<boolean>
  formula: Formula
}

export interface ComponentWorkflow extends NordcraftMetadata {
  name: string
  parameters: Array<{ name: string; testValue: any }>
  callbacks?: Nullable<Array<{ name: string; testValue: any }>>
  actions: ActionModel[]
  exposeInContext?: Nullable<boolean>
  testValue?: Nullable<unknown>
}

export interface ComponentContext {
  formulas: string[]
  workflows: string[]
  componentName?: Nullable<string>
  package?: Nullable<string>
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
  info?: Nullable<{
    // value for <html lang= > - defaults to 'en'
    language?: Nullable<{ formula: Formula }>

    // theme for <html data-nc-theme= > - defaults to read from cookie
    theme?: Nullable<{ formula: Formula }>

    // title (for <title>) - defaults to page name
    title?: Nullable<{ formula: Formula }>
    description?: Nullable<{ formula: Formula }>
    // links - only icon (+icon:16 and icon:32) for now:
    // - manifest
    // - mask-icon
    // - apple-touch-icon
    // - icon
    // - icon (32)
    // - icon (16)
    // cSpell:ignore Vhmkm
    icon?: Nullable<{ formula: Formula }> // /cdn-cgi/imagedelivery/ZIty0Vhmkm0nD-fBKJrTZQ/my-icon
    charset?: Nullable<{ formula: Formula }> // defaults to utf-8

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
    meta?: Nullable<Record<string, MetaEntry>>
  }>
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
  actions?: Nullable<ActionModel[]>
}

export interface CustomActionArgument {
  name: string
  formula?: Nullable<Formula>
  type?: Nullable<any>
  description?: Nullable<string>
}

export interface ActionModelActions {
  actions: ActionModel[]
}

export interface CustomActionModel {
  // Some legacy custom actions use an undefined type
  type?: Nullable<'Custom'>
  package?: Nullable<string>
  name: string
  description?: Nullable<string>
  group?: Nullable<string>
  data?: Nullable<string | number | boolean | Formula>
  arguments?: Nullable<Partial<CustomActionArgument[]>>
  events?: Nullable<Record<string, ActionModelActions>>
  version?: Nullable<2 | never>
  label?: Nullable<string>
}

export interface SwitchActionModel {
  type: 'Switch'
  data?: Nullable<string | number | boolean | Formula>
  cases: Array<{
    condition: Nullable<Formula>
    actions: ActionModel[]
  }>
  default: ActionModelActions
}

export interface VariableActionModel {
  type: 'SetVariable'
  variable: string
  data: Nullable<Formula>
}
export interface FetchActionModel {
  type: 'Fetch'
  api: string
  inputs?: Nullable<Record<string, { formula?: Nullable<Formula> }>>
  onSuccess: ActionModelActions
  onError: ActionModelActions
  onMessage?: Nullable<ActionModelActions>
}

export interface SetURLParameterAction {
  type: 'SetURLParameter'
  parameter: string
  data?: Nullable<Formula>
  historyMode?: Nullable<'replace' | 'push'>
}

export interface SetMultiUrlParameterAction {
  type: 'SetURLParameters'
  parameters: Record<string, Formula>
  historyMode?: Nullable<'replace' | 'push'>
}

export interface EventActionModel {
  type: 'TriggerEvent'
  event: string
  data?: Nullable<Formula>
}

export interface WorkflowActionModel {
  type: 'TriggerWorkflow'
  workflow: string
  parameters: Record<string, { formula?: Nullable<Formula> }>
  callbacks?: Nullable<Record<string, { actions?: Nullable<ActionModel[]> }>>
  contextProvider?: Nullable<string>
}

export interface WorkflowCallbackActionModel {
  type: 'TriggerWorkflowCallback'
  event: string
  data?: Nullable<Formula>
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
