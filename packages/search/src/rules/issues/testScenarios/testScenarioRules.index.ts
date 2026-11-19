import { duplicateDefaultTestScenarioRule } from './duplicateDefaultTestScenarioRule'
import { unknownTestScenarioContextRule } from './unknownTestScenarioContextRule'
import { unknownTestScenarioDataRule } from './unknownTestScenarioDataRule'

export default [
  unknownTestScenarioDataRule,
  unknownTestScenarioContextRule,
  duplicateDefaultTestScenarioRule,
]
