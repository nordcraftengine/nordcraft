import { unknownFormulaRule } from '../formulas/unknownFormulaRule'
import { unknownProjectFormulaRule } from '../formulas/unknownProjectFormulaRule'
import { unknownRepeatIndexFormulaRule } from '../formulas/unknownRepeatIndexFormulaRule'
import { unknownRepeatItemFormulaRule } from '../formulas/unknownRepeatItemFormulaRule'
import { noStaticNodeCondition } from './noStaticNodeCondition'
import { noUnnecessaryConditionFalsy } from './noUnnecessaryConditionFalsy'
import { noUnnecessaryConditionTruthy } from './noUnnecessaryConditionTruthy'
import { noUnreachableActionSwitchCaseRule } from './noUnreachableActionSwitchCaseRule'
import { noUnreachableSwitchCaseRule } from './noUnreachableSwitchCaseRule'

export default [
  noStaticNodeCondition,
  noUnnecessaryConditionFalsy,
  noUnnecessaryConditionTruthy,
  noUnreachableSwitchCaseRule,
  noUnreachableActionSwitchCaseRule,
  unknownFormulaRule,
  unknownProjectFormulaRule,
  unknownRepeatIndexFormulaRule,
  unknownRepeatItemFormulaRule,
]
