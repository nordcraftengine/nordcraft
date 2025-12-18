import type {
  ApiRequest,
  ComponentAPI,
} from '@nordcraft/core/dist/api/apiTypes'
import type {
  ComponentEvent as _ComponentEvent,
  ActionModel,
  ActionModelActions,
  Component,
  ComponentNodeModel,
  CustomActionArgument,
  CustomActionModel,
  ElementNodeModel,
  NodeModel,
  StyleVariant,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { Formula } from '@nordcraft/core/dist/formula/formula'
import type { PluginFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import type { Theme } from '@nordcraft/core/dist/styling/theme'
import type { Nullable, PluginAction } from '@nordcraft/core/dist/types'
import type {
  ApiService,
  ProjectFiles,
  Route,
  ToddleProject,
} from '@nordcraft/ssr/dist/ssr.types'
import type { LegacyActionRuleFix } from './rules/issues/actions/legacyActionRule'
import type { NoReferenceProjectActionRuleFix } from './rules/issues/actions/noReferenceProjectActionRule'
import type { UnknownActionArgumentRuleFix } from './rules/issues/actions/unknownActionArgumentRule'
import type { UnknownActionEventRuleFix } from './rules/issues/actions/unknownActionEventRule'
import type { NoReferenceApiRuleFix } from './rules/issues/apis/noReferenceApiRule'
import type { NoReferenceApiServiceRuleFix } from './rules/issues/apis/noReferenceApiServiceRule'
import type { UnknownApiServiceRuleFix } from './rules/issues/apis/unknownApiServiceRule'
import type { NoReferenceAttributeRuleFix } from './rules/issues/attributes/noReferenceAttributeRule'
import type { UnknownComponentAttributeRuleFix } from './rules/issues/attributes/unknownComponentAttributeRule'
import type { NoReferenceComponentRuleFix } from './rules/issues/components/noReferenceComponentRule'
import type { NoReferenceEventRuleFix } from './rules/issues/events/noReferenceEventRule'
import type { LegacyFormulaRuleFix } from './rules/issues/formulas/legacyFormulaRule'
import type { NoReferenceComponentFormulaRuleFix } from './rules/issues/formulas/noReferenceComponentFormulaRule'
import type { NoReferenceProjectFormulaRuleFix } from './rules/issues/formulas/noReferenceProjectFormulaRule'
import type { NoStaticNodeConditionRuleFix } from './rules/issues/logic/noStaticNodeCondition'
import type { NoReferenceNodeRuleFix } from './rules/issues/miscellaneous/noReferenceNodeRule'
import type { InvalidStyleSyntaxRuleFix } from './rules/issues/style/invalidStyleSyntaxRule'
import type { NoReferenceVariableRuleFix } from './rules/issues/variables/noReferenceVariableRule'
import type { NoPostNavigateActionRuleFix } from './rules/issues/workflows/noPostNavigateAction'

type Code =
  | 'duplicate action argument name'
  | 'duplicate event trigger'
  | 'duplicate formula argument name'
  | 'duplicate url parameter'
  | 'duplicate workflow parameter'
  | 'duplicate route'
  | 'invalid api parser mode'
  | 'invalid api proxy body setting'
  | 'invalid api proxy cookie setting'
  | 'invalid element child'
  | 'invalid style syntax'
  | 'legacy action'
  | 'legacy api'
  | 'legacy formula'
  | 'no context consumers'
  | 'no post navigate action'
  | 'no-console'
  | 'no-reference api input'
  | 'no-reference api'
  | 'no-reference api service'
  | 'no-reference attribute'
  | 'no-reference component formula'
  | 'no-reference component workflow'
  | 'no-reference component'
  | 'no-reference event'
  | 'no-reference global css variable'
  | 'no-reference node'
  | 'no-reference project action'
  | 'no-reference project formula'
  | 'no-reference variable'
  | 'no-static-node-condition'
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
  | 'unknown action argument'
  | 'unknown action event'
  | 'unknown api input'
  | 'unknown api'
  | 'unknown api service'
  | 'unknown attribute'
  | 'unknown classname'
  | 'unknown component attribute'
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
    parameters?: Nullable<
      {
        name: string
        testValue: any
      }[]
    >
    callbacks?: Nullable<
      {
        name: string
        testValue: any
      }[]
    >
    actions: ActionModel[]
    exposeInContext?: Nullable<boolean>
  }
  component: ToddleComponent<Function>
} & Base

