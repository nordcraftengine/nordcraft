import { isDefined } from '@nordcraft/core/dist/utils/util'
import {
  attachmentBg,
  colorFunction,
  imageBg,
  positionBg,
  repeatStyle,
  sizeBg,
  visualBoxBg,
} from '../const'
import {
  checkIfNoUnknownVariables,
  getValue,
  isColor,
  isVariable,
  parse,
  parseMultipleValues,
} from '../shared'
import type {
  CSSStyleToken,
  ParsedConicGradientType,
  ParsedImageSetType,
  ParsedImageType,
  ParsedLinearGradientType,
  ParsedRadialGradientType,
  ParsedValueType,
} from '../types'
import { getParsedValue } from './shared'

interface backgroundArguments {
  variables: CSSStyleToken[]
  image: Omit<ParsedImageType, 'image'> & {
    image?:
      | Omit<ParsedConicGradientType, 'invalidValues'>
      | Omit<ParsedLinearGradientType, 'invalidValues'>
      | Omit<ParsedRadialGradientType, 'invalidValues'>
      | Omit<ParsedImageSetType, 'invalidValues'>
      | ParsedValueType
  }
  valueToCheck?: Exclude<
    ParsedValueType,
    {
      type: 'functionArguments'
      name: string
      arguments: ParsedValueType[]
    }
  >
  positionSet: boolean
  valueToReturn?: Exclude<
    ParsedValueType,
    {
      type: 'functionArguments'
      name: string
      arguments: ParsedValueType[]
    }
  >
}

