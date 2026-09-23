import { duplicateRouteRule } from './duplicateRouteRule'
import { duplicateUrlParameterRule } from './duplicateUrlParameterRule'
import { noEmptyUrlParameterNameRule } from './noEmptyUrlParameterNameRule'
import { unknownSetUrlParameterRule } from './unknownSetUrlParameterRule'
import { unknownUrlParameterRule } from './unknownUrlParameterRule'

export default [
  duplicateUrlParameterRule,
  duplicateRouteRule,
  noEmptyUrlParameterNameRule,
  unknownSetUrlParameterRule,
  unknownUrlParameterRule,
]
