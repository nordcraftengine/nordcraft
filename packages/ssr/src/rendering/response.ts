import type { ComponentData, Nullable, ResponseHeaders } from '@nordcraft/core'
import { applyFormula, isFormula, type FormulaContext } from '@nordcraft/core'

export const evaluateResponseHeaders = ({
  formulaContext,
  data,
  responseHeaders,
}: {
  formulaContext: FormulaContext
  data: ComponentData
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
