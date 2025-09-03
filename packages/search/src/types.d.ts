import type {
  ApiRequest,
  ComponentAPI,
} from '@nordcraft/core/dist/api/apiTypes'
import type {
  ComponentEvent as _ComponentEvent,
  ActionModel,
  Component,
  ElementNodeModel,
  NodeModel,
  StyleVariant,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { Formula } from '@nordcraft/core/dist/formula/formula'
import type { PluginFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import type { Theme } from '@nordcraft/core/dist/styling/theme'
import type {
  ApiService,
  PluginAction,
  ProjectFiles,
  Route,
  ToddleProject,
} from '@nordcraft/ssr/dist/ssr.types'
import type { LegacyActionRuleFix } from './rules/actions/legacyActionRule'
import type { NoReferenceProjectActionRuleFix } from './rules/actions/noReferenceProjectActionRule'
import type { NoReferenceComponentRuleFix } from './rules/components/noReferenceComponentRule'
import type { LegacyFormulaRuleFix } from './rules/formulas/legacyFormulaRule'
import type { NoReferenceProjectFormulaRuleFix } from './rules/formulas/noReferenceProjectFormulaRule'

type Code =
  | 'ambiguous style variable syntax'
  | 'duplicate event trigger'
  | 'duplicate url parameter'
  | 'duplicate workflow parameter'
  | 'duplicate route'
  | 'invalid api parser mode'
  | 'invalid api proxy body setting'
  | 'invalid element child'
  | 'legacy action'
  | 'legacy api'
  | 'legacy formula'
  | 'no context consumers'
  | 'no post navigate action'
  | 'no-console'
  | 'no-reference api input'
  | 'no-reference api'
  | 'no-reference attribute'
  | 'no-reference component formula'
  | 'no-reference component workflow'
  | 'no-reference component'
  | 'no-reference event'
  | 'no-reference project action'
  | 'no-reference project formula'
  | 'no-reference variable'
  | 'no-unnecessary-condition-falsy'
  | 'no-unnecessary-condition-truthy'
  | 'non-empty void element'
  | 'required api autofetch'
  | 'required direct child'
  | 'required direct parent'
  | 'required element attribute'
  | 'required extension'
  | 'required meta tag'
  | 'image without dimension'
  | 'unknown api input'
  | 'unknown api'
  | 'unknown attribute'
  | 'unknown classname'
  | 'unknown component formula input'
  | 'unknown component slot'
  | 'unknown context formula'
  | 'unknown context provider formula'
  | 'unknown context provider workflow'
  | 'unknown context provider'
  | 'unknown context workflow'
  | 'unknown cookie'
  | 'unknown component'
  | 'unknown event'
  | 'unknown formula'
  | 'unknown project action'
  | 'unknown project formula input'
  | 'unknown project formula'
  | 'unknown repeat index formula'
  | 'unknown repeat item formula'
  | 'unknown set url parameter'
  | 'unknown set url parameters'
  | 'unknown trigger event'
  | 'unknown trigger workflow'
  | 'unknown url parameter'
  | 'unknown variable setter'
  | 'unknown variable'
  | 'unknown trigger workflow parameter'
  | 'unknown workflow parameter'

type Category =
  | 'Unknown Reference'
  | 'No References'
  | 'SEO'
  | 'Accessibility'
  | 'Deprecation'
  | 'Performance'
  | 'Security'
  | 'Quality'
  | 'Other'

type Level = 'error' | 'warning' | 'info'

export type Result = {
  path: (string | number)[]
  code: Code
  category: Category
  level: Level
  details?: any
  fixes?: FixType[]
}

interface ApplicationCookie {
  url: string
  name: string
  domain: string
  hostOnly: boolean
  path: string
  secure: boolean
  sameSite: 'no_restriction' | 'lax' | 'strict'
  session: boolean
  expirationDate?: number
}

type HttpOnlyCookie = ApplicationCookie & {
  httpOnly: true
  value: never
}

type NonHttpOnlyCookie = ApplicationCookie & {
  httpOnly: false
  value: string
}

export interface ApplicationState {
  cookiesAvailable?: Array<HttpOnlyCookie | NonHttpOnlyCookie>
  isBrowserExtensionAvailable?: boolean
  projectDetails?: ToddleProject
}

type MemoFn = <T>(key: string, fn: () => T) => T

type Base = {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  /**
   * The JSON-path
   */
  path: (string | number)[]
  /**
   * Memoization function used to cache the result of an expensive function.
   *
   * Useful for constructing a lookup table for a given key to avoid looking up the same value multiple times. Great for reducing the time complexity of a function from O(n^2) to O(n).
   * @param key A lookup key to store the result of the function. The cache is cleared after each run, but different rules may share the same cache. Example: `['variableInComponent', component.name]`
   * @param fn A function that returns the value to be memoized. This function is only called if the value is not already in the cache already.
   * @returns The value of the memoized function.
   */
  memo: MemoFn
}

type ProjectFormulaNode = {
  nodeType: 'project-formula'
  value: PluginFormula<string>
} & Base

type ProjectActionNode = {
  nodeType: 'project-action'
  value: PluginAction
} & Base

type ProjectApiService = {
  nodeType: 'api-service'
  value: ApiService
} & Base

type ProjectRoute = {
  nodeType: 'project-route'
  value: Route
  routeName: string
} & Base

type ComponentNode = {
  nodeType: 'component'
  value: Component
} & Base

type ComponentAPINode = {
  nodeType: 'component-api'
  value: ComponentAPI
  component: ToddleComponent<Function>
} & Base

type ComponentAPIInputNode = {
  nodeType: 'component-api-input'
  value: ApiRequest['inputs'][0]
  api: ApiRequest
  component: ToddleComponent<Function>
} & Base

type ComponentWorkflowNode = {
  nodeType: 'component-workflow'
  value: {
    name: string
    parameters?:
      | {
          name: string
          testValue: any
        }[]
      | null
    actions: ActionModel[]
    exposeInContext?: boolean | undefined
  }
  component: ToddleComponent<Function>
} & Base

type ComponentFormulaNode = {
  nodeType: 'component-formula'
  value: {
    name: string
    arguments?:
      | {
          name: string
          testValue: any
        }[]
      | null
    memoize?: boolean | undefined
    exposeInContext?: boolean | undefined
    formula: Formula
  }
  component: ToddleComponent<Function>
} & Base

type ComponentVariableNode = {
  nodeType: 'component-variable'
  value: Component['variables'][0]
  component: ToddleComponent<Function>
} & Base

type ComponentAttributeNode = {
  nodeType: 'component-attribute'
  value: Component['attributes'][0]
  component: ToddleComponent<Function>
} & Base

type FormulaNode<F = Formula> = {
  nodeType: 'formula'
  value: F
  component?: ToddleComponent<Function>
} & Base

type ActionModelNode = {
  nodeType: 'action-model'
  value: ActionModel
  component: ToddleComponent<Function>
} & Base

type ComponentContext = {
  nodeType: 'component-context'
  value: {
    formulas: string[]
    workflows: string[]
    componentName?: string
    package?: string
  }
} & Base

type ComponentEvent = {
  nodeType: 'component-event'
  value: { component: ToddleComponent<Function>; event: _ComponentEvent }
} & Base

type ComponentNodeNode = {
  nodeType: 'component-node'
  value: NodeModel
  component: ToddleComponent<Function>
} & Base

type ProjectThemeNode = {
  nodeType: 'project-theme'
  value: Theme
} & Base

type ProjectConfigNode = {
  nodeType: 'project-config'
  value: unknown
} & Base

type StyleVariantNode = {
  nodeType: 'style-variant'
  value: { variant: StyleVariant; element: ElementNodeModel }
} & Base

export type NodeType =
  | ActionModelNode
  | ComponentAPIInputNode
  | ComponentAPINode
  | ComponentAttributeNode
  | ComponentContext
  | ComponentEvent
  | ComponentFormulaNode
  | ComponentNode
  | ComponentNodeNode
  | ComponentVariableNode
  | ComponentWorkflowNode
  | FormulaNode
  | ProjectActionNode
  | ProjectApiService
  | ProjectConfigNode
  | ProjectFormulaNode
  | ProjectThemeNode
  | ProjectRoute
  | StyleVariantNode

type FixType =
  | LegacyFormulaRuleFix
  | LegacyActionRuleFix
  | NoReferenceComponentRuleFix
  | NoReferenceProjectFormulaRuleFix
  | NoReferenceProjectActionRuleFix

export interface Rule<T = unknown, V = NodeType> {
  category: Category
  code: Code
  level: Level
  visit: (
    report: (path: (string | number)[], details?: T, fixes?: FixType[]) => void,
    data: V,
    state?: ApplicationState | undefined,
  ) => void
  fixes?: Partial<
    Record<
      FixType,
      (data: V, state?: ApplicationState | undefined) => ProjectFiles | void
    >
  >
}
