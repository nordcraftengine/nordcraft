import { isDefined } from '@nordcraft/core/dist/utils/util'
import {
  checkIfNoUnknownVariables,
  getValue,
  isVariable,
  parse,
  parseMultipleValues,
} from './shared'
import type { CSSStyleToken, ParsedValueType } from './types'

export const getParsedFlex = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  const styleKeys = Object.keys(style)

  if (
    style['flex-grow'] ||
    style['flex-shrink'] ||
    style['flex-basis'] ||
    style.flex
  ) {
    let parsedFlex: {
      grow?: ParsedValueType
      shrink?: ParsedValueType
      basis?: ParsedValueType
    } = {}

    const invalidValues: ParsedValueType[] = []
    const shorthandFlex: {
      grow?: ParsedValueType
      shrink?: ParsedValueType
      basis?: ParsedValueType
    } = {}

    switch (style.flex) {
      case 'none':
        parsedFlex = {
          grow: { type: 'number', value: '0' },
          shrink: { type: 'number', value: '0' },
          basis: { type: 'keyword', value: 'auto' },
        }
        break
      case 'auto':
        parsedFlex = {
          grow: { type: 'number', value: '1' },
          shrink: { type: 'number', value: '1' },
          basis: { type: 'keyword', value: 'auto' },
        }
        break
      case 'initial':
        parsedFlex = {
          grow: { type: 'number', value: '0' },
          shrink: { type: 'number', value: '1' },
          basis: { type: 'keyword', value: 'auto' },
        }
        break
      default: {
        if (style.flex) {
          const flex = parse({ input: style.flex })

          const values = getValue(flex[0])
          const allValues = parseMultipleValues(values)

          const allVariablesKnown = checkIfNoUnknownVariables({
            variables,
            allValues,
          })

          if (allVariablesKnown) {
            // Go through all the values in the flex property
            allValues.forEach((value) => {
              const newProp = parseFlex({
                flex: shorthandFlex,
                valueToCheck: value,
                variables,
              })

              if (newProp.invalidValue) {
                invalidValues.push(value)
              } else if (newProp.grow) {
                shorthandFlex.grow = newProp.grow
              } else if (newProp.shrink) {
                shorthandFlex.shrink = newProp.shrink
              } else if (newProp.basis) {
                shorthandFlex.basis = newProp.basis
              }
            })

            // We apply only if no invalid values
            if (invalidValues.length === 0) {
              parsedFlex = shorthandFlex
              if (!parsedFlex.grow) {
                parsedFlex.grow = { type: 'number', value: '1' }
              }
              if (!parsedFlex.shrink) {
                parsedFlex.shrink = { type: 'number', value: '1' }
              }
              if (!parsedFlex.basis) {
                parsedFlex.basis = { type: 'length', value: '0', unit: '%' }
              }
            }
          } else {
            // Parse the values by the order
            parsedFlex = {
              grow: allValues[0],
              shrink: allValues[1],
              basis: allValues[2],
            }
          }
        }
      }
    }
    if (
      style['flex-grow'] &&
      (styleKeys.indexOf('flex-grow') > styleKeys.indexOf('flex') ||
        invalidValues.length > 0)
    ) {
      const flexGrow = parse({ input: style['flex-grow'] })
      const parsedFlexGrow = parseMultipleValues(getValue(flexGrow[0]))[0]

      // If it's a variable we always return that
      if (
        (isDefined(parsedFlexGrow) &&
          parsedFlexGrow.type === 'function' &&
          parsedFlexGrow.name === 'var') ||
        !style.flex
      ) {
        parsedFlex.grow = parsedFlexGrow
      } else {
        // Check if it's a valid value
        const newProp = parseFlex({
          flex: {},
          valueToCheck: parsedFlexGrow,
          variables,
        })
        if (newProp.grow) {
          parsedFlex.grow = newProp.grow
        }
      }
    }
    if (
      style['flex-shrink'] &&
      (styleKeys.indexOf('flex-shrink') > styleKeys.indexOf('flex') ||
        invalidValues.length > 0)
    ) {
      const flexShrink = parse({ input: style['flex-shrink'] })
      const parsedFlexShrink = parseMultipleValues(getValue(flexShrink[0]))[0]

      // If it's a variable we always return that
      if (
        (isDefined(parsedFlexShrink) &&
          parsedFlexShrink.type === 'function' &&
          parsedFlexShrink.name === 'var') ||
        !style.flex
      ) {
        parsedFlex.shrink = parsedFlexShrink
      } else {
        // Check if it's a valid value
        const newProp = parseFlex({
          flex: { grow: { type: 'number', value: '1' } },
          valueToCheck: parsedFlexShrink,
          variables,
        })
        if (newProp.shrink) {
          parsedFlex.shrink = newProp.shrink
        }
      }
    }
    if (
      style['flex-basis'] &&
      (styleKeys.indexOf('flex-basis') > styleKeys.indexOf('flex') ||
        invalidValues.length > 0)
    ) {
      const flexBasis = parse({ input: style['flex-basis'] })

      const parsedFlexBasis = parseMultipleValues(getValue(flexBasis[0]))[0]

      // If it's a variable we always return that
      if (
        (isDefined(parsedFlexBasis) &&
          parsedFlexBasis.type === 'function' &&
          parsedFlexBasis.name === 'var') ||
        !style.flex
      ) {
        parsedFlex.basis = parsedFlexBasis
      } else {
        // Check if it's a valid value
        const newProp = parseFlex({
          flex: {},
          valueToCheck: parsedFlexBasis,
          variables,
        })
        if (newProp.basis) {
          parsedFlex.basis = newProp.basis
        }
      }
    }

    // We also want to apply if the shorthand has invalid values and there are no any single properties defined
    const flexProperties = ['grow', 'shrink', 'basis'] as const

    const allPropertiesMissing = flexProperties.every((item) => {
      return !(item in parsedFlex)
    })
    if (invalidValues.length > 0 && allPropertiesMissing) {
      parsedFlex = shorthandFlex

      flexProperties.forEach((key) => {
        if (flexProperties.includes(key) && !parsedFlex[key]) {
          parsedFlex[key] = invalidValues[0]
          invalidValues.shift()
        }
      })
    }

    return parsedFlex
  } else {
    return null
  }
}

