import { unknownFormulaRule } from '../formulas/unknownFormulaRule'
import { unknownProjectFormulaRule } from '../formulas/unknownProjectFormulaRule'
import { unknownRepeatIndexFormulaRule } from '../formulas/unknownRepeatIndexFormulaRule'
import { unknownRepeatItemFormulaRule } from '../formulas/unknownRepeatItemFormulaRule'
import { noStaticNodeCondition } from './noStaticNodeCondition'
import { noUnnecessaryConditionFalsy } from './noUnnecessaryConditionFalsy'
import { noUnnecessaryConditionTruthy } from './noUnnecessaryConditionTruthy'

export default [
  noStaticNodeCondition,
  noUnnecessaryConditionFalsy,
  noUnnecessaryConditionTruthy,
  unknownFormulaRule,
  unknownProjectFormulaRule,
  unknownRepeatIndexFormulaRule,
  unknownRepeatItemFormulaRule,
]
