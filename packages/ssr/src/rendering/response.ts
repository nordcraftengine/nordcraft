import type {
  ComponentData,
  ResponseHeaders,
} from '@nordcraft/core/dist/component/component.types'
import {
  applyFormula,
  isFormula,
  type FormulaContext,
} from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'

export const evaluateResponseHeaders = ({
  formulaContext,
  data,
  responseHeaders,
}: {
  formulaContext: FormulaContext
  data?: ComponentData
  responseHeaders: Nullable<Partial<ResponseHeaders>>
}) => {
  if (!responseHeaders) {
    return {}
  }
  const evaluatedHeaders: Record<string, string> = {}
  for (const [headerName, headerValue] of Object.entries(responseHeaders)) {
    if (typeof headerValue !== 'string' && !isFormula(headerValue)) {
      continue
    }
    const formulaValue = applyFormula(headerValue, formulaContext, data)
    if (typeof formulaValue === 'string') {
      evaluatedHeaders[headerName] = formulaValue
    }
  }
  return evaluatedHeaders
}
