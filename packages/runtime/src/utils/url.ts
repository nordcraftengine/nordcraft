import { isDefined } from '@nordcraft/core'
import { compile } from 'path-to-regexp'
import type { Location } from '../types'

export const getLocationUrl = ({
  query,
  page,
  route,
  params,
  hash,
}: Location) => {
  let path: string
  if (route) {
    const pathSegments: string[] = []
    for (const segment of route.path) {
      if (segment.type === 'static') {
        pathSegments.push(segment.name)
      } else {
        const segmentValue = params[segment.name]
        if (isDefined(segmentValue)) {
          pathSegments.push(segmentValue)
        } else {
          // If a param is missing, we can't build the rest of the path
          break
        }
      }
    }
    path = '/' + pathSegments.join('/')
  } else {
    path = compile(page as string, { encode: encodeURIComponent })(params)
  }
  const hashString = hash === undefined || hash === '' ? '' : '#' + hash
  const queryParts: string[] = []
  for (const key in query) {
    const value = query[key]
    if (value !== null) {
      queryParts.push(
        `${encodeURIComponent(
          route?.query[key]?.name ?? key,
        )}=${encodeURIComponent(String(value))}`,
      )
    }
  }
  const queryString = queryParts.join('&')

  return `${path}${hashString}${
    queryString.length > 0 ? '?' + queryString : ''
  }`
}
