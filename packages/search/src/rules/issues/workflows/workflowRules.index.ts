import { duplicateWorkflowParameterRule } from './duplicateWorkflowParameterRule'
import { noPostNavigateAction } from './noPostNavigateAction'
import { noReferenceComponentWorkflowRule } from './noReferenceComponentWorkflowRule'
import { unknownTriggerWorkflowParameterRule } from './unknownTriggerWorkflowParameterRule'
import { unknownTriggerWorkflowRule } from './unknownTriggerWorkflowRule'
import { unknownWorkflowParameterRule } from './unknownWorkflowParameterRule'

export default [
  duplicateWorkflowParameterRule,
  noPostNavigateAction,
  noReferenceComponentWorkflowRule,
  unknownTriggerWorkflowParameterRule,
  unknownTriggerWorkflowRule,
  unknownWorkflowParameterRule,
]
