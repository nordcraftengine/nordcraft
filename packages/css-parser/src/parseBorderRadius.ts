import { isDefined } from '@nordcraft/core/dist/utils/util'
import {
  checkIfNoUnknownVariables,
  getValue,
  isVariable,
  parse,
  parseMultipleValues,
} from './shared'
import type {
  CSSStyleToken,
  ParsedBorderRadius,
  ParsedValueType,
} from './types'

export const getParsedBorderRadius = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  const styleKeys = Object.keys(style)

  if (
    style['border-top-left-radius'] ||
    style['border-top-right-radius'] ||
    style['border-bottom-left-radius'] ||
    style['border-bottom-right-radius'] ||
    style['border-radius']
  ) {
    let parsedBorderRadius: ParsedBorderRadius = {}
    const invalidHorizontalValues: ParsedValueType[] = []
    const invalidVerticalValues: ParsedValueType[] = []

    const horizontalValues: ParsedValueType[] = []
    const verticalValues: ParsedValueType[] = []

    if (style['border-radius']) {
      const borderRadius = parse({
        input: style['border-radius'],
        slashSplit: false,
      })

      let horizontalSet = false

      const values = getValue(borderRadius[0])
      const allValues = parseMultipleValues(values)

      const allVariablesKnown = checkIfNoUnknownVariables({
        variables,
        allValues,
      })
      if (allVariablesKnown) {
        // Go through all the values in the border radius property
        allValues.forEach((value) => {
          const newProp = parseBorderRadius({
            valueToCheck: value,
            horizontalSet,
            variables,
          })

          if (newProp.invalidValue) {
            if (!horizontalSet) {
              invalidHorizontalValues.push(value)
            } else {
              invalidVerticalValues.push(value)
            }
          }
          if (newProp.horizontalValue) {
            horizontalValues.push(newProp.horizontalValue)
          }
          if (newProp.verticalValue) {
            verticalValues.push(newProp.verticalValue)
          }
          if (newProp.horizontalSet) {
            horizontalSet = newProp.horizontalSet
          }
        })

        // We apply only if no invalid values
        if (
          invalidHorizontalValues.length === 0 ||
          invalidVerticalValues.length === 0
        ) {
          parsedBorderRadius = {
            topLeft: {
              horizontal: horizontalValues[0],
              vertical: verticalValues[0],
            },
            topRight: {
              horizontal: horizontalValues[1] ?? horizontalValues[0],
              vertical: verticalValues[1] ?? verticalValues[0],
            },
            bottomLeft: {
              horizontal:
                horizontalValues.length === 4
                  ? horizontalValues[3]
                  : horizontalValues.length === 1
                    ? horizontalValues[0]
                    : horizontalValues[1],
              vertical:
                verticalValues.length === 4
                  ? verticalValues[3]
                  : verticalValues.length === 1
                    ? verticalValues[0]
                    : verticalValues[1],
            },
            bottomRight: {
              horizontal:
                horizontalValues.length > 2
                  ? horizontalValues[2]
                  : horizontalValues[0],
              vertical:
                verticalValues.length > 2
                  ? verticalValues[2]
                  : verticalValues[0],
            },
          }
        }
      } else {
        const slashItemIndex = allValues.findIndex((v) => v.type === 'slash')

        const horizontalValues =
          slashItemIndex > -1 ? allValues.slice(0, slashItemIndex) : allValues
        const verticalValues =
          slashItemIndex > -1
            ? allValues.slice(slashItemIndex + 1, allValues.length)
            : []

        // Parse the values by the order
        parsedBorderRadius = {
          topLeft: {
            horizontal: horizontalValues[0],
            vertical: verticalValues[0],
          },
          topRight: {
            horizontal: horizontalValues[1] ?? horizontalValues[0],
            vertical: verticalValues[1] ?? verticalValues[0],
          },
          bottomLeft: {
            horizontal:
              horizontalValues.length === 4
                ? horizontalValues[3]
                : horizontalValues.length === 1
                  ? horizontalValues[0]
                  : horizontalValues[1],
            vertical:
              verticalValues.length === 4
                ? verticalValues[3]
                : verticalValues.length === 1
                  ? verticalValues[0]
                  : verticalValues[1],
          },
          bottomRight: {
            horizontal:
              horizontalValues.length > 2
                ? horizontalValues[2]
                : horizontalValues[0],
            vertical:
              verticalValues.length > 2 ? verticalValues[2] : verticalValues[0],
          },
        }
      }
    }

    if (
      style['border-top-left-radius'] &&
      (styleKeys.indexOf('border-top-left-radius') >
        styleKeys.indexOf('border-radius') ||
        invalidHorizontalValues.length > 0 ||
        invalidVerticalValues.length > 0)
    ) {
      if (!parsedBorderRadius.topLeft) {
        parsedBorderRadius.topLeft = {}
      }
      const borderTopLeftRadius = parse({
        input: style['border-top-left-radius'],
      })
      const parsedValue = parseMultipleValues(getValue(borderTopLeftRadius[0]))
      // If it's a variable we always return that
      if (
        (parsedValue[0]?.type === 'function' &&
          parsedValue[0]?.name === 'var') ||
        !style['border-radius']
      ) {
        parsedBorderRadius.topLeft.horizontal = parsedValue[0]
      } else {
        // Check if it's a valid value
        const newProp = parseBorderRadius({
          valueToCheck: parsedValue[0],
          variables,
          horizontalSet: false,
        })

        if (newProp.horizontalValue) {
          parsedBorderRadius.topLeft.horizontal = newProp.horizontalValue
        }
      }
      // If it's a variable we always return that
      if (
        (parsedValue[1]?.type === 'function' &&
          parsedValue[1]?.name === 'var') ||
        !style['border-radius']
      ) {
        parsedBorderRadius.topLeft.vertical = parsedValue[1]
      } else {
        // Check if it's a valid value
        const newProp = parseBorderRadius({
          valueToCheck: parsedValue[0],
          variables,
          horizontalSet: true,
        })

        if (newProp.horizontalValue) {
          parsedBorderRadius.topLeft.vertical = newProp.horizontalValue
        }
      }
    }
    if (
      style['border-top-right-radius'] &&
      (styleKeys.indexOf('border-top-right-radius') >
        styleKeys.indexOf('border-radius') ||
        invalidHorizontalValues.length > 0 ||
        invalidVerticalValues.length > 0)
    ) {
      if (!parsedBorderRadius.topRight) {
        parsedBorderRadius.topRight = {}
      }
      const borderTopRightRadius = parse({
        input: style['border-top-right-radius'],
      })
      const parsedValue = parseMultipleValues(getValue(borderTopRightRadius[0]))
      // If it's a variable we always return that
      if (
        (parsedValue[0]?.type === 'function' &&
          parsedValue[0]?.name === 'var') ||
        !style['border-radius']
      ) {
        parsedBorderRadius.topRight.horizontal = parsedValue[0]
      } else {
        // Check if it's a valid value
        const newProp = parseBorderRadius({
          valueToCheck: parsedValue[0],
          variables,
          horizontalSet: false,
        })

        if (newProp.horizontalValue) {
          parsedBorderRadius.topRight.horizontal = newProp.horizontalValue
        }
      }
      // If it's a variable we always return that
      if (
        (parsedValue[1]?.type === 'function' &&
          parsedValue[1]?.name === 'var') ||
        !style['border-radius']
      ) {
        parsedBorderRadius.topRight.vertical = parsedValue[1]
      } else {
        // Check if it's a valid value
        const newProp = parseBorderRadius({
          valueToCheck: parsedValue[0],
          variables,
          horizontalSet: true,
        })

        if (newProp.horizontalValue) {
          parsedBorderRadius.topRight.vertical = newProp.horizontalValue
        }
      }
    }
    if (
      style['border-bottom-left-radius'] &&
      (styleKeys.indexOf('border-bottom-left-radius') >
        styleKeys.indexOf('border-radius') ||
        invalidHorizontalValues.length > 0 ||
        invalidVerticalValues.length > 0)
    ) {
      if (!parsedBorderRadius.bottomLeft) {
        parsedBorderRadius.bottomLeft = {}
      }
      const borderBottomLeftRadius = parse({
        input: style['border-bottom-left-radius'],
      })
      const parsedValue = parseMultipleValues(
        getValue(borderBottomLeftRadius[0]),
      )
      // If it's a variable we always return that
      if (
        (parsedValue[0]?.type === 'function' &&
          parsedValue[0]?.name === 'var') ||
        !style['border-radius']
      ) {
        parsedBorderRadius.bottomLeft.horizontal = parsedValue[0]
      } else {
        // Check if it's a valid value
        const newProp = parseBorderRadius({
          valueToCheck: parsedValue[0],
          variables,
          horizontalSet: false,
        })

        if (newProp.horizontalValue) {
          parsedBorderRadius.bottomLeft.horizontal = newProp.horizontalValue
        }
      }
      // If it's a variable we always return that
      if (
        (parsedValue[1]?.type === 'function' &&
          parsedValue[1]?.name === 'var') ||
        !style['border-radius']
      ) {
        parsedBorderRadius.bottomLeft.vertical = parsedValue[1]
      } else {
        // Check if it's a valid value
        const newProp = parseBorderRadius({
          valueToCheck: parsedValue[0],
          variables,
          horizontalSet: true,
        })

        if (newProp.horizontalValue) {
          parsedBorderRadius.bottomLeft.vertical = newProp.horizontalValue
        }
      }
    }
    if (
      style['border-bottom-right-radius'] &&
      (styleKeys.indexOf('border-bottom-right-radius') >
        styleKeys.indexOf('border-radius') ||
        invalidHorizontalValues.length > 0 ||
        invalidVerticalValues.length > 0)
    ) {
      if (!parsedBorderRadius.bottomRight) {
        parsedBorderRadius.bottomRight = {}
      }
      const borderBottomRightRadius = parse({
        input: style['border-bottom-right-radius'],
      })
      const parsedValue = parseMultipleValues(
        getValue(borderBottomRightRadius[0]),
      )
      // If it's a variable we always return that
      if (
        (parsedValue[0]?.type === 'function' &&
          parsedValue[0]?.name === 'var') ||
        !style['border-radius']
      ) {
        parsedBorderRadius.bottomRight.horizontal = parsedValue[0]
      } else {
        // Check if it's a valid value
        const newProp = parseBorderRadius({
          valueToCheck: parsedValue[0],
          variables,
          horizontalSet: false,
        })

        if (newProp.horizontalValue) {
          parsedBorderRadius.bottomRight.horizontal = newProp.horizontalValue
        }
      }
      // If it's a variable we always return that
      if (
        (parsedValue[1]?.type === 'function' &&
          parsedValue[1]?.name === 'var') ||
        !style['border-radius']
      ) {
        parsedBorderRadius.bottomRight.vertical = parsedValue[1]
      } else {
        // Check if it's a valid value
        const newProp = parseBorderRadius({
          valueToCheck: parsedValue[0],
          variables,
          horizontalSet: true,
        })

        if (newProp.horizontalValue) {
          parsedBorderRadius.bottomRight.vertical = newProp.horizontalValue
        }
      }
    }
    // We also want to apply if the shorthand has invalid values and there are no any single properties defined
    if (
      (invalidHorizontalValues.length > 0 ||
        invalidVerticalValues.length > 0) &&
      !isDefined(parsedBorderRadius.topLeft?.horizontal) &&
      !isDefined(parsedBorderRadius.topLeft?.vertical) &&
      !isDefined(parsedBorderRadius.topRight?.horizontal) &&
      !isDefined(parsedBorderRadius.topRight?.vertical) &&
      !isDefined(parsedBorderRadius.bottomLeft?.horizontal) &&
      !isDefined(parsedBorderRadius.bottomLeft?.vertical) &&
      !isDefined(parsedBorderRadius.bottomRight?.horizontal) &&
      !isDefined(parsedBorderRadius.bottomRight?.vertical)
    ) {
      const horizontalValidInvalid = [
        ...horizontalValues,
        ...invalidHorizontalValues,
      ]
      const verticalValidInvalid = [...verticalValues, ...invalidVerticalValues]

      parsedBorderRadius = {
        topLeft: {
          horizontal: horizontalValidInvalid[0],
          vertical: verticalValidInvalid[0],
        },
        topRight: {
          horizontal: horizontalValidInvalid[1] ?? horizontalValidInvalid[0],
          vertical: verticalValidInvalid[1] ?? verticalValidInvalid[0],
        },
        bottomLeft: {
          horizontal:
            horizontalValidInvalid.length === 4
              ? horizontalValidInvalid[3]
              : horizontalValidInvalid.length === 1
                ? horizontalValidInvalid[0]
                : horizontalValidInvalid[1],
          vertical:
            verticalValidInvalid.length === 4
              ? verticalValidInvalid[3]
              : verticalValidInvalid.length === 1
                ? verticalValidInvalid[0]
                : verticalValidInvalid[1],
        },
        bottomRight: {
          horizontal:
            horizontalValidInvalid.length > 2
              ? horizontalValidInvalid[2]
              : horizontalValidInvalid[0],
          vertical:
            verticalValidInvalid.length > 2
              ? verticalValidInvalid[2]
              : verticalValidInvalid[0],
        },
      }
    }
    return parsedBorderRadius
  } else {
    return null
  }
}

