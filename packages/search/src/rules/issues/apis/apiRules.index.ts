import { invalidApiParserModeRule } from './invalidApiParserModeRule'
import { invalidApiProxyBodySettingRule } from './invalidApiProxyBodySettingRule'
import { invalidApiProxyCookieSettingRule } from './invalidApiProxyCookieSettingRule'
import { legacyApiRule } from './legacyApiRule'
import { noReferenceApiRule } from './noReferenceApiRule'
import { noReferenceApiServiceRule } from './noReferenceApiServiceRule'
import { unknownApiInputRule } from './unknownApiInputRule'
import { unknownApiRule } from './unknownApiRule'
import { unknownApiServiceRule } from './unknownApiServiceRule'
import { unknownFetchInputRule } from './unknownFetchInputRule'

export default [
  // noReferenceApiInputRule,
  invalidApiParserModeRule,
  invalidApiProxyBodySettingRule,
  invalidApiProxyCookieSettingRule,
  legacyApiRule,
  noReferenceApiRule,
  noReferenceApiServiceRule,
  unknownFetchInputRule,
  unknownApiInputRule,
  unknownApiRule,
  unknownApiServiceRule,
]
