import { createActionNameRule } from './createActionNameRule'
import { duplicateActionArgumentNameRule } from './duplicateActionArgumentNameRule'
import { legacyActionRule } from './legacyActionRule'
import { noReferenceProjectActionRule } from './noReferenceProjectActionRule'
import { unknownActionArgumentRule } from './unknownActionArgumentRule'
import { unknownActionEventRule } from './unknownActionEventRule'
import { unknownProjectActionRule } from './unknownProjectActionRule'

export default [
  createActionNameRule({
    name: '@toddle/logToConsole',
    code: 'no-console',
  }),
  duplicateActionArgumentNameRule,
  legacyActionRule,
  noReferenceProjectActionRule,
  unknownActionArgumentRule,
  unknownActionEventRule,
  unknownProjectActionRule,
]
