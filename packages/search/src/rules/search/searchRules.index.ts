import type { SearchRule } from '../../types'
import { createFieldSearchRule } from './fieldSearchRule'

export { createFieldSearchRule } from './fieldSearchRule'
export { matchNodeSelector } from './nodeSelectorSearchRule'
export {
  getNodeTypesForReference,
  matchReferenceToken,
} from './referenceSearchRule'
export { matchScopeToken } from './scopeSearchRule'
export { getNodeTypesForTypeFilter, matchTypeFilter } from './typeSearchRule'

export function createSearchRules(options: {
  query: string
  withDetails?: boolean
  skippedFields?: Record<string, string[]>
}): SearchRule[] {
  return [createFieldSearchRule(options)]
}
