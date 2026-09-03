import type { SearchRule } from '../../types'
import * as componentRefSearchRule from './componentRefSearchRule'
import * as componentSearchRule from './componentSearchRule'
import * as elementSearchRule from './elementSearchRule'
import * as formulaRefSearchRule from './formulaRefSearchRule'
import * as formulaSearchRule from './formulaSearchRule'
import * as workflowRefSearchRule from './workflowRefSearchRule'
import * as workflowSearchRule from './workflowSearchRule'

export interface QuerySearchRule {
  shouldRun: (query: string) => boolean
  create: (query: string) => SearchRule
}

export const querySearchRules: QuerySearchRule[] = [
  {
    shouldRun: componentSearchRule.shouldRun,
    create: (query) => componentSearchRule.createComponentSearchRule({ query }),
  },
  {
    shouldRun: componentRefSearchRule.shouldRun,
    create: (query) =>
      componentRefSearchRule.createComponentRefSearchRule({ query }),
  },
  {
    shouldRun: workflowSearchRule.shouldRun,
    create: (query) => workflowSearchRule.createWorkflowSearchRule({ query }),
  },
  {
    shouldRun: workflowRefSearchRule.shouldRun,
    create: (query) =>
      workflowRefSearchRule.createWorkflowRefSearchRule({ query }),
  },
  {
    shouldRun: formulaSearchRule.shouldRun,
    create: (query) => formulaSearchRule.createFormulaSearchRule({ query }),
  },
  {
    shouldRun: formulaRefSearchRule.shouldRun,
    create: (query) =>
      formulaRefSearchRule.createFormulaRefSearchRule({ query }),
  },
  {
    shouldRun: elementSearchRule.shouldRun,
    create: (query) => elementSearchRule.createElementSearchRule({ query }),
  },
]
