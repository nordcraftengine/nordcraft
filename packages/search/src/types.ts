import type {
  ApiRequest,
  ComponentAPI,
} from '@nordcraft/core/dist/api/apiTypes'
import type {
  ComponentEvent as _ComponentEvent,
  ActionModel,
  ActionModelActions,
  AnimationKeyframe,
  Component,
  ComponentAttribute,
  ComponentNodeModel,
  ComponentVariable,
  CustomActionArgument,
  CustomActionModel,
  CustomProperty,
  CustomPropertyName,
  ElementNodeModel,
  NodeModel,
  StyleVariable,
} from '@nordcraft/core/dist/component/component.types'
import type { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { Formula } from '@nordcraft/core/dist/formula/formula'
import type { PluginFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import type { Theme } from '@nordcraft/core/dist/styling/theme'
import type { CustomPropertyDefinition } from '@nordcraft/core/dist/styling/theme.ts'
import type { StyleVariant } from '@nordcraft/core/dist/styling/variantSelector'
import type { Nullable, PluginAction } from '@nordcraft/core/dist/types'
import type {
  ApiService,
  InstalledPackage,
  ProjectFiles,
  Route,
  ToddleProject,
} from '@nordcraft/ssr/dist/ssr.types'
import type { Delta } from 'jsondiffpatch'
import type { LegacyActionRuleFix } from './rules/issues/actions/legacyActionRule'
import type { NoReferenceProjectActionRuleFix } from './rules/issues/actions/noReferenceProjectActionRule'
import type { UnknownActionArgumentRuleFix } from './rules/issues/actions/unknownActionArgumentRule'
import type { UnknownActionEventRuleFix } from './rules/issues/actions/unknownActionEventRule'
import type { NoReferenceApiRuleFix } from './rules/issues/apis/noReferenceApiRule'
import type { NoReferenceApiServiceRuleFix } from './rules/issues/apis/noReferenceApiServiceRule'
import type { UnknownApiServiceRuleFix } from './rules/issues/apis/unknownApiServiceRule'
import type { DeleteFetchInputFix } from './rules/issues/apis/unknownFetchInputRule'
import type { NoReferenceAttributeRuleFix } from './rules/issues/attributes/noReferenceAttributeRule'
import type { UnknownComponentAttributeRuleFix } from './rules/issues/attributes/unknownComponentAttributeRule'
import type { ChangeDataTypeFix } from './rules/issues/components/invalidComponentStructureRule'
import type { NoReferenceComponentRuleFix } from './rules/issues/components/noReferenceComponentRule'
import type { NoReferenceEventRuleFix } from './rules/issues/events/noReferenceEventRule'
import type { LegacyFormulaRuleFix } from './rules/issues/formulas/legacyFormulaRule'
import type { NoReferenceComponentFormulaRuleFix } from './rules/issues/formulas/noReferenceComponentFormulaRule'
import type { NoReferenceProjectFormulaRuleFix } from './rules/issues/formulas/noReferenceProjectFormulaRule'
import type { NoStaticNodeConditionRuleFix } from './rules/issues/logic/noStaticNodeCondition'
import type { NoReferenceNodeRuleFix } from './rules/issues/miscellaneous/noReferenceNodeRule'
import type { NoReferenceProjectPackageRuleFix } from './rules/issues/miscellaneous/noReferencePackageRule'
import type { InvalidStyleSyntaxRuleFix } from './rules/issues/style/invalidStyleSyntaxRule'
import type { LegacyStyleVariableRuleFix } from './rules/issues/style/legacyStyleVariableRule'
import type { NoReferenceAnimationRuleFix } from './rules/issues/style/noReferenceAnimationRule'
import type { AddToThemeFix } from './rules/issues/style/unknownCSSVariable'
import type { NoReferenceVariableRuleFix } from './rules/issues/variables/noReferenceVariableRule'
import type { NoPostNavigateActionRuleFix } from './rules/issues/workflows/noPostNavigateAction'

export type Code =
  | 'duplicate action argument name'
  | 'duplicate event trigger'
  | 'duplicate formula argument name'
  | 'duplicate route'
  | 'duplicate url parameter'
  | 'duplicate workflow parameter'
  | 'image without dimension'
  | 'invalid api parser mode'
  | 'invalid api proxy body setting'
  | 'invalid api proxy cookie setting'
  | 'invalid component structure'
  | 'invalid element child'
  | 'invalid style syntax'
  | 'legacy action'
  | 'legacy api'
  | 'legacy formula'
  | 'legacy style variable'
  | 'legacy theme'
  | 'no context consumers'
  | 'no post navigate action'
  | 'no-console'
  | 'no-reference animation'
  | 'no-reference api input'
  | 'no-reference api service'
  | 'no-reference api'
  | 'no-reference attribute in instance'
  | 'no-reference attribute'
  | 'no-reference component formula'
  | 'no-reference component workflow'
  | 'no-reference component'
  | 'no-reference event'
  | 'no-reference global css variable'
  | 'no-reference node'
  | 'no-reference project action'
  | 'no-reference project formula'
  | 'no-reference project package'
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
  | 'size constraint'
  | 'unknown action argument'
  | 'unknown action event'
  | 'unknown api input'
  | 'unknown api service'
  | 'unknown api'
  | 'unknown attribute'
  | 'unknown classname'
  | 'unknown component attribute'
  | 'unknown component formula input'
  | 'unknown component slot'
  | 'unknown component'
  | 'unknown context formula'
  | 'unknown context provider formula'
  | 'unknown context provider workflow'
  | 'unknown context provider'
  | 'unknown context workflow'
  | 'unknown cookie'
  | 'unknown css variable'
  | 'unknown event'
  | 'unknown fetch input'
  | 'unknown formula'
  | 'unknown project action'
  | 'unknown project formula input'
  | 'unknown project formula'
  | 'unknown repeat index formula'
  | 'unknown repeat item formula'
  | 'unknown set url parameter'
  | 'unknown set url parameters'
  | 'unknown trigger event'
  | 'unknown trigger workflow parameter'
  | 'unknown trigger workflow'
  | 'unknown url parameter'
  | 'unknown variable setter'
  | 'unknown variable'
  | 'unknown workflow parameter'

export type Category =
  | 'Unknown Reference'
  | 'No References'
  | 'SEO'
  | 'Accessibility'
  | 'Deprecation'
  | 'Performance'
  | 'Security'
  | 'Quality'
  | 'Other'

export type Level = 'error' | 'warning' | 'info'

export type Result = {
  path: (string | number)[]
  code: Code
  category: Category
  level: Level
  details?: any
  fixes?: FixType[]
  info: ReportedIssueInfo
}

export interface ApplicationCookie {
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

export type HttpOnlyCookie = ApplicationCookie & {
  httpOnly: true
  value: never
}

export type NonHttpOnlyCookie = ApplicationCookie & {
  httpOnly: false
  value: string
}

export interface ApplicationState {
  cookiesAvailable?: Array<HttpOnlyCookie | NonHttpOnlyCookie>
  isBrowserExtensionAvailable?: boolean
  projectDetails?: ToddleProject
}

export type MemoFn = <T>(key: string, fn: () => T) => T

export type Base = {
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

export type ProjectFormulaNode = {
  nodeType: 'project-formula'
  value: PluginFormula<string>
} & Base

export type ProjectActionNode = {
  nodeType: 'project-action'
  value: PluginAction
} & Base

export type ProjectApiService = {
  nodeType: 'api-service'
  value: ApiService
} & Base

export type ProjectRoute = {
  nodeType: 'project-route'
  value: Route
  routeName: string
} & Base

export type ComponentNode = {
  nodeType: 'component'
  value: Component
} & Base

export type ComponentAPINode = {
  nodeType: 'component-api'
  value: ComponentAPI
  component: ToddleComponent<Function>
} & Base

export type ComponentAPIInputNode = {
  nodeType: 'component-api-input'
  value: ApiRequest['inputs'][0]
  api: ApiRequest
  component: ToddleComponent<Function>
} & Base

export type ComponentWorkflowNode = {
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

export type ComponentFormulaNode = {
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

export type ComponentVariableNode = {
  nodeType: 'component-variable'
  value: ComponentVariable
  component: ToddleComponent<Function>
} & Base

export type ComponentNodeAttributeNode = {
  nodeType: 'component-node-attribute'
  value: { key: string; value?: Formula }
  node: ComponentNodeModel | ElementNodeModel
} & Base

export type ComponentAttributeNode = {
  nodeType: 'component-attribute'
  value: ComponentAttribute
  component: ToddleComponent<Function>
} & Base

export type FormulaNode<F extends Formula = Formula> = {
  nodeType: 'formula'
  value: F
  component?: ToddleComponent<Function>
} & Base

export type ActionModelNode<A extends ActionModel = ActionModel> = {
  nodeType: 'action-model'
  value: A
  component: ToddleComponent<Function>
} & Base

export type CustomActionModelArgumentNode = {
  nodeType: 'action-custom-model-argument'
  value: {
    action: CustomActionModel
    argument: CustomActionArgument
    argumentIndex: number
  }
  component: ToddleComponent<Function>
} & Base

export type CustomActionModelEventNode = {
  nodeType: 'action-custom-model-event'
  value: {
    action: CustomActionModel
    event: ActionModelActions
    eventName: string
  }
  component: ToddleComponent<Function>
} & Base

export type ComponentContext = {
  nodeType: 'component-context'
  value: {
    formulas: string[]
    workflows: string[]
    componentName?: Nullable<string>
    package?: Nullable<string>
  }
} & Base

export type ComponentEvent = {
  nodeType: 'component-event'
  value: { component: ToddleComponent<Function>; event: _ComponentEvent }
} & Base

export type ComponentNodeNode = {
  nodeType: 'component-node'
  value: NodeModel
  component: ToddleComponent<Function>
} & Base

export type ProjectThemeNode = {
  nodeType: 'project-theme'
  value: Theme
} & Base

export type ProjectThemePropertyNode = {
  nodeType: 'project-theme-property'
  value: {
    key: CustomPropertyName
    value: CustomPropertyDefinition
  }
} & Base

export type ProjectConfigNode = {
  nodeType: 'project-config'
  value: unknown
} & Base

export type ProjectPackageNode = {
  nodeType: 'project-package'
  value: InstalledPackage
  packageName: string
} & Base

export type StyleVariantNode = {
  nodeType: 'style-variant'
  value: {
    variant: StyleVariant
    element: ElementNodeModel | ComponentNodeModel
  }
} & Base

export type StyleVariableNode = {
  nodeType: 'style-variable'
  value: {
    styleVariable: StyleVariable
    element: ElementNodeModel | ComponentNodeModel
  }
} & Base

export type CustomPropertyNode = {
  nodeType: 'custom-property'
  value: {
    key: CustomPropertyName
    value: CustomProperty
    element: ElementNodeModel | ComponentNodeModel
    variant?: StyleVariant
  }
} & Base

export type StyleNode = {
  nodeType: 'style-declaration'
  value: {
    styleProperty: string
    styleValue: string | number
    element: ElementNodeModel | ComponentNodeModel
  }
} & Base

export type AnimationNode = {
  nodeType: 'animation'
  value: {
    key: string
    value: Record<string, AnimationKeyframe>
  }
  node: ComponentNodeModel | ElementNodeModel
} & Base

export type NodeType =
  | ActionModelNode
  | AnimationNode
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
  | CustomPropertyNode
  | FormulaNode
  | ProjectActionNode
  | ProjectApiService
  | ProjectConfigNode
  | ProjectFormulaNode
  | ProjectRoute
  | ProjectThemeNode
  | ProjectThemePropertyNode
  | ProjectPackageNode
  | StyleNode
  | StyleVariableNode
  | StyleVariantNode

export type FixType =
  | AddToThemeFix
  | ChangeDataTypeFix
  | DeleteFetchInputFix
  | InvalidStyleSyntaxRuleFix
  | LegacyActionRuleFix
  | LegacyFormulaRuleFix
  | LegacyStyleVariableRuleFix
  | NoPostNavigateActionRuleFix
  | NoReferenceAnimationRuleFix
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
  | NoReferenceProjectPackageRuleFix

interface ReportedIssueInfo {
  title: string
  description: string
}

export interface Rule<
  T = unknown,
  V extends NodeType = NodeType,
  N extends NodeType = V,
> {
  category: Category
  code: Code
  level: Level
  visit: (
    report: (args: {
      path: (string | number)[]
      info: ReportedIssueInfo
      details?: T
      fixes?: FixType[]
    }) => void,
    data: V,
    state?: ApplicationState | undefined,
  ) => void
  fixes?: Partial<Record<FixType, FixFunction<N, T>>>
}

export interface FixFunctionArgs<Data extends NodeType, Details = unknown> {
  data: Data
  details?: Details
  state?: ApplicationState
}

export type FixFunction<Data extends NodeType, Details = unknown> = (
  args: FixFunctionArgs<Data, Details>,
) => ProjectFiles | void

export type Options = {
  /**
   * Useful for running search on a subset or a single file.
   */
  pathsToVisit?: string[][]
  /**
   * Whether to match the paths exactly (including length) or just the beginning.
   */
  useExactPaths?: boolean
  /**
   * Search only rules with these specific categories. If empty, all categories are shown.
   */
  categories?: Category[]
  /**
   * Search only rules with the specific levels. If empty, all levels are shown.
   */
  levels?: Level[]
  /**
   * The number of reports to send per message.
   * @default 1
   */
  batchSize?: number | 'all' | 'per-file'
  /**
   * Dynamic data that is used by some rules.
   */
  state?: ApplicationState
  /**
   * Do not run rules with these codes. Useful for feature flagged rules
   */
  rulesToExclude?: Code[]
}

export interface FindProblemsArgs {
  id: string
  files: ProjectFiles
  options?: Options
}

export interface FindProblemsResponse {
  id: string
  results: Result[]
}

export interface FixProblemsArgs {
  id: string
  files: ProjectFiles
  options?: Options
  fixRule: Code
  fixType: FixType
}

export interface FixProblemsResponse {
  id: string
  patch: Delta
  fixRule: Code
  fixType: FixType
}
