import { createActionNameRule } from './createActionNameRule'
import { legacyActionRule } from './legacyActionRule'
import { noReferenceProjectActionRule } from './noReferenceProjectActionRule'
import { unknownProjectActionRule } from './unknownProjectActionRule'

export default [
  createActionNameRule({
    name: '@toddle/logToConsole',
    code: 'no-console',
  }),
  legacyActionRule,
  noReferenceProjectActionRule,
  unknownProjectActionRule,
]
