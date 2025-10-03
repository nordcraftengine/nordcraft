import { unknownContextProviderWorkflowRule } from '../workflows/unknownContextProviderWorkflowRule'
import { unknownContextWorkflowRule } from '../workflows/unknownContextWorkflowRule'
import { noContextConsumersRule } from './noContextConsumersRule'
import { unknownContextFormulaRule } from './unknownContextFormulaRule'
import { unknownContextProviderFormulaRule } from './unknownContextProviderFormulaRule'
import { unknownContextProviderRule } from './unknownContextProviderRule'

export default [
  noContextConsumersRule,
  unknownContextFormulaRule,
  unknownContextProviderFormulaRule,
  unknownContextProviderRule,
  unknownContextProviderWorkflowRule,
  unknownContextWorkflowRule,
]
