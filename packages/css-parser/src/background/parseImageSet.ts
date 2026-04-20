import { isDefined } from '@nordcraft/core/dist/utils/util'
import { radialGradientShape, radialGradientSize } from '../const'
import {
  getValue,
  isColor,
  isVariable,
  parse,
  parseMultipleValues,
} from '../shared'
import type {
  BackgroundPositionType,
  CSSStyleToken,
  ImagesSetType,
  ParsedImageSetType,
  ParsedValueType,
} from '../types'
import { parseConicGradient } from './parseConicGradient'
import { parseLinearGradient } from './parseLinearGradient'
import { parseRadialGradient } from './parseRadialGradient'

const checkRadialFuncValue = ({
  parsedVariable,
  returnValue,
  position,
  stops,
  variables,
}: {
  parsedVariable: ParsedValueType
  returnValue: ParsedValueType
  position?: BackgroundPositionType
  stops: {
    position?:
      | {
          start?: ParsedValueType
          end?: ParsedValueType
        }
      | undefined
    color?: ParsedValueType
  }[]
  variables: CSSStyleToken[]
}) => {
  const invalidValues: ParsedValueType[] = []
  let newShape: ParsedValueType | undefined
  let newSize: ParsedValueType | undefined
  let newPosition = position
  let newStops = stops

  if (parsedVariable.type === 'keyword') {
    if (radialGradientShape.includes(parsedVariable.value)) {
      newShape = returnValue
    } else if (radialGradientSize.includes(parsedVariable.value)) {
      newSize = returnValue
    } else if (['center'].includes(parsedVariable.value)) {
      if (!newPosition) {
        newPosition = {
          x: { align: returnValue },
          y: { align: returnValue },
        }
      } else {
        if (!newPosition.x?.align) {
          newPosition.x = { ...newPosition.x, align: returnValue }
        } else {
          newPosition.y = { ...newPosition.y, align: returnValue }
        }
      }
    } else if (['top', 'bottom'].includes(parsedVariable.value)) {
      if (!newPosition) {
        newPosition = {
          y: { align: returnValue },
        }
      } else {
        newPosition.y = { ...newPosition.y, align: returnValue }
      }
    } else if (['left', 'right'].includes(parsedVariable.value)) {
      if (!newPosition) {
        newPosition = {
          x: { align: returnValue },
        }
      } else {
        newPosition.x = { ...newPosition.x, align: returnValue }
      }
    } else if (isColor(parsedVariable.value)) {
      // this should be color like red, blue....
      newStops[newStops.length] = {
        ...newStops[newStops.length],
        color: returnValue,
      }
    } else {
      invalidValues.push(returnValue)
    }
  } else if (parsedVariable.type === 'number' && parsedVariable.value === '0') {
    if (newStops.length === 0) {
      if (!newPosition) {
        newPosition = {
          x: { offset: returnValue },
        }
      } else {
        if (!newPosition.x?.offset) {
          newPosition.x = { ...newPosition.x, offset: returnValue }
        } else {
          newPosition.y = { ...newPosition.y, offset: returnValue }
        }
      }
    } else {
      const stopPosition = newStops[newStops.length - 1]?.position ?? {}
      if (stopPosition.start) {
        stopPosition.end = returnValue
      } else {
        stopPosition.start = returnValue
      }
      const index = newStops.length - 1
      if (isDefined(newStops[index])) {
        newStops[index].position = stopPosition
      }
    }
  } else if (parsedVariable.type === 'length') {
    if (newStops.length === 0) {
      if (!newPosition) {
        newPosition = {
          x: { offset: returnValue },
        }
      } else {
        if (!newPosition.x?.offset) {
          newPosition.x = { ...newPosition.x, offset: returnValue }
        } else {
          newPosition.y = { ...newPosition.x, offset: returnValue }
        }
      }
    } else if (parsedVariable.unit === '%') {
      const stopPosition = newStops[newStops.length - 1]?.position ?? {}
      if (stopPosition.start) {
        stopPosition.end = returnValue
      } else {
        stopPosition.start = returnValue
      }
      const index = newStops.length - 1
      if (isDefined(newStops[index])) {
        newStops[index].position = stopPosition
      }
    }
  } else if (parsedVariable.type === 'hex') {
    newStops[newStops.length] = {
      ...newStops[newStops.length],
      color: returnValue,
    }
  } else if (
    parsedVariable.type === 'function' &&
    parsedVariable.name === 'var'
  ) {
    const newProp = checkVariableValueRadial({
      value: parsedVariable,
      stops: newStops,
      variables,
      valueToReturn: returnValue,
    })
    if (newProp.invalidValues.length > 0) {
      invalidValues.push(...newProp.invalidValues)
    } else if (newProp.shape) {
      newShape = newProp.shape
    } else if (newProp.size) {
      newSize = newProp.size
    } else if (newProp.position) {
      newPosition = newProp.position
    } else if (newProp.stops.length > 0) {
      newStops = newProp.stops
    }
  } else if (
    parsedVariable.type === 'function' &&
    isColor(`${parsedVariable.name}(${parsedVariable.value})`)
  ) {
    // this should be the color using functions
    newStops[newStops.length] = {
      ...newStops[newStops.length],
      color: returnValue,
    }
  } else {
    invalidValues.push(returnValue)
  }
  return {
    newShape,
    newSize,
    newPosition,
    newStops,
    invalidValues,
  }
}

