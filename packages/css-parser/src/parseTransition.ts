import { isDefined } from '@nordcraft/core/dist/utils/util'
import { timingFunctions } from './const'
import {
  checkIfNoUnknownVariables,
  getValue,
  isVariable,
  parse,
  parseMultipleValues,
} from './shared'
import type { CSSStyleToken, ParsedValueType } from './types'

interface transitionArguments {
  variables: CSSStyleToken[]
  transition: {
    duration?: ParsedValueType
    delay?: ParsedValueType
    property?: ParsedValueType
    timing?: ParsedValueType
    behavior?: ParsedValueType
  }
  valueToCheck?: ParsedValueType
  valueToReturn?: ParsedValueType
}
export const parseTransition = (args: transitionArguments) => {
  const variables = args.variables
  const transition = args.transition
  const valueToCheck = args.valueToCheck
  const valueToReturn = args.valueToReturn

  if (!isDefined(valueToCheck)) {
    return {}
  }

  let duration
  let delay
  let property
  let timing
  let behavior
  let invalidValue

  const returnValue = valueToReturn ? valueToReturn : valueToCheck

  if (valueToCheck.type === 'time' && !transition.duration) {
    duration = returnValue
  } else if (valueToCheck.type === 'time' && !transition.delay) {
    delay = returnValue
  } else if (
    valueToCheck.type === 'keyword' &&
    ['normal', 'allow-discrete'].includes(valueToCheck.value) &&
    !transition.behavior
  ) {
    behavior = returnValue
  } else if (
    (valueToCheck.type === 'keyword' &&
      timingFunctions.includes(valueToCheck.value)) ||
    (valueToCheck.type === 'function' &&
      ['cubic-bezier', 'steps', 'linear'].includes(valueToCheck.name) &&
      !transition.timing)
  ) {
    timing = returnValue
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
        const newProp = parseTransition({
          variables,
          transition,
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
        })

        if (newProp.duration) {
          duration = returnValue
        } else if (newProp.delay) {
          delay = returnValue
        } else if (newProp.property) {
          property = returnValue
        } else if (newProp.timing) {
          timing = returnValue
        } else if (newProp.behavior) {
          behavior = returnValue
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        const newProp = parseTransition({
          variables,
          transition,
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
        })

        if (newProp.duration) {
          duration = returnValue
        } else if (newProp.delay) {
          delay = returnValue
        } else if (newProp.property) {
          property = returnValue
        } else if (newProp.timing) {
          timing = returnValue
        } else if (newProp.behavior) {
          behavior = returnValue
        }
      }
    })
  } else if (valueToCheck.type === 'keyword' && !transition.property) {
    property = returnValue
  } else {
    invalidValue = true
  }
  return { duration, delay, property, timing, behavior, invalidValue }
}

