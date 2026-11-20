import { duplicateWorkflowParameterRule } from './duplicateWorkflowParameterRule'
import { legacyWorkflowActionsRule } from './legacyWorkflowActionsRule'
import { namedComponentWorkflowRule } from './namedComponentWorkflowRule'
import { noPostNavigateAction } from './noPostNavigateAction'
import { noReferenceComponentWorkflowRule } from './noReferenceComponentWorkflowRule'
import { unknownTriggerWorkflowParameterRule } from './unknownTriggerWorkflowParameterRule'
import { unknownTriggerWorkflowRule } from './unknownTriggerWorkflowRule'
import { unknownWorkflowParameterRule } from './unknownWorkflowParameterRule'

export default [
  duplicateWorkflowParameterRule,
  legacyWorkflowActionsRule,
  noPostNavigateAction,
  noReferenceComponentWorkflowRule,
  namedComponentWorkflowRule,
  unknownTriggerWorkflowParameterRule,
  unknownTriggerWorkflowRule,
  unknownWorkflowParameterRule,
]
