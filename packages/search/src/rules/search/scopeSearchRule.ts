import type { NodeType } from '../../types'
import { matchesSegment, type ScopeToken } from '../../util/parseSearchQuery'

const COLLECTION_ALIASES: Readonly<Record<string, string>> = {
  component: 'components',
  components: 'components',
  formula: 'formulas',
  formulas: 'formulas',
  action: 'actions',
  actions: 'actions',
  service: 'services',
  services: 'services',
  route: 'routes',
  routes: 'routes',
  theme: 'themes',
  themes: 'themes',
  package: 'packages',
  packages: 'packages',
  config: 'config',
}

export function matchScopeToken(data: NodeType, token: ScopeToken): boolean {
  const { segments } = token
  if (segments.length === 0) {
    return true
  }

  const firstSeg = segments[0]
  const firstLower = firstSeg.value.toLowerCase()
  const mappedCollection = COLLECTION_ALIASES[firstLower]

  if (segments.length === 1) {
    if (
      mappedCollection &&
      firstSeg.matchType !== 'exact' &&
      !data.files.components[firstSeg.value]
    ) {
      return String(data.path[0]).toLowerCase() === mappedCollection
    }
    return (
      data.path[0] === 'components' && matchesSegment(data.path[1], firstSeg)
    )
  }

  if (mappedCollection) {
    if (String(data.path[0]).toLowerCase() !== mappedCollection) {
      return false
    }
    const rest = segments.slice(1)
    if (data.path.length < rest.length + 1) {
      return false
    }
    for (let i = 0; i < rest.length; i++) {
      if (!matchesSegment(data.path[i + 1], rest[i])) {
        return false
      }
    }
    return true
  }

  if (data.path[0] !== 'components' || data.path.length < segments.length + 1) {
    return false
  }
  for (let i = 0; i < segments.length; i++) {
    if (!matchesSegment(data.path[i + 1], segments[i])) {
      return false
    }
  }

  return true
}
