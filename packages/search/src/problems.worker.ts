import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { Delta } from 'jsondiffpatch'
import { create } from 'jsondiffpatch'
import { fixProject } from './fixProject'
import { createActionNameRule } from './rules/actions/createActionNameRule'
import { legacyActionRule } from './rules/actions/legacyActionRule'
import { noReferenceProjectActionRule } from './rules/actions/noReferenceProjectActionRule'
import { unknownProjectActionRule } from './rules/actions/unknownProjectActionRule'
import { legacyApiRule } from './rules/apis/legacyApiRule'
import { noReferenceApiRule } from './rules/apis/noReferenceApiRule'
import { unknownApiInputRule } from './rules/apis/unknownApiInputRule'
import { unknownApiRule } from './rules/apis/unknownApiRule'
import { noReferenceAttributeRule } from './rules/attributes/noReferenceAttributeRule'
import { unknownAttributeRule } from './rules/attributes/unknownAttributeRule'
import { noReferenceComponentRule } from './rules/components/noReferenceComponentRule'
import { unknownComponentRule } from './rules/components/unknownComponentRule'
import { noContextConsumersRule } from './rules/context/noContextConsumersRule'
import { unknownContextFormulaRule } from './rules/context/unknownContextFormulaRule'
import { unknownContextProviderFormulaRule } from './rules/context/unknownContextProviderFormulaRule'
import { unknownContextProviderRule } from './rules/context/unknownContextProviderRule'
import { createRequiredDirectChildRule } from './rules/dom/createRequiredDirectChildRule'
import { createRequiredDirectParentRule } from './rules/dom/createRequiredDirectParentRule'
import { createRequiredElementAttributeRule } from './rules/dom/createRequiredElementAttributeRule'
import { createRequiredMetaTagRule } from './rules/dom/createRequiredMetaTagRule'
import { elementWithoutInteractiveContentRule } from './rules/dom/elementWithoutInteractiveContentRule'
import { imageWithoutDimensionRule } from './rules/dom/imageWithoutDimensionRule'
import { nonEmptyVoidElementRule } from './rules/dom/nonEmptyVoidElementRule'
import { duplicateRouteRule } from './rules/duplicateRouteRule'
import { duplicateEventTriggerRule } from './rules/events/duplicateEventTriggerRule'
import { noReferenceEventRule } from './rules/events/noReferenceEventRule'
import { unknownEventRule } from './rules/events/unknownEventRule'
import { unknownTriggerEventRule } from './rules/events/unknownTriggerEventRule'
import { legacyFormulaRule } from './rules/formulas/legacyFormulaRule'
import { noReferenceComponentFormulaRule } from './rules/formulas/noReferenceComponentFormulaRule'
import { noReferenceProjectFormulaRule } from './rules/formulas/noReferenceProjectFormulaRule'
import { unknownFormulaRule } from './rules/formulas/unknownFormulaRule'
import { unknownProjectFormulaRule } from './rules/formulas/unknownProjectFormulaRule'
import { unknownRepeatIndexFormulaRule } from './rules/formulas/unknownRepeatIndexFormulaRule'
import { unknownRepeatItemFormulaRule } from './rules/formulas/unknownRepeatItemFormulaRule'
import { noUnnecessaryConditionFalsy } from './rules/logic/noUnnecessaryConditionFalsy'
import { noUnnecessaryConditionTruthy } from './rules/logic/noUnnecessaryConditionTruthy'
import { noReferenceNodeRule } from './rules/noReferenceNodeRule'
import { requireExtensionRule } from './rules/requireExtensionRule'
import { unknownClassnameRule } from './rules/slots/unknownClassnameRule'
import { unknownComponentSlotRule } from './rules/slots/unknownComponentSlotRule'
import { ambiguousStyleVariableSyntaxRule } from './rules/style-variables/ambiguousStyleVariableSyntaxRule'
import { unknownCookieRule } from './rules/unknownCookieRule'
import { duplicateUrlParameterRule } from './rules/urlParameters/duplicateUrlParameterRule'
import { unknownSetUrlParameterRule } from './rules/urlParameters/unknownSetUrlParameterRule'
import { unknownUrlParameterRule } from './rules/urlParameters/unknownUrlParameterRule'
import { noReferenceVariableRule } from './rules/variables/noReferenceVariableRule'
import { unknownVariableRule } from './rules/variables/unknownVariableRule'
import { unknownVariableSetterRule } from './rules/variables/unknownVariableSetterRule'
import { duplicateWorkflowParameterRule } from './rules/workflows/duplicateWorkflowParameterRule'
import { noPostNavigateAction } from './rules/workflows/noPostNavigateAction'
import { noReferenceComponentWorkflowRule } from './rules/workflows/noReferenceComponentWorkflowRule'
import { unknownContextProviderWorkflowRule } from './rules/workflows/unknownContextProviderWorkflowRule'
import { unknownContextWorkflowRule } from './rules/workflows/unknownContextWorkflowRule'
import { unknownTriggerWorkflowParameterRule } from './rules/workflows/unknownTriggerWorkflowParameterRule'
import { unknownTriggerWorkflowRule } from './rules/workflows/unknownTriggerWorkflowRule'
import { unknownWorkflowParameterRule } from './rules/workflows/unknownWorkflowParameterRule'
import { searchProject } from './searchProject'
import type {
  ApplicationState,
  Category,
  Code,
  FixType,
  Level,
  Result,
} from './types'

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