const checkVariableValueRadial = (args: {
  value: ParsedValueType
  stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
  }[]
  variables: CSSStyleToken[]
  valueToReturn?: ParsedValueType
}) => {
  const invalidValues: ParsedValueType[] = []
  let shape: ParsedValueType | undefined
  let size: ParsedValueType | undefined
  let position: BackgroundPositionType | undefined
  let newStops = args.stops

  const returnValue = args.valueToReturn ?? args.value
  const allValues =
    args.value.type !== 'functionArguments'
      ? args.value.value.split(', ').map((v) => v.trim())
      : []

  allValues.forEach((val) => {
    if (isVariable(val)) {
      const usedVariable = args.variables.find((v) =>
        v.name.startsWith('--') ? v.name === val : `--${v.name}` === val,
      )
      if (!usedVariable) {
        return
      }

      const parsedUsedVariable =
        usedVariable.unit && usedVariable.unit !== ''
          ? parse({ input: `${usedVariable.value}${usedVariable.unit}` })
          : parse({ input: usedVariable.value })

      const parsedUsedVariableVal = getValue(parsedUsedVariable[0])
      const parsedVariable = parseMultipleValues(parsedUsedVariableVal)[0]
      if (!isDefined(parsedVariable)) {
        return
      }

      const newValues = checkRadialFuncValue({
        parsedVariable,
        returnValue,
        position,
        stops: newStops,
        variables: args.variables,
      })

      shape = newValues.newShape
      size = newValues.newSize
      position = newValues.newPosition
      newStops = newValues.newStops
      invalidValues.push(...newValues.invalidValues)
    } else {
      const parsedVariable = parseMultipleValues([
        { type: 'word', value: val },
      ])[0]
      if (!isDefined(parsedVariable)) {
        return
      }
      const newValues = checkRadialFuncValue({
        parsedVariable,
        returnValue,
        position,
        stops: newStops,
        variables: args.variables,
      })

      shape = newValues.newShape
      size = newValues.newSize
      position = newValues.newPosition
      newStops = newValues.newStops
      invalidValues.push(...newValues.invalidValues)
    }
  })

  return {
    invalidValues,
    shape,
    size,
    position,
    stops: newStops,
  }
}

