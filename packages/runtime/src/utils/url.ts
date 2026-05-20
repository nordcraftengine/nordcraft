import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Location } from '../types'

export const getLocationUrl = ({ query, route, params, hash }: Location) => {
  if (!route) {
    return
  }
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
  const path = '/' + pathSegments.join('/')
  const hashString = hash === undefined || hash === '' ? '' : '#' + hash
  const queryString = Object.entries(query)
    .filter(([_, q]) => q !== null)
    .map(([key, value]) => {
      return `${encodeURIComponent(
        route?.query[key]?.name ?? key,
      )}=${encodeURIComponent(String(value))}`
    })
    .join('&')

  return `${path}${hashString}${
    queryString.length > 0 ? '?' + queryString : ''
  }`
}