const parseBackground = (args: backgroundArguments) => {
  const variables = args.variables
  let image = args.image
  const valueToCheck = args.valueToCheck
  let positionSet = args.positionSet
  const valueToReturn = args.valueToReturn

  if (!isDefined(valueToCheck)) {
    return {}
  }

  let color
  let invalidValue = false
  const returnValue = valueToReturn ? valueToReturn : valueToCheck

  // Background image
  if (
    (valueToCheck.type === 'function' && imageBg.includes(valueToCheck.name)) ||
    valueToCheck.value === 'none'
  ) {
    image.image = returnValue
  } else if (positionBg.includes(valueToCheck.value) && !positionSet) {
    // Background position
    if (
      ['left', 'right', 'center'].includes(valueToCheck.value) &&
      !isDefined(image.position?.x?.align)
    ) {
      if (!isDefined(image.position)) {
        image.position = {}
      }
      if (!isDefined(image.position.x)) {
        image.position.x = {}
      }
      image.position.x.align = returnValue
    } else if (
      ['top', 'bottom', 'center'].includes(valueToCheck.value) &&
      !isDefined(image.position?.y?.align)
    ) {
      if (!isDefined(image.position)) {
        image.position = {}
      }
      if (!isDefined(image.position.y)) {
        image.position.y = {}
      }
      image.position.y.align = returnValue
    } else {
      invalidValue = true
    }
  } else if (valueToCheck.type === 'length' && !positionSet) {
    if (
      !isDefined(image.position?.x?.offset) &&
      !isDefined(image.position?.y?.align)
    ) {
      if (!isDefined(image.position)) {
        image.position = {}
      }
      if (!isDefined(image.position.x)) {
        image.position.x = {}
      }
      image.position.x.offset = returnValue
    } else {
      if (!isDefined(image.position)) {
        image.position = {}
      }
      if (!isDefined(image.position.y)) {
        image.position.y = {}
      }
      image.position.y.offset = returnValue
    }
  } else if (
    (valueToCheck.type === 'length' || sizeBg.includes(valueToCheck.value)) &&
    positionSet
  ) {
    // Background size
    if (['cover', 'contain'].includes(returnValue.value)) {
      image.size = returnValue
    } else {
      if (!isDefined(image.size)) {
        image.size = { type: 'widthHeight', width: returnValue }
      } else {
        if (image.size.type === 'widthHeight')
          if (!isDefined(image.size.width)) {
            image.size = { ...image.size, width: returnValue }
          } else {
            image.size = { ...image.size, height: returnValue }
          }
      }
    }
  } else if (repeatStyle.includes(valueToCheck.value)) {
    // Background repeat
    if (valueToCheck.value === 'repeat-x') {
      if (!isDefined(image.repeat)) {
        image.repeat = {}
      }
      image.repeat.horizontal = { type: 'keyword', value: 'repeat' }
      image.repeat.vertical = { type: 'keyword', value: 'no-repeat' }
    } else if (valueToCheck.value === 'repeat-y') {
      if (!isDefined(image.repeat)) {
        image.repeat = {}
      }
      image.repeat.horizontal = { type: 'keyword', value: 'no-repeat' }
      image.repeat.vertical = { type: 'keyword', value: 'repeat' }
    } else {
      if (!isDefined(image.repeat?.horizontal)) {
        if (!isDefined(image.repeat)) {
          image.repeat = {}
        }
        image.repeat.horizontal = returnValue
      }
      image.repeat.vertical = returnValue
    }
  } else if (attachmentBg.includes(valueToCheck.value)) {
    // Background attachment
    image.attachment = returnValue
  } else if (visualBoxBg.includes(valueToCheck.value)) {
    // Background origin and background clip
    if (!image.origin) {
      image.origin = returnValue
      image.clip = returnValue
    } else {
      image.clip = returnValue
    }
  } else if (isColor(valueToCheck.value)) {
    // Background color
    color = returnValue
  } else if (
    valueToCheck.type === 'function' &&
    colorFunction.includes(valueToCheck.name)
  ) {
    color = returnValue
  } else if (valueToCheck.type === 'function' && valueToCheck.name === 'var') {
    // If it's a variable
    const allValues = valueToCheck.value.split(',')
    allValues.forEach((value) => {
      const val = value.trim()
      if (isVariable(val)) {
        const usedVariable = variables.find((v) =>
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
        const parsedVariable = parseMultipleValues(parsedUsedVariableVal)
        if (parsedVariable[0]?.type !== 'functionArguments') {
          const newProp = parseBackground({
            variables,
            image,
            valueToCheck: parsedVariable[0],
            positionSet,
            valueToReturn: returnValue,
          })

          if (newProp.color) {
            color = newProp.color
            return
          } else {
            image = { ...image, ...newProp.image }
          }
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        if (parsedVariable[0]?.type !== 'functionArguments') {
          const newProp = parseBackground({
            variables,
            image,
            valueToCheck: parsedVariable[0],
            positionSet,
            valueToReturn: returnValue,
          })

          if (newProp.color) {
            color = newProp.color
          } else {
            image = { ...image, ...newProp.image }
          }
        }
      }
    })
  } else if (valueToCheck.type === 'slash') {
    // Flag that the position is set
    positionSet = true
  } else {
    invalidValue = true
  }

  return { image, color, positionSet, invalidValue }
}

const parsePosition = (args: {
  variables: CSSStyleToken[]
  valueToCheck?: Exclude<
    ParsedValueType,
    {
      type: 'functionArguments'
      name: string
      arguments: ParsedValueType[]
    }
  >
  valueToReturn?: Exclude<
    ParsedValueType,
    {
      type: 'functionArguments'
      name: string
      arguments: ParsedValueType[]
    }
  >
}) => {
  const variables = args.variables
  const valueToCheck = args.valueToCheck
  const valueToReturn = args.valueToReturn
  if (!isDefined(valueToCheck)) {
    return {}
  }

  let alignX
  let alignY
  let align
  let offset
  let invalidValue
  const returnValue = valueToReturn ? valueToReturn : valueToCheck

  // Background position
  if (['left', 'right'].includes(valueToCheck.value)) {
    alignX = returnValue
  } else if (['top', 'bottom'].includes(valueToCheck.value)) {
    alignY = returnValue
  } else if (['center'].includes(valueToCheck.value)) {
    align = returnValue
  } else if (valueToCheck.type === 'length') {
    offset = returnValue
  } else if (valueToCheck.type === 'function' && valueToCheck.name === 'var') {
    // If it's a variable
    const allValues = valueToCheck.value.split(',')
    allValues.forEach((value) => {
      const val = value.trim()
      if (isVariable(val)) {
        const usedVariable = variables.find((v) =>
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
        const parsedVariable = parseMultipleValues(parsedUsedVariableVal)

        if (parsedVariable[0]?.type !== 'functionArguments') {
          const newProp = parsePosition({
            variables,
            valueToCheck: parsedVariable[0],
            valueToReturn: valueToCheck,
          })

          if (newProp.alignX) {
            alignX = newProp.alignX
          } else if (newProp.alignY) {
            alignY = newProp.alignY
          } else if (newProp.align) {
            align = newProp.align
          } else if (newProp.offset) {
            offset = newProp.offset
          }
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        if (parsedVariable[0]?.type !== 'functionArguments') {
          const newProp = parsePosition({
            variables,
            valueToCheck: parsedVariable[0],
            valueToReturn: valueToCheck,
          })

          if (newProp.alignX) {
            alignX = newProp.alignX
          } else if (newProp.alignY) {
            alignY = newProp.alignY
          } else if (newProp.align) {
            align = newProp.align
          } else if (newProp.offset) {
            offset = newProp.offset
          }
        }
      }
    })
  } else {
    invalidValue = true
  }

  return { alignX, alignY, align, offset, invalidValue }
}

const isParsedValueType = (
  value?:
    | ParsedValueType
    | ParsedLinearGradientType
    | ParsedConicGradientType
    | ParsedRadialGradientType
    | ParsedImageSetType,
): value is ParsedValueType => {
  if (
    isDefined(value) &&
    value.type !== 'linear-function' &&
    value.type !== 'conic-function' &&
    value.type !== 'radial-function'
  ) {
    return true
  } else {
    return false
  }
}

export const getParsedBackground = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  const styleKeys = Object.keys(style)
  if (
    style.background ||
    style['background-repeat'] ||
    style['background-size'] ||
    style['background-position'] ||
    style['background-position-x'] ||
    style['background-position-y'] ||
    style['background-origin'] ||
    style['background-clip'] ||
    style['background-attachment'] ||
    style['background-image'] ||
    style['background-color']
  ) {
    const parsedBackground: {
      images?: ParsedImageType[]
      color?: ParsedValueType
    } = {}
    const invalidValues: ParsedValueType[][] = []
    const shorthandBackground: {
      image: ParsedImageType
      color?: ParsedValueType
    }[] = []

    if (style.background) {
      const backgrounds = parse({ input: style.background, slashSplit: false })

      // Go through all the backgrounds in the shorthand property
      backgrounds.forEach((bg) => {
        const invVals: ParsedValueType[] = []

        let color
        let image: Omit<ParsedImageType, 'image'> & {
          image?:
            | Omit<ParsedConicGradientType, 'invalidValues'>
            | Omit<ParsedLinearGradientType, 'invalidValues'>
            | Omit<ParsedRadialGradientType, 'invalidValues'>
            | Omit<ParsedImageSetType, 'invalidValues'>
            | ParsedValueType
        } = {}
        let positionSet = false

        const allValues = bg.nodes
          .map((property) => {
            return getParsedValue(property, variables)
          })
          .filter((v) => isDefined(v))

        const allVariablesKnown = checkIfNoUnknownVariables({
          variables,
          allValues,
        })

        if (allVariablesKnown) {
          // Go through all the values in one background
          allValues.forEach((property) => {
            if (isDefined(property) && property.type !== 'functionArguments') {
              if (property.type === 'linear-function') {
                const invalidValues = property.invalidValues

                image.image = {
                  type: property.type,
                  name: property.name,
                  direction: property.direction,
                  interpolation: property.interpolation,
                  stops: property.stops,
                }

                if (invalidValues.length > 0) {
                  invalidValues.forEach((iv) => {
                    if (isDefined(image.image)) {
                      Object.entries(image.image).forEach(([key, value]) => {
                        if (
                          key === 'stops' &&
                          image.image?.type === 'linear-function'
                        ) {
                          image.image[key].forEach((stop, index) => {
                            Object.entries(stop).forEach(([k, v]) => {
                              if (
                                !v &&
                                image.image?.type === 'linear-function' &&
                                isDefined(image.image.stops[index])
                              ) {
                                if (k === 'color') {
                                  image.image.stops[index].color = iv
                                  invalidValues.shift()
                                } else if (
                                  k === 'position' &&
                                  isDefined(image.image.stops[index])
                                ) {
                                  if (!image.image.stops[index].position) {
                                    image.image.stops[index].position = {
                                      start: iv,
                                    }
                                  } else if (
                                    !image.image.stops[index].position.start
                                  ) {
                                    image.image.stops[index].position.start = iv
                                  } else if (
                                    !image.image.stops[index].position.end
                                  ) {
                                    image.image.stops[index].position.end = iv
                                  }
                                  invalidValues.shift()
                                } else if (k === 'midpoint') {
                                  image.image.stops[index].midpoint = iv
                                  invalidValues.shift()
                                }
                              }
                            })
                          })
                        } else if (
                          key === 'interpolation' ||
                          key === 'direction'
                        ) {
                          if (
                            !value &&
                            image.image?.type === 'linear-function'
                          ) {
                            image.image[key] = iv
                            invalidValues.shift()
                          }
                        }
                      })
                    }
                  })
                }
              } else if (property.type === 'conic-function') {
                const invalidValues = property.invalidValues

                image.image = {
                  type: property.type,
                  name: property.name,
                  angle: property.angle,
                  position: property.position,
                  interpolation: property.interpolation,
                  stops: property.stops,
                }

                if (invalidValues.length > 0) {
                  invalidValues.forEach((iv) => {
                    if (isDefined(image.image)) {
                      Object.entries(image.image).forEach(([key, value]) => {
                        if (
                          key === 'stops' &&
                          image.image?.type === 'conic-function'
                        ) {
                          image.image[key].forEach((stop, index) => {
                            Object.entries(stop).forEach(([k, v]) => {
                              if (
                                !v &&
                                image.image?.type === 'conic-function'
                              ) {
                                if (
                                  k === 'color' &&
                                  isDefined(image.image.stops[index])
                                ) {
                                  image.image.stops[index].color = iv
                                  invalidValues.shift()
                                } else if (
                                  k === 'position' &&
                                  isDefined(image.image.stops[index])
                                ) {
                                  if (!image.image.stops[index].position) {
                                    image.image.stops[index].position = {
                                      start: iv,
                                    }
                                  } else if (
                                    !image.image.stops[index].position.start
                                  ) {
                                    image.image.stops[index].position.start = iv
                                  } else if (
                                    !image.image.stops[index].position.end
                                  ) {
                                    image.image.stops[index].position.end = iv
                                  }
                                  invalidValues.shift()
                                }
                              }
                            })
                          })
                        } else if (key === 'angle') {
                          if (
                            !value &&
                            image.image?.type === 'conic-function'
                          ) {
                            image.image[key] = iv
                            invalidValues.shift()
                          }
                        } else if (
                          key === 'interpolation' &&
                          iv.type !== 'functionArguments'
                        ) {
                          if (
                            !value &&
                            image.image?.type === 'conic-function'
                          ) {
                            image.image[key] = iv
                            invalidValues.shift()
                          }
                        } else if (key === 'position') {
                          if (
                            !value &&
                            image.image?.type === 'conic-function'
                          ) {
                            image.image[key] = { x: { align: iv } }
                            invalidValues.shift()
                          }
                        }
                      })
                    }
                  })
                }
              } else if (property.type === 'radial-function') {
                const invalidValues = property.invalidValues

                image.image = {
                  type: property.type,
                  name: property.name,
                  shape: property.shape,
                  size: property.size,
                  position: property.position,
                  interpolation: property.interpolation,
                  stops: property.stops,
                }

                if (invalidValues.length > 0) {
                  invalidValues.forEach((iv) => {
                    if (isDefined(image.image)) {
                      Object.entries(image.image).forEach(([key, value]) => {
                        if (
                          key === 'stops' &&
                          image.image?.type === 'radial-function'
                        ) {
                          image.image[key].forEach((stop, index) => {
                            Object.entries(stop).forEach(([k, v]) => {
                              if (
                                !v &&
                                image.image?.type === 'radial-function'
                              ) {
                                if (
                                  k === 'color' &&
                                  isDefined(image.image.stops[index])
                                ) {
                                  image.image.stops[index].color = iv
                                  invalidValues.shift()
                                } else if (
                                  k === 'position' &&
                                  isDefined(image.image.stops[index])
                                ) {
                                  if (!image.image.stops[index].position) {
                                    image.image.stops[index].position = {
                                      start: iv,
                                    }
                                  } else if (
                                    !image.image.stops[index].position.start
                                  ) {
                                    image.image.stops[index].position.start = iv
                                  } else if (
                                    !image.image.stops[index].position.end
                                  ) {
                                    image.image.stops[index].position.end = iv
                                  }
                                  invalidValues.shift()
                                }
                              }
                            })
                          })
                        } else if (key === 'shape' || key === 'size') {
                          if (
                            !value &&
                            image.image?.type === 'radial-function'
                          ) {
                            image.image[key] = iv
                            invalidValues.shift()
                          }
                        } else if (
                          key === 'interpolation' &&
                          iv.type !== 'functionArguments'
                        ) {
                          if (
                            !value &&
                            image.image?.type === 'radial-function'
                          ) {
                            image.image[key] = iv
                            invalidValues.shift()
                          }
                        } else if (key === 'position') {
                          if (
                            !value &&
                            image.image?.type === 'radial-function'
                          ) {
                            image.image[key] = { x: { align: iv } }
                            invalidValues.shift()
                          }
                        }
                      })
                    }
                  })
                }
              } else if (property.type === 'image-set-function') {
                image.image = {
                  type: property.type,
                  name: property.name,
                  imagesSet: property.imagesSet,
                }
              } else {
                const newProp = parseBackground({
                  variables,
                  image,
                  valueToCheck: property,
                  positionSet,
                })

                if (newProp.invalidValue) {
                  invVals.push(property)
                } else if (newProp.color) {
                  color = newProp.color
                } else {
                  if (newProp.image?.image?.type !== 'image-set-function') {
                    const newImage = newProp.image as
                      | (Omit<ParsedImageType, 'image'> & {
                          image?:
                            | Omit<ParsedConicGradientType, 'invalidValues'>
                            | Omit<ParsedLinearGradientType, 'invalidValues'>
                            | Omit<ParsedRadialGradientType, 'invalidValues'>
                            | ParsedValueType
                        })
                      | undefined

                    image = { ...image, ...newImage }
                  }
                }
                positionSet = newProp.positionSet ?? false
              }
            }
          })

          shorthandBackground.push({
            color,
            image: { ...image, image: image.image },
          })

          // We apply only if no invalid values
          if (invVals.length === 0) {
            if (isDefined(color)) {
              parsedBackground.color = color
            }

            if (Object.keys(image).length > 0) {
              if (!isDefined(parsedBackground.images)) {
                parsedBackground.images = []
              }

              parsedBackground.images.push({
                ...image,
                image: image.image,
              })
            }
          } else {
            invalidValues.push(invVals)
            parsedBackground.color = color
          }
        } else {
          // If it's only one unknown variable we will assume that is a color
          if (allValues.length === 1 && allValues[0]?.type === 'function') {
            parsedBackground.color = allValues[0]
          } else {
            const filteredValues = allValues.filter((v) => v.type !== 'slash')
            // Parse the values by the order

            if (!isDefined(parsedBackground.images)) {
              parsedBackground.images = []
            }
            const image: ParsedImageType = {}
            if (isDefined(filteredValues[0])) {
              image.image = filteredValues[0]
            }
            if (isParsedValueType(filteredValues[1])) {
              image.position = {
                x: { align: filteredValues[1] },
              }
            }
            if (
              isDefined(image.position?.x) &&
              isParsedValueType(filteredValues[2])
            ) {
              image.position.x = {
                ...image.position.x,
                offset: filteredValues[2],
              }
            }
            if (isParsedValueType(filteredValues[3])) {
              image.position = {
                x: { align: filteredValues[3] },
              }
            }
            if (
              isDefined(image.position?.y) &&
              isParsedValueType(filteredValues[4])
            ) {
              image.position.y = {
                ...image.position.y,
                offset: filteredValues[4],
              }
            }

            if (isParsedValueType(filteredValues[5])) {
              image.size = filteredValues[5]
            }
            if (isParsedValueType(filteredValues[6])) {
              image.repeat = {
                horizontal: filteredValues[6],
              }
            }
            if (isParsedValueType(filteredValues[7])) {
              image.repeat = {
                ...image.repeat,
                vertical: filteredValues[7],
              }
            }
            if (isParsedValueType(filteredValues[8])) {
              image.origin = filteredValues[8]
            }
            if (isParsedValueType(filteredValues[9])) {
              image.clip = filteredValues[9]
            }
            if (isParsedValueType(filteredValues[10])) {
              image.attachment = filteredValues[10]
            }
            parsedBackground.images.push(image)
            if (isParsedValueType(filteredValues[11])) {
              parsedBackground.color = filteredValues[11]
            }
          }
        }
      })
    }

    const backgroundRepeat = parse({ input: style['background-repeat'] })
    const backgroundSize = parse({ input: style['background-size'] })
    const backgroundPosition = parse({ input: style['background-position'] })
    const backgroundPositionX = parse({ input: style['background-position-x'] })
    const backgroundPositionY = parse({ input: style['background-position-y'] })
    const backgroundOrigin = parse({ input: style['background-origin'] })
    const backgroundClip = parse({ input: style['background-clip'] })
    const backgroundAttachment = parse({
      input: style['background-attachment'],
    })
    const backgroundImages = parse({
      input: style['background-image'],
    })

    const backgroundLength = Math.max(
      backgroundRepeat.length,
      backgroundSize.length,
      backgroundPosition.length,
      backgroundPositionX.length,
      backgroundPositionY.length,
      backgroundOrigin.length,
      backgroundClip.length,
      backgroundAttachment.length,
      backgroundImages.length,
    )

    ;[...Array(backgroundLength).keys()].map((index) => {
      if (!isDefined(parsedBackground.images)) {
        parsedBackground.images = []
      }
      if (!isDefined(parsedBackground.images[index])) {
        parsedBackground.images[index] = {}
      }

      if (
        style['background-image'] &&
        (styleKeys.indexOf('background-image') >
          styleKeys.indexOf('background') ||
          (isDefined(invalidValues[index]) && invalidValues[index]?.length > 0))
      ) {
        const background = backgroundImages[index]?.nodes[0]
        const parsedValue = isDefined(background)
          ? getParsedValue(background, variables)
          : null

        if (parsedValue?.type === 'function' && parsedValue.name === 'var') {
          parsedBackground.images[index].image = parsedValue
        } else if (parsedValue && parsedValue.type !== 'functionArguments') {
          const image: {
            image?:
              | Omit<ParsedConicGradientType, 'invalidValues'>
              | Omit<ParsedLinearGradientType, 'invalidValues'>
              | Omit<ParsedRadialGradientType, 'invalidValues'>
              | Omit<ParsedImageSetType, 'invalidValues'>
          } = {}

          switch (parsedValue.type) {
            case 'linear-function': {
              const invalidValues = parsedValue.invalidValues

              image.image = {
                type: parsedValue.type,
                name: parsedValue.name,
                direction: parsedValue.direction,
                interpolation: parsedValue.interpolation,
                stops: parsedValue.stops,
              }

              if (invalidValues.length > 0) {
                invalidValues.forEach((iv) => {
                  if (isDefined(image.image)) {
                    Object.entries(image.image).forEach(([key, value]) => {
                      if (
                        key === 'stops' &&
                        image.image?.type === 'linear-function'
                      ) {
                        image.image[key].forEach((stop, index) => {
                          Object.entries(stop).forEach(([k, v]) => {
                            if (!v && image.image?.type === 'linear-function') {
                              if (
                                k === 'color' &&
                                isDefined(image.image.stops[index])
                              ) {
                                image.image.stops[index].color = iv
                                invalidValues.shift()
                              } else if (k === 'position') {
                                if (
                                  isDefined(image.image.stops[index]) &&
                                  !isDefined(image.image.stops[index].position)
                                ) {
                                  image.image.stops[index].position = {
                                    start: iv,
                                  }
                                } else if (
                                  isDefined(image.image.stops[index]) &&
                                  image.image.stops[index].position &&
                                  !image.image.stops[index].position.start
                                ) {
                                  image.image.stops[index].position.start = iv
                                } else if (
                                  isDefined(image.image.stops[index]) &&
                                  image.image.stops[index].position &&
                                  !image.image.stops[index].position.end
                                ) {
                                  image.image.stops[index].position.end = iv
                                }
                                invalidValues.shift()
                              } else if (
                                k === 'midpoint' &&
                                isDefined(image.image.stops[index])
                              ) {
                                image.image.stops[index].midpoint = iv
                                invalidValues.shift()
                              }
                            }
                          })
                        })
                      } else if (
                        key === 'interpolation' ||
                        key === 'direction'
                      ) {
                        if (!value && image.image?.type === 'linear-function') {
                          image.image[key] = iv
                          invalidValues.shift()
                        }
                      }
                    })
                  }
                })
              }
              break
            }
            case 'conic-function': {
              const invalidValues = parsedValue.invalidValues

              image.image = {
                type: parsedValue.type,
                name: parsedValue.name,
                angle: parsedValue.angle,
                position: parsedValue.position,
                interpolation: parsedValue.interpolation,
                stops: parsedValue.stops,
              }

              if (invalidValues.length > 0) {
                invalidValues.forEach((iv) => {
                  if (isDefined(image.image)) {
                    Object.entries(image.image).forEach(([key, value]) => {
                      if (
                        key === 'stops' &&
                        image.image?.type === 'conic-function'
                      ) {
                        if (!value) {
                          image.image[key] = [{ position: { start: iv } }]
                        } else {
                          image.image[key].forEach((stop, index) => {
                            Object.entries(stop).forEach(([k, v]) => {
                              if (!v && isDefined(image.image)) {
                                if (
                                  k === 'color' &&
                                  image.image.type !== 'image-set-function' &&
                                  isDefined(image.image.stops[index])
                                ) {
                                  image.image.stops[index].color = iv
                                  invalidValues.shift()
                                } else if (k === 'position') {
                                  if (
                                    image.image.type === 'conic-function' &&
                                    isDefined(image.image.stops[index]) &&
                                    !isDefined(
                                      image.image.stops[index].position,
                                    )
                                  ) {
                                    image.image.stops[index].position = {
                                      start: iv,
                                    }
                                  } else if (
                                    image.image.type === 'conic-function' &&
                                    isDefined(image.image.stops[index]) &&
                                    image.image.stops[index].position &&
                                    !image.image.stops[index].position.start
                                  ) {
                                    image.image.stops[index].position.start = iv
                                  } else if (
                                    image.image.type === 'conic-function' &&
                                    isDefined(image.image.stops[index]) &&
                                    image.image.stops[index].position &&
                                    !image.image.stops[index].position.end
                                  ) {
                                    image.image.stops[index].position.end = iv
                                  }
                                  invalidValues.shift()
                                }
                              }
                            })
                          })
                        }
                      } else if (key === 'angle') {
                        if (!value && image.image?.type === 'conic-function') {
                          image.image[key] = iv
                          invalidValues.shift()
                        }
                      } else if (
                        key === 'interpolation' &&
                        iv.type !== 'functionArguments'
                      ) {
                        if (!value && image.image?.type === 'conic-function') {
                          image.image[key] = iv
                          invalidValues.shift()
                        }
                      } else if (
                        key === 'position' &&
                        image.image?.type === 'conic-function'
                      ) {
                        if (!value) {
                          image.image[key] = {
                            x: { align: iv },
                          }
                          invalidValues.shift()
                        } else {
                          if (image.image[key] && !image.image[key].x?.offset) {
                            image.image[key].x = {
                              ...image.image[key].x,
                              offset: iv,
                            }
                          } else if (image.image[key] && !image.image[key].y) {
                            image.image[key].y = { align: iv }
                          } else if (
                            image.image[key]?.y &&
                            !image.image[key].y.offset
                          ) {
                            image.image[key].y.offset = iv
                          }
                        }
                      }
                    })
                  }
                })
              }
              break
            }
            case 'radial-function': {
              const invalidValues = parsedValue.invalidValues

              image.image = {
                type: parsedValue.type,
                name: parsedValue.name,
                shape: parsedValue.shape,
                size: parsedValue.size,
                position: parsedValue.position,
                interpolation: parsedValue.interpolation,
                stops: parsedValue.stops,
              }

              if (invalidValues.length > 0) {
                invalidValues.forEach((iv) => {
                  if (isDefined(image.image)) {
                    Object.entries(image.image).forEach(([key, value]) => {
                      if (
                        key === 'stops' &&
                        image.image?.type === 'radial-function'
                      ) {
                        if (!value) {
                          image.image[key] = [{ position: { start: iv } }]
                        } else {
                          image.image[key].forEach((stop, index) => {
                            Object.entries(stop).forEach(([k, v]) => {
                              if (!v && isDefined(image.image)) {
                                if (
                                  k === 'color' &&
                                  image.image.type !== 'image-set-function' &&
                                  isDefined(image.image.stops[index])
                                ) {
                                  image.image.stops[index].color = iv
                                  invalidValues.shift()
                                } else if (k === 'position') {
                                  if (
                                    image.image.type === 'radial-function' &&
                                    isDefined(image.image.stops[index]) &&
                                    !isDefined(
                                      image.image.stops[index].position,
                                    )
                                  ) {
                                    image.image.stops[index].position = {
                                      start: iv,
                                    }
                                  } else if (
                                    image.image.type === 'radial-function' &&
                                    isDefined(image.image.stops[index]) &&
                                    image.image.stops[index].position &&
                                    !image.image.stops[index].position.start
                                  ) {
                                    image.image.stops[index].position.start = iv
                                  } else if (
                                    image.image.type === 'radial-function' &&
                                    isDefined(image.image.stops[index]) &&
                                    image.image.stops[index].position &&
                                    !image.image.stops[index].position.end
                                  ) {
                                    image.image.stops[index].position.end = iv
                                  }
                                  invalidValues.shift()
                                }
                              }
                            })
                          })
                        }
                      } else if (key === 'shape' || key === 'size') {
                        if (!value && image.image?.type === 'radial-function') {
                          image.image[key] = iv
                          invalidValues.shift()
                        }
                      } else if (
                        key === 'interpolation' &&
                        iv.type !== 'functionArguments'
                      ) {
                        if (!value && image.image?.type === 'radial-function') {
                          image.image[key] = iv
                          invalidValues.shift()
                        }
                      } else if (
                        key === 'position' &&
                        image.image?.type === 'radial-function'
                      ) {
                        if (!value) {
                          image.image[key] = {
                            x: { align: iv },
                          }
                          invalidValues.shift()
                        } else {
                          if (image.image[key] && !image.image[key].x?.offset) {
                            image.image[key].x = {
                              ...image.image[key].x,
                              offset: iv,
                            }
                          } else if (image.image[key] && !image.image[key].y) {
                            image.image[key].y = { align: iv }
                          } else if (
                            image.image[key]?.y &&
                            !image.image[key].y.offset
                          ) {
                            image.image[key].y.offset = iv
                          }
                        }
                      }
                    })
                  }
                })
              }
              break
            }
            case 'image-set-function': {
              image.image = {
                type: parsedValue.type,
                name: parsedValue.name,
                imagesSet: parsedValue.imagesSet,
              }
              break
            }
            default: {
              // Check if it's a valid value
              const newProp = parseBackground({
                variables,
                valueToCheck: parsedValue,
                image,
                positionSet: false,
              })

              if (newProp.image?.image) {
                parsedBackground.images[index].image = newProp.image.image
              }
            }
          }
          parsedBackground.images[index].image = image.image
        }
      }

      if (
        style['background-repeat'] &&
        (styleKeys.indexOf('background-repeat') >
          styleKeys.indexOf('background') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        const backgroundRepeatVals = getValue(backgroundRepeat[index])
        const parsedValues = parseMultipleValues(backgroundRepeatVals)

        let invalidValue = false
        let image: {
          repeat?: {
            horizontal?: ParsedValueType
            vertical?: ParsedValueType
          }
        } = {}

        const allVariablesKnown = checkIfNoUnknownVariables({
          variables,
          allValues: parsedValues,
        })

        if (allVariablesKnown) {
          parsedValues.forEach((pv) => {
            if (pv.type !== 'functionArguments') {
              // Check if it's a valid value
              const newProp = parseBackground({
                variables,
                valueToCheck: pv,
                image,
                positionSet: false,
              })

              if (newProp.invalidValue) {
                invalidValue = true
              } else {
                image = { ...image, ...newProp.image }
              }
            }
          })
        } else {
          image.repeat = {
            horizontal: parsedValues[0],
            vertical: parsedValues[1],
          }
        }

        if (!invalidValue || !style.background) {
          parsedBackground.images[index].repeat = image.repeat
        }
      }

      if (
        style['background-size'] &&
        (styleKeys.indexOf('background-size') >
          styleKeys.indexOf('background') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        const backgroundSizeValue = getValue(backgroundSize[index])
        const parsedValues = parseMultipleValues(backgroundSizeValue)
        let invalidValue = false
        let image: {
          size?:
            | ParsedValueType
            | {
                type: 'widthHeight'
                width: ParsedValueType
                height?: ParsedValueType
              }
        } = {}

        const allVariablesKnown = checkIfNoUnknownVariables({
          variables,
          allValues: parsedValues,
        })

        if (allVariablesKnown) {
          parsedValues.forEach((pv) => {
            if (pv.type !== 'functionArguments') {
              // Check if it's a valid value
              const newProp = parseBackground({
                variables,
                valueToCheck: pv,
                image,
                positionSet: true,
              })

              if (newProp.invalidValue) {
                invalidValue = true
              } else {
                if (isDefined(newProp.image)) {
                  image = { ...image, ...newProp.image }
                }
              }
            }
          })
        } else {
          if (parsedValues.length === 1) {
            image.size = parsedValues[0]
          } else if (isDefined(parsedValues[0])) {
            image.size = {
              type: 'widthHeight',
              width: parsedValues[0],
              height: parsedValues[1],
            }
          }
        }

        if (!invalidValue || !style.background) {
          parsedBackground.images[index].size = image.size
        }
      }

      if (
        style['background-position'] &&
        (styleKeys.indexOf('background-position') >
          styleKeys.indexOf('background') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        const backgroundPosVal = getValue(backgroundPosition[index])
        const parsedVal = parseMultipleValues(backgroundPosVal)
        let invalidValue = false
        const temporaryPos: {
          x?: { align?: ParsedValueType; offset?: ParsedValueType }
          y?: { align?: ParsedValueType; offset?: ParsedValueType }
        } = {}
        const allVariablesKnown = checkIfNoUnknownVariables({
          variables,
          allValues: parsedVal,
        })
        if (allVariablesKnown) {
          parsedVal.forEach((pv, index) => {
            if (pv.type !== 'functionArguments') {
              // Check if it's a valid value
              const newProp = parsePosition({
                variables,
                valueToCheck: pv,
              })

              if (newProp.invalidValue) {
                invalidValue = true
              } else if (newProp.alignX) {
                if (!isDefined(temporaryPos.x)) {
                  temporaryPos.x = {}
                }
                temporaryPos.x.align = newProp.alignX
              } else if (newProp.alignY) {
                if (!isDefined(temporaryPos.y)) {
                  temporaryPos.y = {}
                }
                temporaryPos.y.align = newProp.alignY
              } else if (newProp.align) {
                if (!isDefined(temporaryPos.x)) {
                  temporaryPos.x = {}
                }
                if (!temporaryPos.x.align) {
                  temporaryPos.x.align = newProp.align
                } else {
                  if (!isDefined(temporaryPos.y)) {
                    temporaryPos.y = {}
                  }
                  temporaryPos.y.align = newProp.align
                }
              } else if (newProp.offset) {
                if (parsedVal.length === 1) {
                  if (!isDefined(temporaryPos.x)) {
                    temporaryPos.x = {}
                  }
                  temporaryPos.x.offset = newProp.offset
                } else if (parsedVal.length === 2) {
                  if (index === 0) {
                    if (!isDefined(temporaryPos.x)) {
                      temporaryPos.x = {}
                    }
                    temporaryPos.x.offset = newProp.offset
                  } else {
                    if (!isDefined(temporaryPos.y)) {
                      temporaryPos.y = {}
                    }
                    temporaryPos.y.offset = newProp.offset
                  }
                } else if (parsedVal.length === 3) {
                  if (!isDefined(temporaryPos.x)) {
                    temporaryPos.x = {}
                  }
                  if (temporaryPos.x.align) {
                    temporaryPos.x.offset = newProp.offset
                  } else {
                    if (!isDefined(temporaryPos.y)) {
                      temporaryPos.y = {}
                    }
                    temporaryPos.y.offset = newProp.offset
                  }
                } else if (parsedVal.length === 4) {
                  if (!isDefined(temporaryPos.x)) {
                    temporaryPos.x = {}
                  }
                  if (temporaryPos.x.align && !temporaryPos.x.offset) {
                    temporaryPos.x.offset = newProp.offset
                  } else {
                    if (!isDefined(temporaryPos.y)) {
                      temporaryPos.y = {}
                    }
                    temporaryPos.y.offset = newProp.offset
                  }
                }
              }
            }
          })
        } else {
          if (parsedVal.length === 1 && isDefined(parsedVal[0])) {
            if (!isDefined(temporaryPos.x)) {
              temporaryPos.x = {}
            }
            temporaryPos.x.align = parsedVal[0]
          } else if (parsedVal.length === 2) {
            if (isDefined(parsedVal[0])) {
              if (!isDefined(temporaryPos.x)) {
                temporaryPos.x = {}
              }
              temporaryPos.x.align = parsedVal[0]
            }
            if (isDefined(parsedVal[1])) {
              if (!isDefined(temporaryPos.y)) {
                temporaryPos.y = {}
              }
              temporaryPos.y.align = parsedVal[1]
            }
          } else if (parsedVal.length === 3) {
            if (isDefined(parsedVal[0])) {
              if (!isDefined(temporaryPos.x)) {
                temporaryPos.x = {}
              }
              temporaryPos.x.align = parsedVal[0]
            }
            if (isDefined(parsedVal[1])) {
              if (!isDefined(temporaryPos.x)) {
                temporaryPos.x = {}
              }
              temporaryPos.x.offset = parsedVal[1]
            }
            if (isDefined(parsedVal[2])) {
              if (!isDefined(temporaryPos.y)) {
                temporaryPos.y = {}
              }
              temporaryPos.y.align = parsedVal[2]
            }
          } else if (parsedVal.length === 4) {
            if (isDefined(parsedVal[0])) {
              if (!isDefined(temporaryPos.x)) {
                temporaryPos.x = {}
              }
              temporaryPos.x.align = parsedVal[0]
            }
            if (isDefined(parsedVal[1])) {
              if (!isDefined(temporaryPos.x)) {
                temporaryPos.x = {}
              }
              temporaryPos.x.offset = parsedVal[1]
            }
            if (isDefined(parsedVal[2])) {
              if (!isDefined(temporaryPos.y)) {
                temporaryPos.y = {}
              }
              temporaryPos.y.align = parsedVal[2]
            }
            if (isDefined(parsedVal[3])) {
              if (!isDefined(temporaryPos.y)) {
                temporaryPos.y = {}
              }
              temporaryPos.y.offset = parsedVal[3]
            }
          }
        }

        if (!invalidValue || !style.background) {
          parsedBackground.images[index].position = temporaryPos
        }
      }

      if (
        style['background-position-x'] &&
        (styleKeys.indexOf('background-position-x') >
          styleKeys.indexOf('background') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        const backgroundPosXVal = getValue(backgroundPositionX[index])

        const parsedAlign = parseMultipleValues(backgroundPosXVal)[0]
        const parsedOffset = parseMultipleValues(backgroundPosXVal)[1]

        if (isDefined(parsedAlign)) {
          // If it's a variable we always return that
          if (
            (parsedAlign.type === 'function' && parsedAlign.name === 'var') ||
            !style.background
          ) {
            if (!isDefined(parsedBackground.images[index])) {
              parsedBackground.images[index] = {}
            }
            if (!isDefined(parsedBackground.images[index].position)) {
              parsedBackground.images[index].position = {}
            }
            if (!isDefined(parsedBackground.images[index].position.x)) {
              parsedBackground.images[index].position.x = {}
            }
            parsedBackground.images[index].position.x.align = parsedAlign
          } else if (parsedAlign.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseBackground({
              variables,
              image: {},
              valueToCheck: parsedAlign,
              positionSet: false,
            })

            if (newProp.image?.position?.x?.align) {
              if (!isDefined(parsedBackground.images[index])) {
                parsedBackground.images[index] = {}
              }
              if (!isDefined(parsedBackground.images[index].position)) {
                parsedBackground.images[index].position = {}
              }
              if (!isDefined(parsedBackground.images[index].position.x)) {
                parsedBackground.images[index].position.x = {}
              }
              parsedBackground.images[index].position.x.align =
                newProp.image.position.x.align
            }
          }
        }

        if (isDefined(parsedOffset)) {
          // If it's a variable we always return that
          if (
            (parsedOffset.type === 'function' && parsedOffset.name === 'var') ||
            !style.background
          ) {
            if (!isDefined(parsedBackground.images[index])) {
              parsedBackground.images[index] = {}
            }
            if (!isDefined(parsedBackground.images[index].position)) {
              parsedBackground.images[index].position = {}
            }
            if (!isDefined(parsedBackground.images[index].position.y)) {
              parsedBackground.images[index].position.y = {}
            }
            parsedBackground.images[index].position.y.offset = parsedOffset
          } else if (parsedOffset.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseBackground({
              variables,
              image: {},
              valueToCheck: parsedOffset,
              positionSet: false,
            })

            if (newProp.image?.position?.y?.offset) {
              if (!isDefined(parsedBackground.images[index])) {
                parsedBackground.images[index] = {}
              }
              if (!isDefined(parsedBackground.images[index].position)) {
                parsedBackground.images[index].position = {}
              }
              if (!isDefined(parsedBackground.images[index].position.y)) {
                parsedBackground.images[index].position.y = {}
              }
              parsedBackground.images[index].position.y.offset =
                newProp.image.position.y.offset
            }
          }
        }
      }

      if (
        style['background-position-y'] &&
        (styleKeys.indexOf('background-position-y') >
          styleKeys.indexOf('background') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        const backgroundPosYVal = getValue(backgroundPositionY[index])

        const parsedAlign = parseMultipleValues(backgroundPosYVal)[0]
        const parsedOffset = parseMultipleValues(backgroundPosYVal)[1] ?? null

        // If it's a variable we always return that
        if (isDefined(parsedAlign)) {
          if (
            (parsedAlign.type === 'function' && parsedAlign.name === 'var') ||
            !style.background
          ) {
            if (!isDefined(parsedBackground.images[index])) {
              parsedBackground.images[index] = {}
            }
            if (!isDefined(parsedBackground.images[index].position)) {
              parsedBackground.images[index].position = {}
            }
            if (!isDefined(parsedBackground.images[index].position.y)) {
              parsedBackground.images[index].position.y = {}
            }
            parsedBackground.images[index].position.y.align = parsedAlign
          } else if (parsedAlign.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseBackground({
              variables,
              image: {},
              valueToCheck: parsedAlign,
              positionSet: false,
            })

            if (newProp.image?.position?.y?.align) {
              if (!isDefined(parsedBackground.images[index])) {
                parsedBackground.images[index] = {}
              }
              if (!isDefined(parsedBackground.images[index].position)) {
                parsedBackground.images[index].position = {}
              }
              if (!isDefined(parsedBackground.images[index].position.y)) {
                parsedBackground.images[index].position.y = {}
              }
              parsedBackground.images[index].position.y.align =
                newProp.image.position.y.align
            }
          }
        }

        if (isDefined(parsedOffset)) {
          // If it's a variable we always return that
          if (
            (parsedOffset.type === 'function' && parsedOffset.name === 'var') ||
            !style.background
          ) {
            if (!isDefined(parsedBackground.images[index])) {
              parsedBackground.images[index] = {}
            }
            if (!isDefined(parsedBackground.images[index].position)) {
              parsedBackground.images[index].position = {}
            }
            if (!isDefined(parsedBackground.images[index].position.y)) {
              parsedBackground.images[index].position.y = {}
            }
            parsedBackground.images[index].position.y.offset = parsedOffset
          } else if (parsedOffset.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseBackground({
              variables,
              image: {},
              valueToCheck: parsedOffset,
              positionSet: false,
            })

            if (newProp.image?.position?.y?.offset) {
              if (!isDefined(parsedBackground.images[index])) {
                parsedBackground.images[index] = {}
              }
              if (!isDefined(parsedBackground.images[index].position)) {
                parsedBackground.images[index].position = {}
              }
              if (!isDefined(parsedBackground.images[index].position.y)) {
                parsedBackground.images[index].position.y = {}
              }
              parsedBackground.images[index].position.y.offset =
                newProp.image.position.y.offset
            }
          }
        }
      }

      if (
        style['background-origin'] &&
        (styleKeys.indexOf('background-origin') >
          styleKeys.indexOf('background') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        const backgroundOriginVal = getValue(backgroundOrigin[index])

        const parsedProperty = parseMultipleValues(backgroundOriginVal)[0]

        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.background
          ) {
            parsedBackground.images[index].origin = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseBackground({
              variables,
              image: {},
              valueToCheck: parsedProperty,
              positionSet: false,
            })

            if (newProp.image?.origin) {
              parsedBackground.images[index].origin = newProp.image.origin
            }
          }
        }
      }

      if (
        style['background-clip'] &&
        (styleKeys.indexOf('background-clip') >
          styleKeys.indexOf('background') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        const backgroundClipVal = getValue(backgroundClip[index])

        const parsedProperty = parseMultipleValues(backgroundClipVal)[0]
        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.background
          ) {
            parsedBackground.images[index].clip = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseBackground({
              variables,
              image: {},
              valueToCheck: parsedProperty,
              positionSet: false,
            })

            if (newProp.image?.clip) {
              parsedBackground.images[index].clip = newProp.image.clip
            }
          }
        }
      }

      if (
        style['background-attachment'] &&
        (styleKeys.indexOf('background-attachment') >
          styleKeys.indexOf('background') ||
          (isDefined(invalidValues[index]) && invalidValues[index].length > 0))
      ) {
        const backgroundAttachVal = getValue(backgroundAttachment[index])

        const parsedProperty = parseMultipleValues(backgroundAttachVal)[0]
        if (isDefined(parsedProperty)) {
          // If it's a variable we always return that
          if (
            (parsedProperty.type === 'function' &&
              parsedProperty.name === 'var') ||
            !style.background
          ) {
            parsedBackground.images[index].attachment = parsedProperty
          } else if (parsedProperty.type !== 'functionArguments') {
            // Check if it's a valid value
            const newProp = parseBackground({
              variables,
              image: {},
              valueToCheck: parsedProperty,
              positionSet: false,
            })

            if (newProp.image?.attachment) {
              parsedBackground.images[index].attachment =
                newProp.image.attachment
            }
          }
        }
      }
    })
    const backgroundImagesLength = isDefined(parsedBackground.images)
      ? parsedBackground.images.length - 1
      : 0
    if (
      style['background-color'] &&
      (styleKeys.indexOf('background-color') >
        styleKeys.indexOf('background') ||
        (isDefined(invalidValues[backgroundImagesLength]) &&
          invalidValues[backgroundImagesLength].length > 0))
    ) {
      const backgroundColor = parse({ input: style['background-color'] })

      const parsedProperty = parseMultipleValues(
        getValue(backgroundColor[0]),
      )[0]

      if (isDefined(parsedProperty)) {
        // If it's a variable we always return that
        if (
          (parsedProperty.type === 'function' &&
            parsedProperty.name === 'var') ||
          !style.background
        ) {
          parsedBackground.color = parsedProperty
        } else if (parsedProperty.type !== 'functionArguments') {
          // Check if it's a valid value
          const newProp = parseBackground({
            variables,
            image: {},
            valueToCheck: parsedProperty,
            positionSet: false,
          })

          if (newProp.color) {
            parsedBackground.color = newProp.color
          }
        }
      }
    }

    // We also want to apply if the shorthand has invalid values and there are no any single properties defined
    const backgroundImageProperties = [
      'image',
      'repeat',
      'position',
      'size',
      'origin',
      'clip',
      'attachment',
    ] as const

    invalidValues.forEach((iv, index) => {
      if (iv.length > 0 && !isDefined(parsedBackground.images)) {
        if (isDefined(shorthandBackground[index])) {
          parsedBackground.images = []
          if (!isDefined(parsedBackground.images[index])) {
            parsedBackground.images[index] = {}
          }
          parsedBackground.images[index] = shorthandBackground[index].image
          parsedBackground.color = shorthandBackground[index].color
        }

        backgroundImageProperties.forEach((key) => {
          if (iv.length > 0) {
            if (
              key === 'repeat' &&
              isDefined(parsedBackground.images?.[index])
            ) {
              if (
                !isDefined(parsedBackground.images[index]?.repeat?.horizontal)
              ) {
                if (!isDefined(parsedBackground.images[index][key])) {
                  parsedBackground.images[index][key] = {}
                }
                parsedBackground.images[index][key].horizontal = iv[0]
                iv.shift()
              } else if (
                !isDefined(parsedBackground.images[index]?.repeat?.vertical)
              ) {
                if (!isDefined(parsedBackground.images[index][key])) {
                  parsedBackground.images[index][key] = {}
                }
                parsedBackground.images[index][key].vertical = iv[0]
                iv.shift()
              }
            } else if (
              key === 'position' &&
              isDefined(parsedBackground.images?.[index])
            ) {
              if (
                !isDefined(parsedBackground.images[index].position?.x?.align)
              ) {
                if (!isDefined(parsedBackground.images[index][key])) {
                  parsedBackground.images[index][key] = {}
                }
                if (!isDefined(parsedBackground.images[index][key].x)) {
                  parsedBackground.images[index][key].x = {}
                }
                parsedBackground.images[index][key].x.align = iv[0]
                iv.shift()
              } else if (
                !isDefined(parsedBackground.images[index].position.x.offset)
              ) {
                if (!isDefined(parsedBackground.images[index][key])) {
                  parsedBackground.images[index][key] = {}
                }
                if (!isDefined(parsedBackground.images[index][key].x)) {
                  parsedBackground.images[index][key].x = {}
                }
                parsedBackground.images[index][key].x.offset = iv[0]
                iv.shift()
              } else if (
                !isDefined(parsedBackground.images[index].position.y?.align)
              ) {
                if (!isDefined(parsedBackground.images[index][key])) {
                  parsedBackground.images[index][key] = {}
                }
                if (!isDefined(parsedBackground.images[index][key].y)) {
                  parsedBackground.images[index][key].y = {}
                }
                parsedBackground.images[index][key].y.align = iv[0]
                iv.shift()
              } else if (
                !isDefined(parsedBackground.images[index].position.y.offset)
              ) {
                if (!isDefined(parsedBackground.images[index][key])) {
                  parsedBackground.images[index][key] = {}
                }
                if (!isDefined(parsedBackground.images[index][key].y)) {
                  parsedBackground.images[index][key].y = {}
                }
                parsedBackground.images[index][key].y.offset = iv[0]
                iv.shift()
              }
            } else if (
              isDefined(parsedBackground.images?.[index]) &&
              !isDefined(parsedBackground.images[index][key])
            ) {
              parsedBackground.images[index][key] = iv[0]
              iv.shift()
            }
          }
        })
      }
    })

    parsedBackground.images = parsedBackground.images?.toReversed()

    return parsedBackground
  } else {
    return null
  }
}