const RULES = [
  createActionNameRule({ name: '@toddle/logToConsole', code: 'no-console' }),
  createRequiredElementAttributeRule({ tag: 'a', attribute: 'href' }),
  createRequiredElementAttributeRule({
    tag: 'img',
    attribute: 'alt',
    allowEmptyString: true,
  }),
  createRequiredElementAttributeRule({ tag: 'img', attribute: 'src' }),
  createRequiredMetaTagRule('description'),
  createRequiredMetaTagRule('title'),
  createRequiredDirectChildRule(['ul', 'ol'], ['li', 'script', 'template']),
  createRequiredDirectParentRule(['ul', 'ol'], ['li']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#technical_summary
  createRequiredDirectChildRule(
    ['table'],
    ['caption', 'colgroup', 'tbody', 'thead', 'tfoot', 'tr'],
  ),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody#technical_summary
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead#technical_summary
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot#technical_summary
  createRequiredDirectParentRule(['table'], ['tbody', 'thead', 'tfoot']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr#technical_summary
  createRequiredDirectChildRule(['tr'], ['th', 'td', 'script', 'template']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#technical_summary
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#technical_summary
  createRequiredDirectParentRule(['tr'], ['th', 'td']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#technical_summary
  createRequiredDirectChildRule(['select'], ['option', 'optgroup', 'hr']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup#technical_summary
  createRequiredDirectChildRule(['optgroup'], ['option']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend#technical_summary
  createRequiredDirectParentRule(['fieldset'], ['legend']),
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl#technical_summary
  createRequiredDirectChildRule(
    ['dl'],
    ['dd', 'dt', 'div', 'script', 'template'],
  ),
  duplicateEventTriggerRule,
  duplicateRouteRule,
  duplicateUrlParameterRule,
  duplicateWorkflowParameterRule,
  elementWithoutInteractiveContentRule,
  imageWithoutDimensionRule,
  legacyActionRule,
  legacyApiRule,
  legacyFormulaRule,
  noContextConsumersRule,
  nonEmptyVoidElementRule,
  noPostNavigateAction,
  noReferenceApiRule,
  noReferenceAttributeRule,
  noReferenceComponentFormulaRule,
  noReferenceComponentRule,
  noReferenceComponentWorkflowRule,
  noReferenceEventRule,
  noReferenceNodeRule,
  noReferenceProjectActionRule,
  noReferenceProjectFormulaRule,
  noReferenceVariableRule,
  noUnnecessaryConditionFalsy,
  noUnnecessaryConditionTruthy,
  requireExtensionRule,
  unknownApiRule,
  unknownApiInputRule,
  unknownAttributeRule,
  unknownClassnameRule,
  // unknownComponentFormulaInputRule,
  unknownComponentRule,
  unknownComponentSlotRule,
  unknownContextFormulaRule,
  unknownContextProviderFormulaRule,
  unknownContextProviderRule,
  unknownContextProviderWorkflowRule,
  unknownContextWorkflowRule,
  unknownCookieRule,
  unknownEventRule,
  unknownFormulaRule,
  unknownProjectActionRule,
  // unknownProjectFormulaInputRule,
  unknownProjectFormulaRule,
  unknownRepeatIndexFormulaRule,
  unknownRepeatItemFormulaRule,
  unknownSetUrlParameterRule,
  unknownTriggerEventRule,
  unknownTriggerWorkflowParameterRule,
  unknownTriggerWorkflowRule,
  unknownUrlParameterRule,
  unknownVariableRule,
  unknownVariableSetterRule,
  unknownWorkflowParameterRule,
  ambiguousStyleVariableSyntaxRule,
]

interface FindProblemsArgs {
  files: ProjectFiles
  options?: Options
}

interface FixProblemsArgs {
  files: ProjectFiles
  options?: Options
  fixRule: Code
  fixType: FixType
  id: string
}

type Message = FindProblemsArgs | FixProblemsArgs

type FindProblemsResponse = Result[]

interface FixProblemsResponse {
  id: string
  patch: Delta
  fixRule: Code
  fixType: FixType
}

type Response = FindProblemsResponse | FixProblemsResponse

const respond = (data: Response) => postMessage(data)

const findProblems = (data: FindProblemsArgs) => {
  const { files, options = {} } = data
  const rules = RULES.filter(
    (rule) =>
      (!options.categories || options.categories.includes(rule.category)) &&
      (!options.levels || options.levels.includes(rule.level)) &&
      !options.rulesToExclude?.includes(rule.code),
  )

  let batch: Result[] = []
  let fileType: string | number | undefined
  let fileName: string | number | undefined
  for (const problem of searchProject({
    files,
    rules,
    pathsToVisit: options.pathsToVisit,
    useExactPaths: options.useExactPaths,
    state: options.state,
  })) {
    switch (options.batchSize) {
      case 'all': {
        batch.push(problem)
        break
      }
      case 'per-file': {
        if (fileType !== problem.path[0] || fileName !== problem.path[1]) {
          if (batch.length > 0) {
            respond(batch)
          }
          batch = []
          fileType = problem.path[0]
          fileName = problem.path[1]
        }

        batch.push(problem)
        break
      }

      default: {
        batch.push(problem)
        if (batch.length >= (options.batchSize ?? 1)) {
          respond(batch)
          batch = []
        }
        break
      }
    }
  }

  // Send the remaining results
  respond(batch)
}

const fixProblems = (data: FixProblemsArgs) => {
  const { files, options = {}, fixRule } = data
  const rule = RULES.find((r) => r.code === fixRule)
  if (!rule) {
    throw new Error(`Unknown fix rule: ${data.fixRule}`)
  }

  const updatedFiles = fixProject({
    files,
    rule,
    fixType: data.fixType,
    pathsToVisit: options.pathsToVisit,
    useExactPaths: options.useExactPaths,
    state: options.state,
  })
  // Calculate diff
  const jsonDiffPatch = create({ omitRemovedValues: true })
  const diff = jsonDiffPatch.diff(files, updatedFiles)
  // Send diff + metadata to main thread
  respond({
    id: data.id,
    patch: diff,
    fixRule: data.fixRule,
    fixType: data.fixType,
  })
}

/**
 * This function is a web worker that checks for problems in the files.
 */
onmessage = (event: MessageEvent<Message>) => {
  if ('fixRule' in event.data) {
    fixProblems(event.data)
  } else {
    findProblems(event.data)
  }
}
