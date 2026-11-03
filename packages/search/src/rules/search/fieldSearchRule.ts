import { isDefined } from '@nordcraft/core'
import equal from 'fast-deep-equal'
import type { NodeType, SearchRule } from '../../types'
import {
  parseSearchQuery,
  type FreetextToken,
  type SearchQueryToken,
} from '../../util/parseSearchQuery'
import { matchNodeSelector } from './nodeSelectorSearchRule'
import {
  getNodeTypesForReference,
  matchReferenceToken,
  shouldReferenceTraverseComponentChild,
} from './referenceSearchRule'
import { matchScopeToken } from './scopeSearchRule'
import { getNodeTypesForTypeFilter, matchTypeFilter } from './typeSearchRule'

const ALL_NODE_TYPES_MAP: Record<NodeType['nodeType'], true> = {
  'action-custom-model-argument': true,
  'action-custom-model-event': true,
  'action-model': true,
  animation: true,
  'api-service': true,
  component: true,
  'component-api': true,
  'component-api-input': true,
  'component-attribute': true,
  'component-context': true,
  'component-event': true,
  'component-formula': true,
  'component-node': true,
  'component-node-attribute': true,
  'component-variable': true,
  'component-workflow': true,
  'custom-property': true,
  formula: true,
  'project-action': true,
  'project-config': true,
  'project-formula': true,
  'project-package': true,
  'project-route': true,
  'project-theme': true,
  'project-theme-property': true,
  'style-declaration': true,
  'style-variable': true,
  'style-variant': true,
}

const ALL_NODE_TYPES = Object.keys(ALL_NODE_TYPES_MAP) as NodeType['nodeType'][]

interface MatchContext {
  before: string
  matched: string
  after: string
}

type MatchResult =
  | {
      hasMatch: true
      context: MatchContext
      field?: string
    }
  | false

interface PreparedFreetext {
  token: FreetextToken
  targetValue: string
  targetLower: string
  hasComma: boolean
  isJsonStructural: boolean
  parsedJson: unknown
  hasParsedJson: boolean
  canMatchObjectLiteral: boolean
  canMatchTrue: boolean
  canMatchFalse: boolean
  canMatchNull: boolean
  canMatchUndefined: boolean
  canMatchNumber: boolean
}

function makeMatch(str: string, index: number, length: number): MatchResult {
  return {
    hasMatch: true,
    context: {
      before: str.slice(0, index),
      matched: str.slice(index, index + length),
      after: str.slice(index + length),
    },
  }
}

function fullMatch(matched: string): MatchResult {
  return { hasMatch: true, context: { before: '', matched, after: '' } }
}

function isJsonStructuralTarget(targetValue: string): boolean {
  return (
    (targetValue.startsWith('[') && targetValue.endsWith(']')) ||
    (targetValue.startsWith('{') && targetValue.endsWith('}'))
  )
}

function prepareFreetextToken(token: FreetextToken): PreparedFreetext {
  if (token.value instanceof RegExp) {
    return {
      token,
      targetValue: '',
      targetLower: '',
      hasComma: false,
      isJsonStructural: false,
      parsedJson: undefined,
      hasParsedJson: false,
      canMatchObjectLiteral: token.value.test('[object Object]'),
      canMatchTrue: true,
      canMatchFalse: true,
      canMatchNull: true,
      canMatchUndefined: true,
      canMatchNumber: true,
    }
  }

  const targetValue = token.value
  const targetLower = targetValue.toLowerCase()
  const isJsonStructural = token.exact && isJsonStructuralTarget(targetValue)
  let parsedJson: unknown = undefined
  let hasParsedJson = false
  if (isJsonStructural) {
    try {
      parsedJson = JSON.parse(targetValue)
      hasParsedJson = true
    } catch {
      // ignore invalid JSON
    }
  }

  return {
    token,
    targetValue,
    targetLower,
    hasComma: targetValue.includes(','),
    isJsonStructural,
    parsedJson,
    hasParsedJson,
    canMatchObjectLiteral: token.exact
      ? targetLower === '[object object]'
      : '[object object]'.includes(targetLower),
    canMatchTrue: token.exact
      ? targetLower === 'true'
      : 'true'.includes(targetLower),
    canMatchFalse: token.exact
      ? targetLower === 'false'
      : 'false'.includes(targetLower),
    canMatchNull: token.exact
      ? targetLower === 'null'
      : 'null'.includes(targetLower),
    canMatchUndefined: token.exact
      ? targetLower === 'undefined'
      : 'undefined'.includes(targetLower),
    canMatchNumber: targetLower.length === 0 || /[\d.e+-]/.test(targetLower),
  }
}

