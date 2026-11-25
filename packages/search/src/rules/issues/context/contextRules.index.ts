import { unknownContextProviderWorkflowRule } from '../workflows/unknownContextProviderWorkflowRule'
import { unknownContextWorkflowRule } from '../workflows/unknownContextWorkflowRule'
import { invalidContextFormulaReferenceRule } from './invalidContextFormulaReferenceRule'
import { noContextConsumersRule } from './noContextConsumersRule'
import { noContextFormulaArgumentsRule } from './noContextFormulaArgumentsRule'
import { noReferenceContextFormulaRule } from './noReferenceContextFormulaRule'
import { noReferenceContextWorkflowRule } from './noReferenceContextWorkflowRule'
import { unknownContextFormulaRule } from './unknownContextFormulaRule'
import { unknownContextProviderFormulaRule } from './unknownContextProviderFormulaRule'
import { unknownContextProviderRule } from './unknownContextProviderRule'

export default [
  invalidContextFormulaReferenceRule,
  noContextConsumersRule,
  noContextFormulaArgumentsRule,
  noReferenceContextFormulaRule,
  noReferenceContextWorkflowRule,
  unknownContextFormulaRule,
  unknownContextProviderFormulaRule,
  unknownContextProviderRule,
  unknownContextProviderWorkflowRule,
  unknownContextWorkflowRule,
]
