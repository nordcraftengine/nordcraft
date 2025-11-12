import { duplicateFormulaArgumentNameRule } from './duplicateFormulaArgumentNameRule'
import { legacyFormulaRule } from './legacyFormulaRule'
import { noReferenceComponentFormulaRule } from './noReferenceComponentFormulaRule'
import { noReferenceProjectFormulaRule } from './noReferenceProjectFormulaRule'

export default [
  legacyFormulaRule,
  duplicateFormulaArgumentNameRule,
  noReferenceComponentFormulaRule,
  noReferenceProjectFormulaRule,
  // unknownComponentFormulaInputRule,
  // unknownProjectFormulaInputRule
]