function checkStringMatch(
  stringVal: string,
  prepared: PreparedFreetext,
): MatchResult {
  const { targetValue, targetLower, token, hasParsedJson, parsedJson } =
    prepared

  if (targetLower === '') {
    return stringVal === ''
      ? { hasMatch: true, context: { before: '', matched: '', after: '' } }
      : false
  }

  if (token.exact) {
    if (hasParsedJson) {
      try {
        if (
          equal(stringVal, parsedJson) ||
          equal(JSON.parse(stringVal), parsedJson)
        ) {
          return fullMatch(stringVal)
        }
      } catch {
        // fall through to string comparison
      }
    }
    if (stringVal.length !== targetValue.length) {
      return false
    }
    return stringVal.toLowerCase() === targetLower
      ? fullMatch(stringVal)
      : false
  }

  if (stringVal.length < targetValue.length) {
    return false
  }

  const index = stringVal.toLowerCase().indexOf(targetLower)
  return index !== -1 ? makeMatch(stringVal, index, targetValue.length) : false
}

function matchRegex(
  value: unknown,
  matcher: RegExp,
  key?: string,
): MatchResult {
  if (Array.isArray(value)) {
    return false
  }

  const str =
    typeof value === 'object' && value !== null
      ? '[object Object]'
      : String(value)
  const m = str.match(matcher)
  if (!m) {
    if (key) {
      const combined = `${key}: ${str}`
      const mCombined = combined.match(matcher)
      if (mCombined) {
        const idx = mCombined.index ?? 0
        return {
          hasMatch: true,
          context: {
            before: combined.slice(0, idx),
            matched: combined.slice(idx, idx + mCombined[0].length),
            after: combined.slice(idx + mCombined[0].length),
          },
        }
      }
    }
    return false
  }

  return makeMatch(str, m.index ?? 0, m[0].length)
}

function matchString(
  valToCheck: unknown,
  prepared: PreparedFreetext,
): MatchResult {
  if (typeof valToCheck === 'string') {
    return checkStringMatch(valToCheck, prepared)
  }

  if (typeof valToCheck === 'boolean') {
    if (valToCheck ? !prepared.canMatchTrue : !prepared.canMatchFalse) {
      return false
    }
    return checkStringMatch(valToCheck ? 'true' : 'false', prepared)
  }

  if (typeof valToCheck === 'number') {
    if (!prepared.canMatchNumber) {
      return false
    }
    return checkStringMatch(String(valToCheck), prepared)
  }

  if (valToCheck === null) {
    return prepared.canMatchNull ? checkStringMatch('null', prepared) : false
  }

  if (valToCheck === undefined) {
    return prepared.canMatchUndefined
      ? checkStringMatch('undefined', prepared)
      : false
  }

  if (Array.isArray(valToCheck)) {
    if (!prepared.isJsonStructural) {
      for (let i = 0; i < valToCheck.length; i++) {
        const v: unknown = valToCheck[i]
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          const recordVal = v as Record<string, unknown>
          if (recordVal.type === 'value' || recordVal.type === 'formula') {
            const inner = matchString(recordVal.value, prepared)
            if (inner) {
              return inner
            }
          }
          continue
        }
        const m = matchString(v, prepared)
        if (m) {
          return m
        }
      }

      if (prepared.hasComma) {
        for (const sep of [',', ', ']) {
          const res = checkStringMatch(valToCheck.join(sep), prepared)
          if (res) {
            return res
          }
        }
      }
      return false
    }

    return checkStringMatch(String(valToCheck), prepared)
  }

  if (typeof valToCheck === 'object') {
    if (prepared.token.exact) {
      if (prepared.hasParsedJson && equal(valToCheck, prepared.parsedJson)) {
        return fullMatch(prepared.targetValue)
      }
      return false
    }

    if (!prepared.canMatchObjectLiteral) {
      return false
    }

    return checkStringMatch('[object Object]', prepared)
  }

  return checkStringMatch(String(valToCheck), prepared)
}

function evaluateFreetextOnValue(
  val: unknown,
  prepared: PreparedFreetext,
  key?: string,
): MatchResult {
  if (prepared.token.value instanceof RegExp) {
    return matchRegex(val, prepared.token.value, key)
  }
  return matchString(val, prepared)
}

function matchFreetextOnNode(options: {
  data: NodeType
  prepared: PreparedFreetext
  skippedFields?: Record<string, string[]>
  allowChildTextMatch: boolean
}): MatchResult {
  const { data, prepared, skippedFields, allowChildTextMatch } = options
  const { value, nodeType } = data
  if (typeof value !== 'object' || value === null) {
    return false
  }

  if (prepared.hasParsedJson || prepared.canMatchObjectLiteral) {
    const directMatch = evaluateFreetextOnValue(value, prepared)
    if (directMatch) {
      return directMatch
    }
  }

  const skippedForType = skippedFields?.[nodeType]
  const valueRecord = value as Record<string, unknown>
  const isRegex = prepared.token.value instanceof RegExp
  for (const k in valueRecord) {
    if (skippedForType?.includes(k)) {
      continue
    }
    const v = valueRecord[k]
    if (
      typeof v === 'object' &&
      v !== null &&
      !Array.isArray(v) &&
      !isRegex &&
      !prepared.hasParsedJson &&
      !prepared.canMatchObjectLiteral
    ) {
      continue
    }
    const fieldMatch = evaluateFreetextOnValue(v, prepared, k)
    if (fieldMatch) {
      return {
        ...fieldMatch,
        field: fieldMatch.field ?? k,
      }
    }
  }

  // If paired with a node selector (e.g. `<button> "Submit"`), also inspect immediate child text nodes
  if (
    allowChildTextMatch &&
    data.nodeType === 'component-node' &&
    isDefined(data.value) &&
    (data.value.type === 'element' || data.value.type === 'component') &&
    data.path[0] === 'components'
  ) {
    const compName = String(data.path[1])
    const compNodes = data.files.components[compName]?.nodes
    for (const childId of data.value.children ?? []) {
      const childNode = compNodes?.[childId]
      if (childNode?.type === 'text' && childNode.value.type === 'value') {
        const textMatch = evaluateFreetextOnValue(
          childNode.value.value,
          prepared,
          'children',
        )
        if (textMatch) {
          return {
            ...textMatch,
            field: 'children',
          }
        }
      }
    }
  }

  return false
}

