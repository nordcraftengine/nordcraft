import { duplicateFormulaArgumentNameRule } from './duplicateFormulaArgumentNameRule'
import { invalidPathRule } from './invalidPathRule'
import { legacyFormulaRule } from './legacyFormulaRule'
import { namedComponentFormulaRule } from './namedComponentFormulaRule'
import { noReferenceComponentFormulaRule } from './noReferenceComponentFormulaRule'
import { noReferenceProjectFormulaRule } from './noReferenceProjectFormulaRule'
import { workflowParameterOutsideWorkflowRule } from './workflowParameterOutsideWorkflowRule'

export default [
  duplicateFormulaArgumentNameRule,
  invalidPathRule,
  legacyFormulaRule,
  namedComponentFormulaRule,
  noReferenceComponentFormulaRule,
  noReferenceProjectFormulaRule,
  workflowParameterOutsideWorkflowRule,
  // unknownComponentFormulaInputRule,
  // unknownProjectFormulaInputRule
]
