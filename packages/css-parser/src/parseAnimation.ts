import { isDefined } from '@nordcraft/core/dist/utils/util'
import {
  checkIfNoUnknownVariables,
  getValue,
  isVariable,
  parse,
  parseMultipleValues,
} from './shared'
import type { Animation, CSSStyleToken, ParsedValueType } from './types'

const animationDirectionValues = [
  'normal',
  'reverse',
  'alternate',
  'alternate-reverse',
]

const easingFunctionsValues = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'step-start',
  'step-end',
]

const playStateValues = ['running', 'paused']

const fillModeValues = ['none', 'forwards', 'backwards', 'both']

export const getParsedAnimation = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  if (
    style.animation ||
    style['animation-duration'] ||
    style['animation-timing-function'] ||
    style['animation-delay'] ||
    style['animation-iteration-count'] ||
    style['animation-direction'] ||
    style['animation-fill-mode'] ||
    style['animation-play-state'] ||
    style['animation-name']
  ) {
    const styleKeys = Object.keys(style)

    const invalidValues: ParsedValueType[][] = []
    const shorthandAnimation: Animation[] = []
    const parsedAnimation: Animation[] = []
    if (style.animation) {
      const animations = parse({
        input: style.animation,
        slashSplit: false,
        whiteSpaceSplit: false,
      })

      // Go through all the animations in the shorthand property
      animations.forEach((animation) => {
        const invVals: ParsedValueType[] = []
        let durationSet = false
        let nameSet = false

        const parsedSingleAnimation: Animation = {}

        const values = getValue(animation)
        const allValues = parseMultipleValues(values)

        const allVariablesKnown = checkIfNoUnknownVariables({
          variables,
          allValues,
        })

        if (allVariablesKnown) {
          // Go through all the values in one background
          allValues.forEach((property) => {
            const newProp = parseAnimation({
              valueToCheck: property,
              durationSet,
              nameSet,
              variables,
            })
            if (newProp.invalidValue) {
              invVals.push(property)
            } else if (newProp.direction) {
              parsedSingleAnimation.direction = newProp.direction
            } else if (newProp.timing) {
              parsedSingleAnimation.timing = newProp.timing
            } else if (newProp.playState) {
              parsedSingleAnimation.playState = newProp.playState
            } else if (newProp.fillMode) {
              parsedSingleAnimation.fillMode = newProp.fillMode
            } else if (newProp.iterationCount) {
              parsedSingleAnimation.iterationCount = newProp.iterationCount
            } else if (newProp.duration) {
              parsedSingleAnimation.duration = newProp.duration
              durationSet = true
            } else if (newProp.delay) {
              parsedSingleAnimation.delay = newProp.delay
            } else if (newProp.name) {
              parsedSingleAnimation.name = newProp.name
              nameSet = true
            }
          })

          shorthandAnimation.push(parsedSingleAnimation)

          // We apply only if no invalid values
          if (invVals.length === 0) {
            parsedAnimation.push(parsedSingleAnimation)
          }
          invalidValues.push(invVals)
        } else {
          // Parse the values by the order
          parsedAnimation.push({
            duration: allValues[0],
            timing: allValues[1],
            delay: allValues[2],
            iterationCount: allValues[3],
            direction: allValues[4],
            fillMode: allValues[5],
            playState: allValues[6],
            name: allValues[7],
          })
        }
      })
    }
    const animationDuration = parse({ input: style['animation-duration'] })
    const animationTimingFunction = parse({
      input: style['animation-timing-function'],
      slashSplit: false,
      whiteSpaceSplit: false,
    })
    const animationDelay = parse({ input: style['animation-delay'] })
    const animationIterationCount = parse({
      input: style['animation-iteration-count'],
    })
    const animationDirection = parse({ input: style['animation-direction'] })
    const animationFillMode = parse({ input: style['animation-fill-mode'] })
    const animationPlayState = parse({ input: style['animation-play-state'] })
    const animationName = parse({ input: style['animation-name'] })

    const animationLength = Math.max(
      animationDuration.length,
      animationTimingFunction.length,
      animationDelay.length,
      animationIterationCount.length,
      animationDirection.length,
      animationFillMode.length,
      animationPlayState.length,
      animationName.length,
    )

    ;[...Array(animationLength).keys()].forEach((index) => {
      if (!isDefined(parsedAnimation[index])) {
        parsedAnimation[index] = {}
      }

      if (
        style['animation-duration'] &&
        (styleKeys.indexOf('animation-duration') >
          styleKeys.indexOf('animation') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        const animationDurationValue = getValue(animationDuration[index])
        const parsedProperty = parseMultipleValues(animationDurationValue)[0]

        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.animation
          ) {
            parsedAnimation[index].duration = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseAnimation({
              variables,
              valueToCheck: parsedProperty,
              durationSet: false,
            })

            if (newProp.duration) {
              parsedAnimation[index].duration = newProp.duration
            }
          }
        }
      }

      if (
        style['animation-timing-function'] &&
        (styleKeys.indexOf('animation-timing-function') >
          styleKeys.indexOf('animation') ||
          (isDefined(invalidValues[index]) && invalidValues[index]?.length > 0))
      ) {
        const animationTimingFunctionValue = getValue(
          animationTimingFunction[index],
        )
        const parsedProperty = parseMultipleValues(
          animationTimingFunctionValue,
        )[0]

        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.animation
          ) {
            parsedAnimation[index].timing = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseAnimation({
              variables,
              valueToCheck: parsedProperty,
              durationSet: false,
            })

            if (newProp.timing) {
              parsedAnimation[index].timing = newProp.timing
            }
          }
        }
      }

      if (
        style['animation-delay'] &&
        (styleKeys.indexOf('animation-delay') >
          styleKeys.indexOf('animation') ||
          (isDefined(invalidValues[index]) && invalidValues[index]?.length > 0))
      ) {
        const animationDelayValue = getValue(animationDelay[index])
        const parsedProperty = parseMultipleValues(animationDelayValue)[0]

        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.animation
          ) {
            parsedAnimation[index].delay = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseAnimation({
              variables,
              valueToCheck: parsedProperty,
              durationSet: true,
            })

            if (newProp.delay) {
              parsedAnimation[index].delay = newProp.delay
            }
          }
        }
      }

      if (
        style['animation-iteration-count'] &&
        (styleKeys.indexOf('animation-iteration-count') >
          styleKeys.indexOf('animation') ||
          (isDefined(invalidValues[index]) && invalidValues[index]?.length > 0))
      ) {
        const animationIterationCountValue = getValue(
          animationIterationCount[index],
        )
        const parsedProperty = parseMultipleValues(
          animationIterationCountValue,
        )[0]

        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.animation
          ) {
            parsedAnimation[index].iterationCount = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseAnimation({
              variables,
              valueToCheck: parsedProperty,
              durationSet: false,
            })

            if (newProp.iterationCount) {
              parsedAnimation[index].iterationCount = newProp.iterationCount
            }
          }
        }
      }

      if (
        style['animation-direction'] &&
        (styleKeys.indexOf('animation-direction') >
          styleKeys.indexOf('animation') ||
          (isDefined(invalidValues[index]) && invalidValues[index]?.length > 0))
      ) {
        const animationDirectionValue = getValue(animationDirection[index])

        const parsedProperty = parseMultipleValues(animationDirectionValue)[0]

        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.animation
          ) {
            parsedAnimation[index].direction = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseAnimation({
              variables,
              valueToCheck: parsedProperty,
              durationSet: false,
            })

            if (newProp.direction) {
              parsedAnimation[index].direction = newProp.direction
            }
          }
        }
      }

      if (
        style['animation-fill-mode'] &&
        (styleKeys.indexOf('animation-fill-mode') >
          styleKeys.indexOf('animation') ||
          (isDefined(invalidValues[index]) && invalidValues[index]?.length > 0))
      ) {
        const animationFillModeValue = getValue(animationFillMode[index])

        const parsedProperty = parseMultipleValues(animationFillModeValue)[0]

        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.animation
          ) {
            parsedAnimation[index].fillMode = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseAnimation({
              variables,
              valueToCheck: parsedProperty,
              durationSet: false,
            })

            if (newProp.fillMode) {
              parsedAnimation[index].fillMode = newProp.fillMode
            }
          }
        }
      }

      if (
        style['animation-play-state'] &&
        (styleKeys.indexOf('animation-play-state') >
          styleKeys.indexOf('animation') ||
          (isDefined(invalidValues[index]) && invalidValues[index]?.length > 0))
      ) {
        const animationPlayStateValue = getValue(animationPlayState[index])

        const parsedProperty = parseMultipleValues(animationPlayStateValue)[0]

        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.animation
          ) {
            parsedAnimation[index].playState = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseAnimation({
              variables,
              valueToCheck: parsedProperty,
              durationSet: false,
            })

            if (newProp.playState) {
              parsedAnimation[index].playState = newProp.playState
            }
          }
        }
      }

      if (
        style['animation-name'] &&
        (styleKeys.indexOf('animation-name') > styleKeys.indexOf('animation') ||
          (isDefined(invalidValues[index]) && invalidValues[index]?.length > 0))
      ) {
        const animationNameValue = getValue(animationName[index])

        const parsedProperty = parseMultipleValues(animationNameValue)[0]

        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.animation
          ) {
            parsedAnimation[index].name = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseAnimation({
              variables,
              valueToCheck: parsedProperty,
              durationSet: false,
            })

            if (newProp.name) {
              parsedAnimation[index].name = newProp.name
            }
          }
        }
      }
    })
    // We also want to apply if the shorthand has invalid values and there are no any single properties defined
    const animationProperties = [
      'duration',
      'timing',
      'delay',
      'iterationCount',
      'direction',
      'fillMode',
      'playState',
      'name',
    ] as const

    invalidValues.forEach((iv, index) => {
      if (iv.length > 0 && !isDefined(parsedAnimation[index])) {
        parsedAnimation[index] = shorthandAnimation[index] ?? {}

        animationProperties.forEach((key) => {
          if (
            isDefined(parsedAnimation[index]) &&
            !isDefined(parsedAnimation[index][key])
          ) {
            parsedAnimation[index][key] = iv[0]
            iv.shift()
          }
        })
      }
    })
    return parsedAnimation
  } else {
    return null
  }
}