export const getParsedTransition = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  const styleKeys = Object.keys(style)
  // Transition
  if (
    style['transition-duration'] ||
    style['transition-delay'] ||
    style['transition-property'] ||
    style['transition-timing-function'] ||
    style['transition-behavior'] ||
    style.transition
  ) {
    let parsedTransition: {
      duration?: ParsedValueType
      delay?: ParsedValueType
      property?: ParsedValueType
      timing?: ParsedValueType
      behavior?: ParsedValueType
    }[] = []

    const invalidValues: ParsedValueType[][] = []
    const shorthandTransition: {
      duration?: ParsedValueType
      delay?: ParsedValueType
      property?: ParsedValueType
      timing?: ParsedValueType
      behavior?: ParsedValueType
    }[] = []

    if (style.transition) {
      const transitions = parse({
        input: style.transition,
        whiteSpaceSplit: false,
      })

      parsedTransition = transitions.map((t) => {
        const invVals: ParsedValueType[] = []
        const transition: {
          duration?: ParsedValueType
          delay?: ParsedValueType
          property?: ParsedValueType
          timing?: ParsedValueType
          behavior?: ParsedValueType
        } = {}

        const values = getValue(t)
        const allValues = parseMultipleValues(values)
        const allVariablesKnown = checkIfNoUnknownVariables({
          variables,
          allValues,
        })

        if (allVariablesKnown) {
          // Go through all the values in the transition property
          allValues.forEach((pv: any) => {
            const newProp = parseTransition({
              variables,
              transition,
              valueToCheck: pv,
            })
            if (newProp.invalidValue) {
              invVals.push(pv)
            } else if (newProp.duration) {
              transition.duration = newProp.duration
            } else if (newProp.delay) {
              transition.delay = newProp.delay
            } else if (newProp.property) {
              transition.property = newProp.property
            } else if (newProp.timing) {
              transition.timing = newProp.timing
            } else if (newProp.behavior) {
              transition.behavior = newProp.behavior
            }
          })

          shorthandTransition.push(transition)

          // We apply only if no invalid values
          if (invVals.length === 0) {
            return transition
          } else {
            invalidValues.push(invVals)
            return {}
          }
        } else {
          // Parse the values by the order
          return {
            property: allValues[0],
            duration: allValues[1],
            timing: allValues[2],
            delay: allValues[3],
            behavior: allValues[4],
          }
        }
      })
    }

    const transitionDuration = parse({ input: style['transition-duration'] })
    const transitionDelay = parse({ input: style['transition-delay'] })
    const transitionProperty = parse({ input: style['transition-property'] })
    const transitionTimingFunction = parse({
      input: style['transition-timing-function'],
    })
    const transitionBehavior = parse({ input: style['transition-behavior'] })

    const transLength = Math.max(
      transitionBehavior.length,
      transitionDelay.length,
      transitionDuration.length,
      transitionProperty.length,
      transitionTimingFunction.length,
    )

    ;[...Array(transLength).keys()].map((index) => {
      if (!parsedTransition[index]) {
        parsedTransition[index] = {}
      }

      if (
        style['transition-property'] &&
        (styleKeys.indexOf('transition-property') >
          styleKeys.indexOf('transition') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        if (getValue(transitionProperty[index])) {
          const parsedProperty = parseMultipleValues(
            getValue(transitionProperty[index]),
          )[0]

          // If it's a variable we always return that
          if (
            (parsedProperty?.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.transition
          ) {
            parsedTransition[index].property = parsedProperty
          } else {
            // Check if it's a valid value
            const newProp = parseTransition({
              variables,
              transition: parsedTransition[index],
              valueToCheck: parsedProperty,
            })

            if (newProp.property) {
              parsedTransition[index].property = newProp.property
            }
          }
        }
      }

      if (
        style['transition-duration'] &&
        (styleKeys.indexOf('transition-duration') >
          styleKeys.indexOf('transition') ||
          (invalidValues[index] && invalidValues[index].length > 0))
      ) {
        if (getValue(transitionDuration[index])) {
          const parsedDuration = parseMultipleValues(
            getValue(transitionDuration[index]),
          )[0]

          // If it's a variable we always return that
          if (
            (parsedDuration?.type === 'function' &&
              parsedDuration.name === 'var') ||
            !style.transition
          ) {
            parsedTransition[index].duration = parsedDuration
          } else {
            // Check if it's a valid value
            const newProp = parseTransition({
              variables,
              transition: parsedTransition[index],
              valueToCheck: parsedDuration,
            })

            if (newProp.duration) {
              parsedTransition[index].duration = newProp.duration
            }
          }
        }
      }

      if (
        style['transition-delay'] &&
        (styleKeys.indexOf('transition-delay') >
          styleKeys.indexOf('transition') ||
          (invalidValues[index] && invalidValues[index].length > 0))
      ) {
        if (getValue(transitionDelay[index])) {
          const parsedDelay = parseMultipleValues(
            getValue(transitionDelay[index]),
          )[0]

          // If it's a variable we always return that
          if (
            (parsedDelay?.type === 'function' && parsedDelay.name === 'var') ||
            !style.transition
          ) {
            parsedTransition[index].delay = parsedDelay
          } else {
            // Check if it's a valid value
            const newProp = parseTransition({
              variables,
              transition: parsedTransition[index],
              valueToCheck: parsedDelay,
            })

            if (newProp.delay) {
              parsedTransition[index].delay = newProp.delay
            }
          }
        }
      }

      if (
        style['transition-timing-function'] &&
        (styleKeys.indexOf('transition-timing-function') >
          styleKeys.indexOf('transition') ||
          (invalidValues[index] && invalidValues[index].length > 0))
      ) {
        if (getValue(transitionTimingFunction[index])) {
          const parsedTiming = parseMultipleValues(
            getValue(transitionTimingFunction[index]),
          )[0]

          // If it's a variable we always return that
          if (
            (parsedTiming?.type === 'function' &&
              parsedTiming.name === 'var') ||
            !style.transition
          ) {
            parsedTransition[index].timing = parsedTiming
          } else {
            // Check if it's a valid value
            const newProp = parseTransition({
              variables,
              transition: parsedTransition[index],
              valueToCheck: parsedTiming,
            })

            if (newProp.timing) {
              parsedTransition[index].timing = newProp.timing
            }
          }
        }
      }

      if (
        style['transition-behavior'] &&
        (styleKeys.indexOf('transition-behavior') >
          styleKeys.indexOf('transition') ||
          (invalidValues[index] && invalidValues[index].length > 0))
      ) {
        if (getValue(transitionBehavior[index])) {
          const parsedBehavior = parseMultipleValues(
            getValue(transitionBehavior[index]),
          )[0]

          // If it's a variable we always return that
          if (
            (parsedBehavior?.type === 'function' &&
              parsedBehavior.name === 'var') ||
            !style.transition
          ) {
            parsedTransition[index].behavior = parsedBehavior
          } else {
            // Check if it's a valid value
            const newProp = parseTransition({
              variables,
              transition: parsedTransition[index],
              valueToCheck: parsedBehavior,
            })

            if (newProp.behavior) {
              parsedTransition[index].behavior = newProp.behavior
            }
          }
        }
      }
    })

    const transitionProperties = [
      'duration',
      'delay',
      'property',
      'timing',
      'behavior',
    ] as const

    invalidValues.forEach((iv, index) => {
      if (isDefined(parsedTransition[index])) {
        const allPropertiesMissing = transitionProperties.every(
          (item) => !(item in (parsedTransition[index] ?? [])),
        )
        if (iv.length > 0 && allPropertiesMissing) {
          parsedTransition[index] = shorthandTransition[index] ?? {}

          transitionProperties.forEach((key) => {
            if (
              transitionProperties.includes(key) &&
              isDefined(parsedTransition[index]) &&
              !isDefined(parsedTransition[index]?.[key])
            ) {
              parsedTransition[index][key] = iv[0]
              iv.shift()
            }
          })
        }
      }
    })
    return parsedTransition
  } else {
    return null
  }
}