type ComponentFormulaNode = {
  nodeType: 'component-formula'
  value: {
    name: string
    arguments?: Nullable<
      {
        name: string
        testValue: any
      }[]
    >
    memoize?: Nullable<boolean>
    exposeInContext?: Nullable<boolean>
    formula: Formula
  }
  component: ToddleComponent<Function>
} & Base

type ComponentVariableNode = {
  nodeType: 'component-variable'
  value: Component['variables'][0]
  component: ToddleComponent<Function>
} & Base

type ComponentNodeAttributeNode = {
  nodeType: 'component-node-attribute'
  value: { key: string; value?: Formula }
  node: ComponentNodeModel | ElementNodeModel
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

type ActionModelNode<A = ActionModel> = {
  nodeType: 'action-model'
  value: A
  component: ToddleComponent<Function>
} & Base

type CustomActionModelArgumentNode = {
  nodeType: 'action-custom-model-argument'
  value: {
    action: CustomActionModel
    argument: CustomActionArgument
    argumentIndex: number
  }
  component: ToddleComponent<Function>
} & Base

type CustomActionModelEventNode = {
  nodeType: 'action-custom-model-event'
  value: {
    action: CustomActionModel
    event: ActionModelActions
    eventName: string
  }
  component: ToddleComponent<Function>
} & Base

type ComponentContext = {
  nodeType: 'component-context'
  value: {
    formulas: string[]
    workflows: string[]
    componentName?: Nullable<string>
    package?: Nullable<string>
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

type ProjectThemePropertyNode = {
  nodeType: 'project-theme-property'
  value: {
    key: CustomPropertyName
    value: CustomPropertyDefinition
  }
} & Base

type ProjectConfigNode = {
  nodeType: 'project-config'
  value: unknown
} & Base

type StyleVariantNode = {
  nodeType: 'style-variant'
  value: {
    variant: StyleVariant
    element: ElementNodeModel | ComponentNodeModel
  }
} & Base

type StyleNode = {
  nodeType: 'style-declaration'
  value: {
    styleProperty: string
    styleValue: string | number
    element: ElementNodeModel | ComponentNodeModel
  }
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
  | ComponentNodeAttributeNode
  | ComponentNodeNode
  | ComponentVariableNode
  | ComponentWorkflowNode
  | CustomActionModelArgumentNode
  | CustomActionModelEventNode
  | FormulaNode
  | ProjectActionNode
  | ProjectApiService
  | ProjectConfigNode
  | ProjectFormulaNode
  | ProjectRoute
  | ProjectThemeNode
  | ProjectThemePropertyNode
  | StyleNode
  | StyleVariantNode

type FixType =
  | InvalidStyleSyntaxRuleFix
  | LegacyActionRuleFix
  | LegacyFormulaRuleFix
  | NoPostNavigateActionRuleFix
  | NoReferenceApiRuleFix
  | NoReferenceApiServiceRuleFix
  | NoReferenceAttributeRuleFix
  | NoReferenceComponentFormulaRuleFix
  | NoReferenceComponentRuleFix
  | NoReferenceEventRuleFix
  | NoReferenceNodeRuleFix
  | NoReferenceProjectActionRuleFix
  | NoReferenceProjectFormulaRuleFix
  | NoReferenceVariableRuleFix
  | NoStaticNodeConditionRuleFix
  | UnknownActionArgumentRuleFix
  | UnknownActionEventRuleFix
  | UnknownApiServiceRuleFix
  | UnknownComponentAttributeRuleFix

export interface Rule<T = unknown, V = NodeType> {
  category: Category
  code: Code
  level: Level
  visit: (
    report: (path: (string | number)[], details?: T, fixes?: FixType[]) => void,
    data: V,
    state?: ApplicationState | undefined,
  ) => void
  fixes?: Partial<Record<FixType, FixFunction>>
}

export type FixFunction<T extends NodeType> = (
  data: T,
  state?: ApplicationState,
) => ProjectFiles | void
