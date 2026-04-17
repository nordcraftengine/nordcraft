import { isDefined } from '@nordcraft/core/dist/utils/util'
import { angleUnits, lengthUnits, resolutionUnits, timeUnits } from './const'
import type {
  CSSStyleToken,
  getValueType,
  NodeTypes,
  ParsedBlock,
  ParsedConicGradientType,
  ParsedImageSetType,
  ParsedLinearGradientType,
  ParsedRadialGradientType,
  ParsedValueType,
} from './types'

export const getVariableValue = ({
  value,
  variables,
}: {
  value?: ParsedValueType
  variables: CSSStyleToken[]
}): ParsedValueType | null => {
  if (!isDefined(value)) {
    return null
  }
  if (value.type === 'function' && value.name === 'var') {
    const [name] = value.value.split(', ')

    if (!isDefined(name)) {
      return null
    }

    const usedVariable = variables.find((variable) =>
      variable.name.startsWith('--')
        ? variable.name === name
        : `--${variable.name}` === name,
    )

    if (usedVariable) {
      const value =
        parseMultipleValues([
          {
            type: 'word',
            value: usedVariable?.unit
              ? `${usedVariable.value}${usedVariable.unit}`
              : usedVariable.value,
          },
        ])[0] ?? null

      return value
    }

    return null
  }

  return value
}

export const getValue = (
  value?: ParsedBlock | NodeTypes,
  splitValues?: boolean,
  splitChildFuncValues?: boolean,
): getValueType[] => {
  if (!value) {
    return []
  }

  switch (value.type) {
    case 'block': {
      return value.nodes.length > 0
        ? value.nodes
            .map((v: NodeTypes) => {
              return getValue(v, splitValues)
            })
            .flatMap((v) => v)
        : []
    }
    case 'function':
      if (splitValues) {
        const values =
          value.nodes.length > 0
            ? value.nodes
                .map((v: NodeTypes) => {
                  return getValue(v, splitChildFuncValues)
                })
                .flatMap((v) => v)
            : []
        return [{ type: 'function', name: value.value, value: values }]
      } else {
        let fValue = ''

        value.nodes.forEach((v, i: number) => {
          const val = getValue(v)

          val.forEach((item) => {
            if (item.type === 'functionParam') {
              item.value?.forEach((param, index) => {
                fValue += param.value
                const lengthParams = item.value?.length ?? 0
                if (index < lengthParams - 1) {
                  fValue += ' '
                }
              })
            } else if (item.type === 'function') {
              fValue += `${item.name}(${item.value})`
            } else {
              fValue += item.value
            }
          })

          if (i < value.nodes.length - 1) {
            const nextNode = value.nodes[i + 1]
            if (nextNode?.type === 'comment') {
              fValue += ' '
            } else if (
              v.type === 'div' &&
              (v.value === ',' || v.value === '/')
            ) {
              fValue += ' '
            } else if (
              nextNode?.type === 'div' &&
              (nextNode.value === ',' || nextNode.value === '/')
            ) {
              // Don't add anything before comma or slash
            } else {
              // Default joiner is now space
              fValue += ' '
            }
          }
        })
        return [{ type: 'function', name: value.value, value: fValue }]
      }
    case 'string':
      return [{ type: value.type, value: value.value, quote: value.quote }]
    case 'functionParam': {
      const firstParam = value.nodes[0]
      if (value.nodes.length === 1 && isDefined(firstParam)) {
        return getValue(firstParam, false)
      } else {
        const values =
          value.nodes.length > 1
            ? value.nodes
                .map((v: NodeTypes) => {
                  return getValue(v, false)
                })
                .flatMap((v) => v)
            : []

        return [{ type: 'functionParam', value: values }]
      }
    }
    case 'comment': {
      return [{ type: 'word', value: `/*${value.value}*/` }]
    }
    default:
      return [{ type: 'word', value: value.value }]
  }
}

