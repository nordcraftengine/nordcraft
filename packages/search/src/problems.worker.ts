import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
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
import { createLimitElementInstancesRule } from './rules/dom/createLimitElementInstancesRule'
import { createRequiredDirectChildRule } from './rules/dom/createRequiredDirectChildRule'
import { createRequiredDirectParentRule } from './rules/dom/createRequiredDirectParentRule'
import { createRequiredElementAttributeRule } from './rules/dom/createRequiredElementAttributeRule'
import { createRequiredMetaTagRule } from './rules/dom/createRequiredMetaTagRule'
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
import { requireExtensionRule } from './rules/requireExtensionRule'
import { unknownClassnameRule } from './rules/slots/unknownClassnameRule'
import { unknownComponentSlotRule } from './rules/slots/unknownComponentSlotRule'
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
import type { ApplicationState, Category, Code, Level, Result } from './types'

export type Options = {
  /**
   * Useful for running search on a subset or a single file.
   */
  pathsToVisit?: string[][]
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

  rulesToExclude?: Code[]
}

const RULES = [
  createActionNameRule({ name: '@toddle/logToConsole', code: 'no-console' }),
  // Pages should only have one h1
  createLimitElementInstancesRule('h1', 1),
  // Pages should only have one main element
  createLimitElementInstancesRule('main', 1),
  createRequiredElementAttributeRule('a', 'href'),
  createRequiredElementAttributeRule('img', 'alt'),
  createRequiredElementAttributeRule('img', 'src'),
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
]

/**
 * This function is a web worker that checks for problems in the files.
 */
onmessage = (
  event: MessageEvent<{ files: ProjectFiles; options?: Options }>,
) => {
  const { files, options = {} } = event.data
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
            postMessage(batch)
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
          postMessage(batch)
          batch = []
        }
        break
      }
    }
  }

  // Send the remaining results
  postMessage(batch)
}
