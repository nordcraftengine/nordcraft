import { createActionNameRule } from './createActionNameRule'
import { duplicateActionArgumentNameRule } from './duplicateActionArgumentNameRule'
import { legacyActionRule } from './legacyActionRule'
import { noReferenceProjectActionRule } from './noReferenceProjectActionRule'
import { unknownActionArgumentRule } from './unknownActionArgumentRule'
import { unknownProjectActionRule } from './unknownProjectActionRule'

export default [
  createActionNameRule({
    name: '@toddle/logToConsole',
    code: 'no-console',
  }),
  duplicateActionArgumentNameRule,
  legacyActionRule,
  noReferenceProjectActionRule,
  unknownProjectActionRule,
  unknownActionArgumentRule,
]