const parseFlex = (args: {
  flex: {
    grow?: ParsedValueType
    shrink?: ParsedValueType
    basis?: ParsedValueType
  }
  valueToCheck?: ParsedValueType
  valueToReturn?: ParsedValueType
  variables: CSSStyleToken[]
}) => {
  let grow
  let shrink
  let basis
  let invalidValue

  const valueToCheck = args.valueToCheck
  const flex = args.flex
  const variables = args.variables

  if (!isDefined(valueToCheck)) {
    return {}
  }

  const returnValue = args.valueToReturn ? args.valueToReturn : valueToCheck

  if (valueToCheck.type === 'number') {
    if (!flex.grow) {
      grow = returnValue
    } else if (!flex.shrink) {
      shrink = returnValue
    } else if (valueToCheck.value === '0') {
      basis = returnValue
    }
  } else if (valueToCheck.type === 'function' && valueToCheck.name === 'var') {
    // If it's a variable
    const allValues = valueToCheck.value.split(', ')
    allValues.forEach((val) => {
      if (isVariable(val)) {
        const usedVariable = variables.find((v) =>
          v.name.startsWith('--') ? v.name === val : `--${v.name}` === val,
        )
        if (!usedVariable) {
          return
        }

        const parsedVariable = parseMultipleValues([
          {
            type: 'word',
            value:
              usedVariable.unit &&
              usedVariable.unit !== '' &&
              usedVariable.unit !== ''
                ? `${usedVariable.value}${usedVariable.unit}`
                : usedVariable.value,
          },
        ])
        const newProp = parseFlex({
          flex,
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.grow) {
          grow = returnValue
        } else if (newProp.shrink) {
          shrink = returnValue
        } else if (newProp.basis) {
          basis = returnValue
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        const newProp = parseFlex({
          flex,
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.grow) {
          grow = returnValue
        } else if (newProp.shrink) {
          shrink = returnValue
        } else if (newProp.basis) {
          basis = returnValue
        }
      }
    })
  } else if (
    valueToCheck.type === 'length' ||
    (valueToCheck.type === 'keyword' &&
      ['content', 'min-content', 'max-content', 'auto'].includes(
        valueToCheck.value,
      )) ||
    valueToCheck.type === 'function'
  ) {
    basis = returnValue
  } else {
    invalidValue = returnValue
  }
  return { grow, shrink, basis, invalidValue }
}
