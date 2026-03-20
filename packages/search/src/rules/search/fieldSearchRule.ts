import equal from 'fast-deep-equal'
import type { NodeType, SearchRule } from '../../types'
import { parseSearchQuery } from '../../util/parseSearchQuery'

type MatchResult =
  | {
      hasMatch: boolean
      context: { before: string; matched: string; after: string }
    }
  | boolean

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

function checkStringMatch(
  stringVal: string,
  targetValue: string,
  isExact: boolean,
): MatchResult {
  const stringValueLower = stringVal.toLowerCase()
  const targetValueLower = targetValue.toLowerCase()

  if (targetValueLower === '') {
    return stringValueLower === ''
      ? { hasMatch: true, context: { before: '', matched: '', after: '' } }
      : false
  }

  if (isExact) {
    // Attempt JSON structural match for bracket/brace targets
    if (isJsonStructuralTarget(targetValue)) {
      try {
        // JSON parse only used for structural equality — not reproduced as output
        const parsed = JSON.parse(targetValue)
        if (equal(stringVal, parsed) || equal(JSON.parse(stringVal), parsed)) {
          return fullMatch(stringVal)
        }
      } catch {
        // fall through to string comparison
      }
    }
    return stringValueLower === targetValueLower ? fullMatch(stringVal) : false
  }

  const index = stringValueLower.indexOf(targetValueLower)
  return index !== -1 ? makeMatch(stringVal, index, targetValue.length) : false
}

function matchRegex(value: any, matcher: RegExp, key?: string): MatchResult {
  const check = (v: any): MatchResult => {
    const str = String(v)
    const m = str.match(matcher)
    if (!m) {
      if (key) {
        const combined = `${key}: ${str}`
        const mCombined = combined.match(matcher)
        if (mCombined) {
          return {
            hasMatch: true,
            context: {
              before: combined.slice(0, mCombined.index),
              matched: combined.slice(
                mCombined.index ?? 0,
                (mCombined.index ?? 0) + mCombined[0].length,
              ),
              after: combined.slice(
                (mCombined.index ?? 0) + mCombined[0].length,
              ),
            },
          }
        }
      }
      return false
    }

    return makeMatch(str, m.index ?? 0, m[0].length)
  }

  if (!Array.isArray(value)) {
    return check(value)
  }

  return false
}

function matchString(value: any, matcher: string, key?: string): MatchResult {
  const isExact = matcher.startsWith('"') && matcher.endsWith('"')
  const targetValue = isExact ? matcher.slice(1, -1) : matcher
  const valToCheck = value

  if (Array.isArray(valToCheck)) {
    const isExactStructural = isExact && isJsonStructuralTarget(targetValue)

    if (!isExactStructural) {
      for (const v of valToCheck) {
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          if (v.type === 'value' || v.type === 'formula') {
            const inner = matchString(v.value, matcher)
            if (typeof inner === 'object' && inner.hasMatch) {
              return inner
            }
          }
          continue
        }
        const m = matchString(v, matcher)
        if (typeof m === 'object' && m.hasMatch) {
          return m
        }
      }

      for (const sep of [',', ', ']) {
        const res = checkStringMatch(valToCheck.join(sep), targetValue, isExact)
        if (res) {
          return res
        }
      }
      return false
    }

    return checkStringMatch(String(valToCheck), targetValue, isExact)
  }

  if (typeof valToCheck === 'object' && valToCheck !== null) {
    if (isExact) {
      if (isJsonStructuralTarget(targetValue)) {
        try {
          if (equal(valToCheck, JSON.parse(targetValue)))
            return fullMatch(targetValue)
        } catch {
          // fall through
        }
      }
      return false
    }

    const stringified = String(valToCheck)
    if (
      stringified === '[object Object]' &&
      targetValue.toLowerCase() !== '[object object]'
    ) {
      return false
    }

    return checkStringMatch(stringified, targetValue, isExact)
  }

  const matchRes = checkStringMatch(String(valToCheck), targetValue, isExact)
  if (
    typeof matchRes === 'object' &&
    matchRes.hasMatch &&
    key?.toLowerCase().includes(targetValue.toLowerCase())
  ) {
    return matchRes
  }

  return matchRes
}