const parseAnimation = ({
  valueToCheck,
  valueToReturn,
  durationSet,
  nameSet = false,
  variables,
}: {
  valueToCheck?: ParsedValueType
  valueToReturn?: ParsedValueType
  durationSet: boolean
  nameSet?: boolean
  variables: CSSStyleToken[]
}) => {
  if (!isDefined(valueToCheck)) {
    return {}
  }

  let direction
  let timing
  let playState
  let fillMode
  let iterationCount
  let duration
  let delay
  let name

  let invalidValue

  const returnValue = valueToReturn ? valueToReturn : valueToCheck

  if (
    valueToCheck.type === 'keyword' &&
    animationDirectionValues.includes(valueToCheck.value)
  ) {
    direction = returnValue
  } else if (
    (valueToCheck.type === 'keyword' &&
      easingFunctionsValues.includes(valueToCheck.value)) ||
    (valueToCheck.type === 'function' &&
      ['cubic-bezier', 'steps', 'linear'].includes(valueToCheck.name))
  ) {
    timing = returnValue
  } else if (
    valueToCheck.type === 'keyword' &&
    playStateValues.includes(valueToCheck.value)
  ) {
    playState = returnValue
  } else if (
    valueToCheck.type === 'keyword' &&
    fillModeValues.includes(valueToCheck.value)
  ) {
    fillMode = returnValue
  } else if (
    (valueToCheck.type === 'keyword' && valueToCheck.value === 'infinite') ||
    valueToCheck.type === 'number'
  ) {
    iterationCount = returnValue
  } else if (valueToCheck.type === 'time' && !durationSet) {
    duration = returnValue
  } else if (valueToCheck.type === 'time' && durationSet) {
    delay = returnValue
  } else if (valueToCheck.type === 'keyword' && !nameSet) {
    name = returnValue
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
        const newProp = parseAnimation({
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          durationSet,
          nameSet,
          variables,
        })

        if (newProp.direction) {
          direction = returnValue
        } else if (newProp.timing) {
          timing = returnValue
        } else if (newProp.playState) {
          playState = returnValue
        } else if (newProp.fillMode) {
          fillMode = returnValue
        } else if (newProp.iterationCount) {
          iterationCount = returnValue
        } else if (newProp.duration) {
          duration = returnValue
        } else if (newProp.delay) {
          delay = returnValue
        } else if (newProp.name) {
          name = true
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        const newProp = parseAnimation({
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          durationSet,
          nameSet,
          variables,
        })

        if (newProp.direction) {
          direction = returnValue
        } else if (newProp.timing) {
          timing = returnValue
        } else if (newProp.playState) {
          playState = returnValue
        } else if (newProp.fillMode) {
          fillMode = returnValue
        } else if (newProp.iterationCount) {
          iterationCount = returnValue
        } else if (newProp.duration) {
          duration = returnValue
        } else if (newProp.delay) {
          delay = returnValue
        } else if (newProp.name) {
          name = true
        }
      }
    })
  } else {
    invalidValue = true
  }
  return {
    direction,
    timing,
    playState,
    fillMode,
    iterationCount,
    duration,
    delay,
    name,
    invalidValue,
  }
}