export const parseMultipleValues = (
  values: getValueType[],
): ParsedValueType[] => {
  return values
    .filter((v) => v.value !== '!important')
    .map((v) => {
      const type = v.type
      const value = v.value
      if (type === 'functionParam') {
        return null
      } else if (type === 'function' && Array.isArray(value)) {
        const args = parseMultipleValues(value)

        return {
          type: 'functionArguments',
          name: v.name,
          arguments: args,
        } as ParsedValueType
      } else if (typeof value === 'string' && value !== '') {
        if (type !== 'word') {
          if (type === 'function') {
            return {
              type,
              value,
              name: v.name,
            }
          } else {
            return v
          }
        }
        // if it's slash
        if (value === '/') {
          return { type: 'slash', value } as ParsedValueType
        }

        if (isColor(value) && value.charAt(0) === '#') {
          return { type: 'hex', value } as ParsedValueType
        }

        // if it's not only numbers and is alphanumeric and does not start with number
        if (
          !Number.parseFloat(value) &&
          /^[a-z0-9-]+$/gi.test(value) &&
          !/^\d/.test(value)
        ) {
          return { type: 'keyword', value } as ParsedValueType
        }

        // if it's not alphabetic only then we want to split the number from the unit
        const split = value.match(/^([-.\d]+(?:\.\d+)?)(.*)$/) ?? ''
        const val = split[1]?.trim()
        const unit =
          split[2]?.trim() === '' ? 'number' : (split[2]?.trim() ?? '')

        if (!isDefined(val)) {
          return null
        }

        if (unit === 'number') {
          return {
            type: 'number',
            value: val,
          } as ParsedValueType
        }
        if (lengthUnits.includes(unit)) {
          return {
            type: 'length',
            value: val,
            unit,
          } as ParsedValueType
        }
        if (timeUnits.includes(unit)) {
          return {
            type: 'time',
            value: val,
            unit,
          } as ParsedValueType
        }
        if (angleUnits.includes(unit)) {
          return {
            type: 'angle',
            value: val,
            unit,
          } as ParsedValueType
        }
        if (resolutionUnits.includes(unit)) {
          return {
            type: 'resolution',
            value: val,
            unit,
          } as ParsedValueType
        }
        return null
      } else {
        return null
      }
    })
    .filter((v) => v !== null)
}

export const isColor = (strColor: string) => {
  const s = document.createElement('option').style
  s.color = strColor
  return s.color !== ''
}

export const isVariable = (value: string) => {
  return value.startsWith('--')
}

export const checkIfNoUnknownVariables = (args: {
  variables: CSSStyleToken[]
  allValues: (
    | ParsedValueType
    | ParsedLinearGradientType
    | ParsedConicGradientType
    | ParsedRadialGradientType
    | ParsedImageSetType
  )[]
}) => {
  const variableNames = args.allValues
    .map((v) => {
      if (v.type === 'function' && v.name === 'var') {
        return v.value.split(',').map((arg) => {
          if (isVariable(arg)) {
            return ensureNoCssVariablePrefix(arg)
          }
        })
      } else if (v.type === 'linear-function') {
        const vals = []
        vals.push(v.direction)
        vals.push(v.interpolation)
        v.stops.forEach((stop) => {
          vals.push(stop.color)
          vals.push(stop.position)
        })
        return vals
          .filter((v) => v)
          .map((v) => {
            if (v?.type === 'function' && v.name === 'var') {
              return ensureNoCssVariablePrefix(v.value)
            }
          })
      }
    })
    .flatMap((v) => v)
    .filter((v) => v)
  const knownVariableNames = args.variables
    .filter((v) => isDefined(v.value))
    .map((variable: any) => ensureNoCssVariablePrefix(variable.name))
  return variableNames.every((v) => knownVariableNames.includes(v))
}

const charCodeOf = (char: string) => char.charCodeAt(0)