function isMatch(
  value: any,
  matcher: string | RegExp | object | null,
  key?: string,
): MatchResult {
  if (matcher instanceof RegExp) {
    return matchRegex(value, matcher, key)
  }

  if (typeof matcher === 'string') {
    return matchString(value, matcher, key)
  }

  if (Array.isArray(matcher)) {
    return (
      Array.isArray(value) &&
      value.length >= matcher.length &&
      matcher.every((m, i) => equal(value[i], m))
    )
  }

  if (typeof matcher === 'object' && matcher !== null) {
    if (typeof value !== 'object' || value === null) {
      return false
    }
    for (const key in matcher) {
      if (!equal(value[key], (matcher as any)[key])) {
        return false
      }
    }
    return true
  }

  return value === matcher
}

function getValueByPath(
  obj: any,
  path: string,
): { value: any; found: boolean } {
  const parts: string[] = []
  const partRegex = /"([^"]+)"|'([^']+)'|([^.\s]+)/g
  let match
  const trimmedPath = path.trim()

  while ((match = partRegex.exec(trimmedPath)) !== null) {
    parts.push(match[1] || match[2] || match[3])
  }

  if (trimmedPath.includes('*')) {
    const results: any[] = []
    const walk = (curr: any, i: number) => {
      if (i === parts.length) {
        results.push(curr)
        return
      }
      if (curr === null || typeof curr !== 'object') {
        return
      }
      if (parts[i] === '*') {
        for (const k in curr) walk(curr[k], i + 1)
      } else if (parts[i] in curr) {
        walk(curr[parts[i]], i + 1)
      }
    }
    walk(obj, 0)
    return { value: results, found: results.length > 0 }
  }

  let curr = obj
  for (const p of parts) {
    if (curr === null || typeof curr !== 'object' || !(p in curr)) {
      return { value: undefined, found: false }
    }
    curr = curr[p]
  }
  return { value: curr, found: true }
}

export function createFieldSearchRule({
  query,
  skippedFields,
}: {
  query: string
  withDetails?: boolean
  skippedFields?: Partial<{
    [K in NodeType as K['nodeType']]: (keyof K['value'])[]
  }>
}): SearchRule {
  const parsedQuery = parseSearchQuery(query)
  const reportedPaths = new Set<string>()

  function evaluateFieldsObject(
    val: any,
    fieldsObj: Record<string, string | RegExp>,
  ): MatchResult {
    let lastMatch: MatchResult = true
    for (const f in fieldsObj) {
      const m = fieldsObj[f]

      const { value: fv, found } = getValueByPath(val, f)
      if (!found) {
        return false
      }

      const matchResult = isMatch(fv, m, f)
      if (!matchResult) {
        return false
      }

      if (typeof matchResult === 'object' && matchResult.hasMatch) {
        lastMatch = { ...matchResult, field: f } as any
      }
    }

    return lastMatch
  }

  function evaluateValue(val: any, part: any, key: string): MatchResult {
    const { fields, exclude } = part

    if (!fields) {
      return !exclude
    }

    let matched: MatchResult = false

    if (
      typeof fields === 'object' &&
      !Array.isArray(fields) &&
      !(fields instanceof RegExp)
    ) {
      matched = evaluateFieldsObject(
        val,
        fields as Record<string, string | RegExp>,
      )
    } else {
      const matchResult = isMatch(val, fields, key)
      matched =
        typeof matchResult === 'object' && matchResult.hasMatch
          ? matchResult
          : !!matchResult
    }

    return exclude ? !matched : matched
  }

  return {
    visit: (report, { path, value, nodeType }) => {
      if (
        typeof value !== 'object' ||
        value === null ||
        parsedQuery.length === 0
      )
        return

      let matchContext: any = null
      let matchedFieldName: string | null = null

      const allMatched = parsedQuery.every((p) => {
        if (p.nodeType && nodeType !== p.nodeType) {
          return false
        }

        const evalRes = evaluateValue(value, p, '')
        if (evalRes) {
          if (typeof evalRes === 'object' && evalRes.hasMatch) {
            matchContext = evalRes.context
            matchedFieldName = (evalRes as any).field ?? matchedFieldName
          }
          {
            return true
          }
        }

        return Object.entries(value).some(([k, v]) => {
          if (
            (skippedFields?.[nodeType] as Array<string> | undefined)?.includes(
              k,
            )
          ) {
            return false
          }

          const resValue = evaluateValue(v, p, k)
          if (resValue) {
            if (typeof resValue === 'object' && resValue.hasMatch) {
              matchContext = resValue.context
              matchedFieldName = (resValue as any).field ?? k
            }
            return true
          }

          return false
        })
      })

      if (allMatched) {
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
      }
    },
  }
}

function isJsonStructuralTarget(targetValue: string): boolean {
  return (
    (targetValue.startsWith('[') && targetValue.endsWith(']')) ||
    (targetValue.startsWith('{') && targetValue.endsWith('}'))
  )
}