const parseBorderRadius = (args: {
  valueToCheck?: ParsedValueType
  horizontalSet: boolean
  valueToReturn?: ParsedValueType
  variables: CSSStyleToken[]
}) => {
  let horizontalValue
  let verticalValue
  let invalidValue

  const valueToCheck = args.valueToCheck
  const horizontalSet = args.horizontalSet
  const variables = args.variables
  let newHorizontalSet = horizontalSet

  if (!isDefined(valueToCheck)) {
    return {}
  }

  const returnValue = args.valueToReturn ? args.valueToReturn : valueToCheck

  if (valueToCheck.type === 'length' && !horizontalSet) {
    horizontalValue = returnValue
  } else if (valueToCheck.type === 'length' && horizontalSet) {
    verticalValue = returnValue
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
              usedVariable.unit && usedVariable.unit !== ''
                ? `${usedVariable.value}${usedVariable.unit}`
                : usedVariable.value,
          },
        ])
        const newProp = parseBorderRadius({
          valueToCheck: parsedVariable[0],
          horizontalSet,
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.horizontalValue) {
          horizontalValue = returnValue
        } else if (newProp.verticalValue) {
          verticalValue = returnValue
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        const newProp = parseBorderRadius({
          valueToCheck: parsedVariable[0],
          horizontalSet,
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.horizontalValue) {
          horizontalValue = returnValue
        } else if (newProp.verticalValue) {
          verticalValue = returnValue
        }
      }
    })
  } else if (valueToCheck.type === 'slash') {
    // Flag that the horizontal values are set
    newHorizontalSet = true
  } else {
    // Flag that the horizontal values are set
    invalidValue = true
  }
  return {
    horizontalValue,
    verticalValue,
    horizontalSet: newHorizontalSet,
    invalidValue,
  }
}