export const parse = ({
  input,
  slashSplit = true,
  whiteSpaceSplit = true,
}: {
  input?: string | null
  slashSplit?: boolean
  whiteSpaceSplit?: boolean
}) => {
  const openParentheses = charCodeOf('(')
  const closeParentheses = charCodeOf(')')
  const singleQuote = charCodeOf("'")
  const doubleQuote = charCodeOf('"')
  const backslash = charCodeOf('\\')
  const slash = charCodeOf('/')
  const comma = charCodeOf(',')
  const colon = charCodeOf(':')
  const star = charCodeOf('*')
  const uLower = charCodeOf('u')
  const uUpper = charCodeOf('U')
  const plus = charCodeOf('+')
  const isUnicodeRange = /^[a-f0-9?-]+$/i

  if (input === undefined || input == null) {
    return []
  }
  let tokens: NodeTypes[] = []
  let value = `${input}`
  let next: number
  let quote: "'" | '"'
  let token: NodeTypes | string
  let escape: boolean
  let escapePos: number
  let whitespacePos: number
  let parenthesesOpenPos: number
  let pos = 0
  let code = value.charCodeAt(pos)
  const max = value.length
  const stack: {
    nodes: NodeTypes[]
    type?: 'function' | 'comment'
    unclosed?: boolean
  }[] = [{ nodes: tokens }]
  let balanced = 0
  let parent: NodeTypes | undefined
  let name = ''
  while (pos < max) {
    if (code <= 32) {
      next = pos
      do {
        next++
        code = value.charCodeAt(next)
      } while (code <= 32)
      token = value.slice(pos, next)

      pos = next
    } else if (code === singleQuote || code === doubleQuote) {
      next = pos
      quote = code === singleQuote ? "'" : '"'
      token = {
        type: 'string',
        quote,
        value: '',
      }
      do {
        escape = false
        next = value.indexOf(quote, next + 1)
        if (~next) {
          escapePos = next
          while (value.charCodeAt(escapePos - 1) === backslash) {
            escapePos--
            escape = !escape
          }
        } else {
          value += quote
          next = value.length - 1
          token.unclosed = true
        }
      } while (escape)
      token.value = value.slice(pos + 1, next)
      tokens.push(token)
      pos = next + 1
      code = value.charCodeAt(pos)
    } else if (code === slash && value.charCodeAt(pos + 1) === star) {
      next = value.indexOf('*/', pos)
      token = {
        type: 'comment',
        nodes: [],
        value: '',
      }
      if (next === -1) {
        token.unclosed = true
        next = value.length
      }
      token.value = value.slice(pos + 2, next)
      tokens.push(token)
      pos = next + 2
      code = value.charCodeAt(pos)
    } else if (
      (code === slash || code === star) &&
      parent &&
      typeof parent !== 'string' &&
      parent.type === 'function' &&
      parent.value === 'calc'
    ) {
      const val = value[pos]
      if (isDefined(val)) {
        token = val
        tokens.push({
          type: 'word',
          value: token,
        })
      }
      pos++
      code = value.charCodeAt(pos)
    } else if (code === slash || code === comma || code === colon) {
      const val = value[pos]
      if (isDefined(val)) {
        token = val
        tokens.push({
          type: 'div',
          value: token,
        })
      }
      pos++
      code = value.charCodeAt(pos)
    } else if (openParentheses === code) {
      next = pos
      do {
        next++
        code = value.charCodeAt(next)
      } while (code <= 32)
      parenthesesOpenPos = pos
      token = {
        type: 'function',
        value: name,
        nodes: [],
      }
      pos = next
      if (name === 'url' && code !== singleQuote && code !== doubleQuote) {
        next--
        do {
          escape = false
          next = value.indexOf(')', next + 1)
          if (~next) {
            escapePos = next
            while (value.charCodeAt(escapePos - 1) === backslash) {
              escapePos--
              escape = !escape
            }
          } else {
            value += ')'
            next = value.length - 1
            token.unclosed = true
          }
        } while (escape)
        whitespacePos = next
        do {
          whitespacePos--
          code = value.charCodeAt(whitespacePos)
        } while (code <= 32)
        if (parenthesesOpenPos < whitespacePos) {
          if (pos !== whitespacePos + 1) {
            token.nodes = [
              {
                type: 'word',
                value: value.slice(pos, whitespacePos + 1),
              },
            ]
          } else {
            token.nodes = []
          }
        } else {
          token.nodes = []
        }
        pos = next + 1
        code = value.charCodeAt(pos)
        tokens.push(token)
      } else {
        balanced++
        tokens.push(token)

        stack.push(token)

        tokens = token.nodes = []
        parent = token
      }
      name = ''
    } else if (closeParentheses === code && balanced) {
      pos++
      code = value.charCodeAt(pos)
      balanced--
      stack.pop()

      parent = {
        value: '',
        nodes: [],
        ...stack[balanced],
        type: stack[balanced]?.type ?? 'comment',
      }

      if (
        typeof parent !== 'string' &&
        typeof parent !== 'undefined' &&
        (parent.type === 'comment' || parent.type === 'function')
      ) {
        tokens = parent.nodes
      }
    } else {
      next = pos
      do {
        if (code === backslash) {
          next++
        }
        next++
        code = value.charCodeAt(next)
      } while (
        next < max &&
        !(
          (parent &&
          typeof parent !== 'string' &&
          parent.type === 'function' &&
          // code 32 is the char code for white space and in some functions we don't want to split the values
          // in the function by the white space only by comma
          !whiteSpaceSplit
            ? code < 32
            : code <= 32) ||
          code === singleQuote ||
          code === doubleQuote ||
          code === comma ||
          code === colon ||
          code === slash ||
          code === openParentheses ||
          (code === star &&
            parent &&
            typeof parent !== 'string' &&
            parent.type === 'function' &&
            parent.value === 'calc') ||
          (code === slash &&
            parent &&
            typeof parent !== 'string' &&
            parent.type === 'function' &&
            parent.value === 'calc') ||
          (code === closeParentheses && balanced)
        )
      )
      token = value.slice(pos, next)

      if (openParentheses === code) {
        name = token
      } else if (
        (uLower === token.charCodeAt(0) || uUpper === token.charCodeAt(0)) &&
        plus === token.charCodeAt(1) &&
        isUnicodeRange.test(token.slice(2))
      ) {
        tokens.push({
          type: 'unicode-range',
          value: token,
        })
      } else {
        if (parent?.type === 'function' && !whiteSpaceSplit) {
          const splitNodes: NodeTypes[] = token
            .trim()
            .split(' ')
            .map((t) => {
              return {
                type: 'word',
                value: t.trim(),
              }
            })

          tokens.push({
            type: 'functionParam',
            nodes: splitNodes,
          })
        } else {
          tokens.push({
            type: 'word',
            value: token.trim(),
          })
        }
      }
      pos = next
    }
  }

  for (pos = stack.length - 1; pos; pos--) {
    const index = pos
    if (isDefined(stack[index])) {
      stack[index].unclosed = true
    }
  }
  const results: {
    type: 'block'
    nodes: NodeTypes[]
  }[] = [{ type: 'block', nodes: [] }]
  let resultIndex = 0

  if (isDefined(stack[0])) {
    for (const node of stack[0].nodes) {
      if (
        typeof node !== 'string' &&
        ((node.type === 'div' && node.value !== '/') ||
          (node.type === 'div' && node.value === '/' && slashSplit))
      ) {
        resultIndex++
        results[resultIndex] = { type: 'block', nodes: [] }
        continue
      }

      results[resultIndex]?.nodes.push(node)
    }
  }
  return results
}

function ensureNoCssVariablePrefix(arg: string): string | undefined {
  return arg.startsWith('--') ? arg.slice(2) : arg
}