function computeTargetNodeTypes(
  tokens: SearchQueryToken[],
): NodeType['nodeType'][] {
  let candidateSet: Set<NodeType['nodeType']> | null = null

  for (const token of tokens) {
    if (token.exclude) {
      continue
    }

    let tokenTypes: NodeType['nodeType'][] | null = null
    switch (token.kind) {
      case 'selector':
        tokenTypes = ['component-node']
        break
      case 'reference':
        tokenTypes = getNodeTypesForReference(token)
        break
      case 'type':
        tokenTypes = getNodeTypesForTypeFilter(token)
        break
      case 'scope':
      case 'freetext':
        tokenTypes = null
        break
    }

    if (tokenTypes !== null) {
      if (candidateSet === null) {
        candidateSet = new Set(tokenTypes)
      } else {
        const nextSet = new Set<NodeType['nodeType']>()
        for (const t of tokenTypes) {
          if (candidateSet.has(t)) {
            nextSet.add(t)
          }
        }
        candidateSet = nextSet
      }
    }
  }

  return candidateSet ? Array.from(candidateSet) : ALL_NODE_TYPES
}

export function createFieldSearchRule({
  query,
  skippedFields,
}: {
  query: string
  withDetails?: boolean
  skippedFields?: Record<string, string[]>
}): SearchRule {
  const parsedTokens = parseSearchQuery(query)
  const reportedPaths = new Set<string>()
  const hasSelectorToken = parsedTokens.some(
    (t) => t.kind === 'selector' && !t.exclude,
  )
  const targetNodeTypes =
    parsedTokens.length > 0 ? computeTargetNodeTypes(parsedTokens) : []

  const preparedFreetextMap = new Map<FreetextToken, PreparedFreetext>()
  for (const token of parsedTokens) {
    if (token.kind === 'freetext') {
      preparedFreetextMap.set(token, prepareFreetextToken(token))
    }
  }

  return {
    nodeTypes: targetNodeTypes,
    shouldTraverseChildType: (parent, childNodeType) => {
      if (parent.nodeType !== 'component') {
        return true
      }
      for (const token of parsedTokens) {
        if (token.kind === 'scope') {
          const inScope = matchScopeToken(parent, token)
          if (token.exclude ? inScope : !inScope) {
            return false
          }
        } else if (token.kind === 'reference' && !token.exclude) {
          if (
            !shouldReferenceTraverseComponentChild(parent, childNodeType, token)
          ) {
            return false
          }
        }
      }
      return true
    },
    visit: (report, data) => {
      const { path, value, nodeType } = data
      if (
        typeof value !== 'object' ||
        value === null ||
        parsedTokens.length === 0
      ) {
        return
      }

      let matchContext: MatchContext | null = null
      let matchedFieldName: string | null = null

      for (const token of parsedTokens) {
        let matched = false

        switch (token.kind) {
          case 'selector': {
            matched = matchNodeSelector(data, token)
            break
          }
          case 'reference': {
            matched = matchReferenceToken(data, token)
            break
          }
          case 'scope': {
            matched = matchScopeToken(data, token)
            break
          }
          case 'type': {
            matched = matchTypeFilter(data, token)
            break
          }
          case 'freetext': {
            const prepared = preparedFreetextMap.get(token)!
            const freetextRes = matchFreetextOnNode({
              data,
              prepared,
              skippedFields,
              allowChildTextMatch: hasSelectorToken,
            })
            if (freetextRes) {
              matched = true
              if (!token.exclude) {
                matchContext = freetextRes.context
                matchedFieldName = freetextRes.field ?? matchedFieldName
              }
            }
            break
          }
        }

        const effectiveMatch = token.exclude ? !matched : matched
        if (!effectiveMatch) {
          return
        }
      }

      const pk = path.join('.')
      if (!reportedPaths.has(pk)) {
        reportedPaths.add(pk)
        report({
          path,
          details: {
            context: matchContext,
            field: matchedFieldName,
            nodeType,
          },
        })
      }
    },
  }
}
