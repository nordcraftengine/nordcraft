import { duplicateRouteRule } from './duplicateRouteRule'
import { duplicateUrlParameterRule } from './duplicateUrlParameterRule'
import { unknownSetUrlParameterRule } from './unknownSetUrlParameterRule'
import { unknownUrlParameterRule } from './unknownUrlParameterRule'

export default [
  duplicateUrlParameterRule,
  duplicateRouteRule,
  unknownSetUrlParameterRule,
  unknownUrlParameterRule,
]
