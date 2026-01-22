import { ShallowComponentSchema } from '@nordcraft/core/dist/component/schemas/component-schema'
import { get, set } from '@nordcraft/core/dist/utils/collections'
import { coerce } from 'zod'
import type { $ZodIssue, $ZodTypeDef } from 'zod/v4/core'
import type {
  ComponentNode,
  FixFunction,
  FixType,
  NodeType,
  Rule,
} from '../../../types'

export interface InvalidComponentData {
  message: string
  issue?: $ZodIssue
}

const changeDataTypeFix: FixFunction<ComponentNode, InvalidComponentData> = ({
  data,
  details,
}) => {
  if (details?.issue?.code !== 'invalid_type') {
    return data.files
  }
  const issuePath = convertIssuePath(details.issue.path)
  const currentValue = get(data.value, issuePath)
  switch (details.issue.expected) {
    case 'string': {
      const parsed = coerce.string().parse(currentValue)
      if (typeof parsed === 'string') {
        return set(data.files, data.path, parsed)
      }
      break
    }
    case 'number': {
      const parsed = coerce.number().parse(currentValue)
      if (typeof parsed === 'number') {
        return set(data.files, [...data.path, ...issuePath], parsed)
      }
      break
    }
    case 'boolean': {
      const parsed = coerce.boolean().parse(currentValue)
      if (typeof parsed === 'boolean') {
        return set(data.files, [...data.path, ...issuePath], parsed)
      }
      break
    }
    case 'bigint':
    case 'symbol':
    case 'undefined':
    case 'object':
    case 'function':
    case 'custom':
    case 'int':
    case 'null':
    case 'void':
    case 'never':
    case 'any':
    case 'unknown':
    case 'date':
    case 'record':
    case 'file':
    case 'tuple':
    case 'union':
    case 'intersection':
    case 'map':
    case 'set':
    case 'enum':
    case 'literal':
    case 'nullable':
    case 'optional':
    case 'nonoptional':
    case 'success':
    case 'transform':
    case 'default':
    case 'prefault':
    case 'catch':
    case 'nan':
    case 'pipe':
    case 'readonly':
    case 'template_literal':
    case 'promise':
    case 'lazy':
    case 'array':
      break
  }
  return data.files
}

const convertIssuePath = (path: PropertyKey[]) =>
  path.map((p) => (typeof p === 'number' ? p : String(p)))

export const invalidComponentStructureRule: Rule<
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
    const validation = ShallowComponentSchema.safeParse(component, {
      reportInput: false,
    })
    if (validation.success) {
      return
    }
    validation.error.issues.forEach((issue) => {
      const issuePath = convertIssuePath(issue.path)
      const fixes: Set<FixType> = new Set()
      switch (issue.code) {
        case 'invalid_type': {
          const validTypeCoercions: Partial<
            Record<string, $ZodTypeDef['type'][]>
          > = {
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
          if (conversions?.includes(issue.expected)) {
            fixes.add('change-data-type')
          }
          break
        }
        case 'too_big':
        case 'too_small':
        case 'invalid_format':
        case 'not_multiple_of':
        case 'unrecognized_keys':
        case 'invalid_union':
        case 'invalid_key':
        case 'invalid_element':
        case 'invalid_value':
        case 'custom':
          break
      }
      report(
        [...data.path, ...issuePath],
        {
          message: issue.message,
          issue,
        },
        fixes.size > 0 ? Array.from(fixes) : undefined,
      )
    })
  },
  fixes: {
    'change-data-type': changeDataTypeFix,
  },
}

export type ChangeDataTypeFix = 'change-data-type'
