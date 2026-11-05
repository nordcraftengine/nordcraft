import { duplicateFormulaArgumentNameRule } from './duplicateFormulaArgumentNameRule'
import { invalidComponentFormulaReferenceRule } from './invalidComponentFormulaReferenceRule'
import { invalidPathRule } from './invalidPathRule'
import { invalidProjectFormulaReferenceRule } from './invalidProjectFormulaReferenceRule'
import { legacyFormulaRule } from './legacyFormulaRule'
import { namedComponentFormulaRule } from './namedComponentFormulaRule'
import { noReferenceComponentFormulaRule } from './noReferenceComponentFormulaRule'
import { noReferenceProjectFormulaRule } from './noReferenceProjectFormulaRule'
import { workflowParameterOutsideWorkflowRule } from './workflowParameterOutsideWorkflowRule'

export default [
  duplicateFormulaArgumentNameRule,
  invalidComponentFormulaReferenceRule,
  invalidPathRule,
  invalidProjectFormulaReferenceRule,
  legacyFormulaRule,
  namedComponentFormulaRule,
  noReferenceComponentFormulaRule,
  noReferenceProjectFormulaRule,
  workflowParameterOutsideWorkflowRule,
  // unknownComponentFormulaInputRule,
  // unknownProjectFormulaInputRule
]
