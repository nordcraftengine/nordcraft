import { ShallowComponentSchema } from '@nordcraft/core/dist/component/schemas/component-schema'
import { get, set } from '@nordcraft/core/dist/utils/collections'
import * as v from 'valibot'
import type {
  ComponentNode,
  FixFunction,
  FixType,
  IssueRule,
  NodeType,
} from '../../../types'

export interface InvalidComponentData {
  message: string
  issue?: v.BaseIssue<unknown>
}

const changeDataTypeFix: FixFunction<ComponentNode, InvalidComponentData> = ({
  data,
  details,
}) => {
  if (details?.issue?.kind !== 'schema') {
    return data.files
  }
  const issuePath = convertIssuePath(details.issue.path)
  const currentValue = get(data.value, issuePath)
  switch (details.issue.expected?.toLowerCase()) {
    case 'string': {
      const parsed = v.safeParse(
        v.pipe(v.unknown(), v.toString(), v.string()),
        currentValue,
      )
      if (parsed.success) {
        return set(data.files, data.path, parsed.output)
      }
      break
    }
    case 'number': {
      const parsed = v.safeParse(
        v.pipe(v.unknown(), v.toNumber(), v.number()),
        currentValue,
      )
      if (parsed.success) {
        return set(data.files, [...data.path, ...issuePath], parsed.output)
      }
      break
    }
    case 'boolean': {
      const parsed = v.safeParse(
        v.pipe(v.unknown(), v.toBoolean(), v.boolean()),
        currentValue,
      )
      if (parsed.success) {
        return set(data.files, [...data.path, ...issuePath], parsed.output)
      }
      break
    }
    default:
      break
  }
  return data.files
}

const convertIssuePath = (path?: v.BaseIssue<unknown>['path']) =>
  path?.map((p) => {
    const key = typeof p === 'object' && p !== null && 'key' in p ? p.key : p
    return typeof key === 'number' ? key : String(key)
  }) ?? []

export const invalidComponentStructureRule: IssueRule<
  InvalidComponentData,
  NodeType,
  ComponentNode
> = {
  code: 'invalid component structure',
  level: 'warning',
  category: 'Quality',
  visit: (report, data) => {
    if (data.nodeType !== 'component') {
      return
    }
    const component = data.value
    const validation = v.safeParse(ShallowComponentSchema, component)
    if (validation.success) {
      return
    }
    validation.issues.forEach((issue) => {
      const issuePath = convertIssuePath(issue.path)
      const fixes: Set<FixType> = new Set()
      if (issue.kind === 'schema') {
        const validTypeCoercions: Partial<Record<string, string[]>> = {
          string: ['number', 'boolean', 'undefined'],
          number: ['string', 'boolean', 'undefined'],
          boolean: ['string', 'number', 'undefined'],
          array: ['object', 'undefined'],
          object: ['array', 'undefined'],
        }
        const actualValue = get(component, issuePath)
        const valueType = typeof actualValue
        const valueTypeKey = Array.isArray(actualValue) ? 'array' : valueType
        const conversions = validTypeCoercions[valueTypeKey]
        const expected = issue.expected?.toLowerCase()
        if (expected && conversions?.includes(expected)) {
          fixes.add('change-data-type')
        }
      }
      report({
        path: [...data.path, ...issuePath],
        info: {
          title: 'Invalid component structure',
          description: issue.message,
        },
        details: {
          message: issue.message,
          issue,
        },
        fixes: fixes.size > 0 ? Array.from(fixes) : undefined,
      })
    })
  },
  fixes: {
    'change-data-type': changeDataTypeFix,
  },
}

export type ChangeDataTypeFix = 'change-data-type'
