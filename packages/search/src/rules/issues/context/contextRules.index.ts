import { unknownContextProviderWorkflowRule } from '../workflows/unknownContextProviderWorkflowRule'
import { unknownContextWorkflowRule } from '../workflows/unknownContextWorkflowRule'
import { noContextConsumersRule } from './noContextConsumersRule'
import { noReferenceContextFormulaRule } from './noReferenceContextFormulaRule'
import { noReferenceContextWorkflowRule } from './noReferenceContextWorkflowRule'
import { unknownContextFormulaRule } from './unknownContextFormulaRule'
import { unknownContextProviderFormulaRule } from './unknownContextProviderFormulaRule'
import { unknownContextProviderRule } from './unknownContextProviderRule'

export default [
  noContextConsumersRule,
  noReferenceContextFormulaRule,
  noReferenceContextWorkflowRule,
  unknownContextFormulaRule,
  unknownContextProviderFormulaRule,
  unknownContextProviderRule,
  unknownContextProviderWorkflowRule,
  unknownContextWorkflowRule,
]
