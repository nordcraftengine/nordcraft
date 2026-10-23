import { createActionNameRule } from './createActionNameRule'
import { duplicateActionArgumentNameRule } from './duplicateActionArgumentNameRule'
import { legacyActionRule } from './legacyActionRule'
import { legacyCustomActionRule } from './legacyCustomActionRule'
import { noReferenceProjectActionRule } from './noReferenceProjectActionRule'
import { unknownActionArgumentRule } from './unknownActionArgumentRule'
import { unknownActionEventRule } from './unknownActionEventRule'
import { unknownProjectActionRule } from './unknownProjectActionRule'

export default [
  createActionNameRule({
    name: '@toddle/logToConsole',
    code: 'no-console',
    info: {
      title: 'Debug action',
      description:
        '**Log to console** is designed as debug action. It is suggested to remove it before merging to a main branch.',
    },
  }),
  duplicateActionArgumentNameRule,
  legacyActionRule,
  legacyCustomActionRule,
  noReferenceProjectActionRule,
  unknownActionArgumentRule,
  unknownActionEventRule,
  unknownProjectActionRule,
]
