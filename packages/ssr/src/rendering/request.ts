import { isDefined } from '@nordcraft/core'
import xss from 'xss'

export const escapeSearchParameter = (searchParameter?: string | null) =>
  typeof searchParameter === 'string' ? xss(searchParameter) : null

export const escapeSearchParameters = (searchParams: URLSearchParams) =>
  new URLSearchParams(
    [...searchParams.entries()].reduce<Record<string, string>>(
      (params, [key, value]) => {
        const escapedValue = escapeSearchParameter(value)
        if (isDefined(escapedValue)) {
          params[key] = escapedValue
        }
        return params
      },
      {},
    ),
  )
