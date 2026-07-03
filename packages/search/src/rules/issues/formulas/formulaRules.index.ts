import { duplicateFormulaArgumentNameRule } from './duplicateFormulaArgumentNameRule'
import { invalidPathRule } from './invalidPathRule'
import { legacyFormulaRule } from './legacyFormulaRule'
import { noReferenceComponentFormulaRule } from './noReferenceComponentFormulaRule'
import { noReferenceProjectFormulaRule } from './noReferenceProjectFormulaRule'

export default [
  duplicateFormulaArgumentNameRule,
  invalidPathRule,
  legacyFormulaRule,
  noReferenceComponentFormulaRule,
  noReferenceProjectFormulaRule,
  // unknownComponentFormulaInputRule,
  // unknownProjectFormulaInputRule
]
