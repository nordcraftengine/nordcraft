import type { Rule } from '../../types'
import actionRules from './actions/actionRules.index'
import apiRules from './apis/apiRules.index'
import attributeRules from './attributes/attributeRules.index'
import componentRules from './components/componentRules.index'
import contextRules from './context/contextRules.index'
import domRules from './dom/domRules.index'
import eventRules from './events/eventRules.index'
import formulaRules from './formulas/formulaRules.index'
import logicRules from './logic/logicRules.index'
import miscRules from './miscellaneous/miscRules.index'
import routingRules from './routing/routingRules.index'
import slotRules from './slots/slotRules.index'
import styleRules from './style/styleRules.index'
import variableRules from './variables/variableRules.index'
import workflowRules from './workflows/workflowRules.index'

export const ISSUE_RULES: Rule<any, any>[] = [
  ...actionRules,
  ...apiRules,
  ...attributeRules,
  ...componentRules,
  ...contextRules,
  ...domRules,
  ...eventRules,
  ...formulaRules,
  ...logicRules,
  ...miscRules,
  ...routingRules,
  ...slotRules,
  ...styleRules,
  ...variableRules,
  ...workflowRules,
]
