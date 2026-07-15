import { duplicateWorkflowParameterRule } from './duplicateWorkflowParameterRule'
import { namedComponentWorkflowRule } from './namedComponentWorkflowRule'
import { noPostNavigateAction } from './noPostNavigateAction'
import { noReferenceComponentWorkflowRule } from './noReferenceComponentWorkflowRule'
import { unknownTriggerWorkflowParameterRule } from './unknownTriggerWorkflowParameterRule'
import { unknownTriggerWorkflowRule } from './unknownTriggerWorkflowRule'
import { unknownWorkflowParameterRule } from './unknownWorkflowParameterRule'

export default [
  duplicateWorkflowParameterRule,
  noPostNavigateAction,
  noReferenceComponentWorkflowRule,
  namedComponentWorkflowRule,
  unknownTriggerWorkflowParameterRule,
  unknownTriggerWorkflowRule,
  unknownWorkflowParameterRule,
]
