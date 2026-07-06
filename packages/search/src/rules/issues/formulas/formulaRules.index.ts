import { duplicateFormulaArgumentNameRule } from './duplicateFormulaArgumentNameRule'
import { invalidPathRule } from './invalidPathRule'
import { legacyFormulaRule } from './legacyFormulaRule'
import { noReferenceComponentFormulaRule } from './noReferenceComponentFormulaRule'
import { noReferenceProjectFormulaRule } from './noReferenceProjectFormulaRule'
import { workflowParameterOutsideWorkflowRule } from './workflowParameterOutsideWorkflowRule'

export default [
  duplicateFormulaArgumentNameRule,
  invalidPathRule,
  legacyFormulaRule,
  noReferenceComponentFormulaRule,
  noReferenceProjectFormulaRule,
  workflowParameterOutsideWorkflowRule,
  // unknownComponentFormulaInputRule,
  // unknownProjectFormulaInputRule
]