const checkValue = ({
  valueToCheck,
  returnValue,
  images,
  variables,
}: {
  valueToCheck: ParsedValueType
  returnValue?: ParsedValueType
  images: ImagesSetType[]
  variables: CSSStyleToken[]
}) => {
  let invalidValue: ParsedValueType | undefined
  let imagesSet = structuredClone(images)

  if (valueToCheck.type === 'functionArguments') {
    if (
      valueToCheck.name === 'linear-gradient' ||
      valueToCheck.name === 'repeating-linear-gradient'
    ) {
      const parsedLinearGradient = parseLinearGradient(
        valueToCheck.arguments,
        valueToCheck.name,
        variables,
      )
      imagesSet.push({
        image: {
          type: parsedLinearGradient.type,
          name: parsedLinearGradient.name,
          direction: parsedLinearGradient.direction,
          interpolation: parsedLinearGradient.interpolation,
          stops: parsedLinearGradient.stops,
        },
      })
    } else if (
      valueToCheck.name === 'conic-gradient' ||
      valueToCheck.name === 'repeating-conic-gradient'
    ) {
      const parsedConicGradient = parseConicGradient(
        valueToCheck.arguments,
        valueToCheck.name,
        variables,
      )
      imagesSet.push({
        image: {
          type: parsedConicGradient.type,
          name: parsedConicGradient.name,
          angle: parsedConicGradient.angle,
          position: parsedConicGradient.position,
          interpolation: parsedConicGradient.interpolation,
          stops: parsedConicGradient.stops,
        },
      })
    } else if (
      valueToCheck.name === 'radial-gradient' ||
      valueToCheck.name === 'repeating-radial-gradient'
    ) {
      const parsedRadialGradient = parseRadialGradient(
        valueToCheck.arguments,
        valueToCheck.name,
        variables,
      )
      imagesSet.push({
        image: {
          type: parsedRadialGradient.type,
          name: parsedRadialGradient.name,
          shape: parsedRadialGradient.shape,
          size: parsedRadialGradient.size,
          position: parsedRadialGradient.position,
          interpolation: parsedRadialGradient.interpolation,
          stops: parsedRadialGradient.stops,
        },
      })
    } else if (valueToCheck.name === 'url') {
      if (valueToCheck.arguments[0]?.type === 'string') {
        imagesSet.push({
          image: returnValue ?? {
            type: 'function',
            name: valueToCheck.name,
            value: `${valueToCheck.arguments[0].quote}${valueToCheck.arguments[0].value}${valueToCheck.arguments[0].quote}`,
          },
        })
      }
    } else if (valueToCheck.name === 'type') {
      const lastImageIndex = imagesSet.length - 1

      if (
        isDefined(imagesSet[lastImageIndex]) &&
        valueToCheck.arguments[0]?.type === 'string'
      ) {
        imagesSet[lastImageIndex].type = returnValue ?? {
          type: 'function',
          name: valueToCheck.name,
          value: `${valueToCheck.arguments[0].quote}${valueToCheck.arguments[0].value}${valueToCheck.arguments[0].quote}`,
        }
      }
    } else if (valueToCheck.name === 'var') {
      // If it's a variable
      const allValues = valueToCheck.arguments
      allValues.forEach((value) => {
        if (value.type !== 'functionArguments') {
          const val = value.value
          if (isVariable(val)) {
            const usedVariable = variables.find((v) =>
              v.name.startsWith('--') ? v.name === val : `--${v.name}` === val,
            )
            if (!usedVariable) {
              return
            }

            const parsedUsedVariable =
              usedVariable.unit && usedVariable.unit !== ''
                ? parse({
                    input: `${usedVariable.value}${usedVariable.unit}`,
                  })
                : parse({ input: usedVariable.value })

            const parsedUsedVariableVal = getValue(parsedUsedVariable[0])

            const parsedVariable = parseMultipleValues(parsedUsedVariableVal)[0]

            if (isDefined(parsedVariable)) {
              const valueToReturn = returnValue ?? {
                type: 'function',
                name: 'var',
                value: valueToCheck.arguments
                  .map((a) => {
                    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
                    switch (a.type) {
                      case 'angle':
                      case 'length':
                      case 'time':
                      case 'resolution': {
                        return `${a.value}${a.unit}`
                      }
                      case 'keyword':
                      case 'number':
                      case 'string':
                      case 'hex': {
                        return `${a.value}`
                      }
                      case 'function': {
                        return `${a.name}(${a.value})`
                      }
                      case 'functionArguments': {
                        return ``
                      }
                    }
                  })
                  .join(', '),
              }

              const newProp = checkValue({
                valueToCheck: parsedVariable,
                returnValue: valueToReturn,
                images: imagesSet,
                variables,
              })

              if (newProp.imagesSet.length > 0) {
                imagesSet = newProp.imagesSet
              }
              if (isDefined(newProp.invalidValue)) {
                invalidValue = newProp.invalidValue
              }
            }
          } else {
            const parsedVariable = parseMultipleValues([
              { type: 'word', value: val },
            ])
            if (
              isDefined(parsedVariable[0]) &&
              parsedVariable[0]?.type !== 'functionArguments'
            ) {
              const newProp = checkValue({
                valueToCheck: parsedVariable[0],
                returnValue,
                images: imagesSet,
                variables,
              })
              if (newProp.imagesSet.length > 0) {
                imagesSet = newProp.imagesSet
              }
              if (isDefined(newProp.invalidValue)) {
                invalidValue = newProp.invalidValue
              }
            }
          }
        }
      })
    } else {
      invalidValue = returnValue ?? valueToCheck
    }
  } else {
    const lastImageIndex = imagesSet.length - 1
    if (
      valueToCheck.type === 'resolution' &&
      isDefined(imagesSet[lastImageIndex])
    ) {
      imagesSet[lastImageIndex].resolution = returnValue ?? valueToCheck
    } else if (valueToCheck.type === 'string') {
      imagesSet.push({ image: returnValue ?? valueToCheck })
    } else if (
      valueToCheck.type === 'function' &&
      valueToCheck.name === 'url'
    ) {
      imagesSet.push({ image: returnValue ?? valueToCheck })
    } else {
      invalidValue = returnValue ?? valueToCheck
    }
  }
  return { imagesSet, invalidValue }
}

export const parseImageSet = ({
  parsedValues,
  variables,
}: {
  parsedValues: ParsedValueType[]
  variables: CSSStyleToken[]
}): ParsedImageSetType => {
  let imagesSet: ImagesSetType[] = []
  const invalidValues: ParsedValueType[] = []

  if (parsedValues[0]?.type === 'functionArguments') {
    parsedValues[0].arguments.map((arg) => {
      const value = checkValue({
        valueToCheck: arg,
        images: imagesSet,
        variables,
      })

      if (value.imagesSet.length > 0) {
        imagesSet = value.imagesSet
      }
      if (value.invalidValue) {
        invalidValues.push(value.invalidValue)
      }
    })
  }

  return {
    type: 'image-set-function',
    name: 'image-set',
    imagesSet,
    invalidValues,
  }
}
