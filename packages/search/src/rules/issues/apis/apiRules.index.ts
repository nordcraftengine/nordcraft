import { invalidApiParserModeRule } from './invalidApiParserModeRule'
import { invalidApiProxyBodySettingRule } from './invalidApiProxyBodySettingRule'
import { legacyApiRule } from './legacyApiRule'
import { noReferenceApiRule } from './noReferenceApiRule'
import { noReferenceApiServiceRule } from './noReferenceApiServiceRule'
import { unknownApiInputRule } from './unknownApiInputRule'
import { unknownApiRule } from './unknownApiRule'
import { unknownApiServiceRule } from './unknownApiServiceRule'

export default [
  invalidApiParserModeRule,
  invalidApiProxyBodySettingRule,
  legacyApiRule,
  noReferenceApiRule,
  // noReferenceApiInputRule,
  noReferenceApiServiceRule,
  unknownApiInputRule,
  unknownApiRule,
  unknownApiServiceRule,
]
