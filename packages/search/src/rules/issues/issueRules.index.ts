import actionRules from './actions/actionRules.index'
import apiRules from './apis/apiRules.index'
import attributeRules from './attributes/attributeRules.index'
import componentRules from './components/componentRules.index'
import contextRules from './context/contextRules.index'
import domRules from './dom/domRules.index'
import duplicateRules from './duplicate/duplicateRules.index'
import eventRules from './events/eventRules.index'
import formulaRules from './formulas/formulaRules.index'
import logicRules from './logic/logicRules.index'
import miscRules from './miscellaneous/miscRules.index'
import repeatRules from './repeat/repeatRules.index'
import routingRules from './routing/routingRules.index'
import slotRules from './slots/slotRules.index'
import styleRules from './style/styleRules.index'
import variableRules from './variables/variableRules.index'
import workflowRules from './workflows/workflowRules.index'

export type AllRuleTypes =
  | (typeof actionRules)[number]
  | (typeof apiRules)[number]
  | (typeof attributeRules)[number]
  | (typeof componentRules)[number]
  | (typeof contextRules)[number]
  | (typeof domRules)[number]
  | (typeof duplicateRules)[number]
  | (typeof eventRules)[number]
  | (typeof formulaRules)[number]
  | (typeof logicRules)[number]
  | (typeof miscRules)[number]
  | (typeof repeatRules)[number]
  | (typeof routingRules)[number]
  | (typeof slotRules)[number]
  | (typeof styleRules)[number]
  | (typeof variableRules)[number]
  | (typeof workflowRules)[number]

export const ISSUE_RULES: AllRuleTypes[] = [
  ...actionRules,
  ...apiRules,
  ...attributeRules,
  ...componentRules,
  ...contextRules,
  ...domRules,
  ...duplicateRules,
  ...eventRules,
  ...formulaRules,
  ...logicRules,
  ...miscRules,
  ...repeatRules,
  ...routingRules,
  ...slotRules,
  ...styleRules,
  ...variableRules,
  ...workflowRules,
]
