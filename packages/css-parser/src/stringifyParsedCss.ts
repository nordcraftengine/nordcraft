import { isDefined } from '@nordcraft/core/dist/utils/util'
import { STYLE_PROPERTIES } from './const'
import type {
  ParsedConicGradientType,
  ParsedImageSetType,
  ParsedLinearGradientType,
  ParsedRadialGradientType,
  ParsedStyle,
  ParsedValueType,
  StringifiedStyle,
} from './types'

export const parsedCssToString = (args: { parsedCss: ParsedStyle }) => {
  const parsedCss = args.parsedCss ?? {}

  const style: StringifiedStyle = {}

  // Padding
  if (parsedCss.padding) {
    style.padding = combineValues([
      parsedCss.padding.top ? stringifyProperty(parsedCss.padding.top) : '0',
      parsedCss.padding.right
        ? stringifyProperty(parsedCss.padding.right)
        : '0',
      parsedCss.padding.bottom
        ? stringifyProperty(parsedCss.padding.bottom)
        : '0',
      parsedCss.padding.left ? stringifyProperty(parsedCss.padding.left) : '0',
    ])
  }

  // Margin
  if (parsedCss.margin) {
    style.margin = combineValues([
      parsedCss.margin.top ? stringifyProperty(parsedCss.margin.top) : '0',
      parsedCss.margin.right ? stringifyProperty(parsedCss.margin.right) : '0',
      parsedCss.margin.bottom
        ? stringifyProperty(parsedCss.margin.bottom)
        : '0',
      parsedCss.margin.left ? stringifyProperty(parsedCss.margin.left) : '0',
    ])
  }

  // Inset
  if (parsedCss.inset) {
    style.inset = combineValues([
      parsedCss.inset.top ? stringifyProperty(parsedCss.inset.top) : 'auto',
      parsedCss.inset.right ? stringifyProperty(parsedCss.inset.right) : 'auto',
      parsedCss.inset.bottom
        ? stringifyProperty(parsedCss.inset.bottom)
        : 'auto',
      parsedCss.inset.left ? stringifyProperty(parsedCss.inset.left) : 'auto',
    ])
  }

  // Transition
  if (parsedCss.transition) {
    const transitions = parsedCss.transition.map((t) => {
      if (
        t.property?.type !== 'functionArguments' &&
        t.property?.value === 'none'
      ) {
        return 'none'
      } else {
        return `${stringifyProperty(t.property)} ${stringifyProperty(t.duration)} ${stringifyProperty(t.timing)} ${stringifyProperty(t.delay)} ${stringifyProperty(t.behavior)}`
      }
    })
    style.transition = transitions.join(', ')
  }

  // Box shadow
  if (parsedCss.boxShadow) {
    const boxShadows = parsedCss.boxShadow.map((bs) => {
      let shadow = `${stringifyProperty(bs.horizontal)} ${stringifyProperty(bs.vertical)} ${stringifyProperty(bs.blur)} ${stringifyProperty(bs.spread)} ${stringifyProperty(bs.color)}`
      if (bs.position) {
        shadow += ` ${stringifyProperty(bs.position)}`
      }
      return shadow
    })
    style['box-shadow'] = boxShadows.join(', ')
  }

  // Text shadow
  if (parsedCss.textShadow) {
    const textShadows = parsedCss.textShadow.map((ts) => {
      const shadow = `${stringifyProperty(ts.horizontal)} ${stringifyProperty(ts.vertical)} ${stringifyProperty(ts.blur)} ${stringifyProperty(ts.color)}`
      return shadow
    })
    style['text-shadow'] = textShadows.join(', ')
  }

  // Border
  if (parsedCss.border) {
    let border
    let borderTop
    let borderBottom
    let borderLeft
    let borderRight

    if (parsedCss.border.all) {
      border = `${stringifyProperty(parsedCss.border.all.width)} ${stringifyProperty(parsedCss.border.all.style)} ${stringifyProperty(parsedCss.border.all.color)}`
    }
    if (parsedCss.border.top) {
      borderTop = `${stringifyProperty(parsedCss.border.top.width)} ${stringifyProperty(parsedCss.border.top.style)} ${stringifyProperty(parsedCss.border.top.color)}`
    }
    if (parsedCss.border.bottom) {
      borderBottom = `${stringifyProperty(parsedCss.border.bottom.width)} ${stringifyProperty(parsedCss.border.bottom.style)} ${stringifyProperty(parsedCss.border.bottom.color)}`
    }
    if (parsedCss.border.left) {
      borderLeft = `${stringifyProperty(parsedCss.border.left.width)} ${stringifyProperty(parsedCss.border.left.style)} ${stringifyProperty(parsedCss.border.left.color)}`
    }
    if (parsedCss.border.right) {
      borderRight = `${stringifyProperty(parsedCss.border.right.width)} ${stringifyProperty(parsedCss.border.right.style)} ${stringifyProperty(parsedCss.border.right.color)}`
    }
    if (border) {
      style.border = border
    }
    if (borderTop) {
      style['border-top'] = borderTop
    }
    if (borderBottom) {
      style['border-bottom'] = borderBottom
    }
    if (borderLeft) {
      style['border-left'] = borderLeft
    }
    if (borderRight) {
      style['border-right'] = borderRight
    }
  }

  // Border radius
  if (parsedCss.borderRadius) {
    const defaultVal: ParsedValueType = { type: 'number', value: '0' }
    const borderRadiusValues = [
      stringifyProperty(
        parsedCss.borderRadius.topLeft?.horizontal ?? defaultVal,
      ),
      stringifyProperty(
        parsedCss.borderRadius.topRight?.horizontal ?? defaultVal,
      ),
      stringifyProperty(
        parsedCss.borderRadius.bottomRight?.horizontal ?? defaultVal,
      ),
      stringifyProperty(
        parsedCss.borderRadius.bottomLeft?.horizontal ?? defaultVal,
      ),
    ]
    style.borderRadius = combineValues(borderRadiusValues)
  }

  // Translate
  const parsedTranslate = parsedCss.translate

  if (parsedTranslate) {
    if (parsedTranslate.type === 'keyword') {
      style.translate = stringifyProperty(parsedTranslate)
    } else {
      const defaultVal: ParsedValueType = { type: 'number', value: '0' }

      style.translate = `${stringifyProperty(parsedTranslate.x ?? defaultVal)} ${stringifyProperty(parsedTranslate.y ?? defaultVal)} ${stringifyProperty(parsedTranslate.z ?? defaultVal)}`
    }
  }

  // Scale
  const parsedScale = parsedCss.scale

  if (parsedScale) {
    if (parsedScale.type === 'keyword') {
      style.scale = stringifyProperty(parsedScale)
    } else {
      const defaultVal: ParsedValueType = { type: 'number', value: '1' }

      style.scale = `${stringifyProperty(parsedScale.x ?? defaultVal)} ${stringifyProperty(parsedScale.y ?? defaultVal)} ${stringifyProperty(parsedScale.z ?? defaultVal)}`
    }
  }

  // Rotate
  const parsedRotate = parsedCss.rotate

  if (parsedRotate) {
    if (parsedRotate.type === 'keyword') {
      style.rotate = stringifyProperty(parsedRotate)
    } else {
      const defaultVal: ParsedValueType = { type: 'number', value: '0' }

      style.rotate = `${stringifyProperty(parsedRotate.x ?? defaultVal)} ${stringifyProperty(parsedRotate.y ?? defaultVal)} ${stringifyProperty(parsedRotate.z ?? defaultVal)} ${stringifyProperty(parsedRotate.angle ?? { type: 'angle', value: '0', unit: 'deg' })}`
    }
  }

  // Perspective
  const parsedPerspective = parsedCss.perspective

  if (parsedPerspective) {
    if (parsedPerspective.type === 'keyword') {
      style.perspective = stringifyProperty(parsedPerspective)
    } else {
      style.perspective = stringifyProperty(parsedPerspective)
    }
  }

  // Transform
  if (parsedCss.transform) {
    let transform = ''

    parsedCss.transform.all?.forEach((t, i: number) => {
      Object.entries(t).forEach(([key, value]) => {
        if (value !== null) {
          if (i > 0) {
            transform += ' '
          }
          transform += `${key}(`
          Object.values(value).forEach((v, index) => {
            const val = v as ParsedValueType
            if (index > 0) {
              transform += `, ${stringifyProperty(val)}`
            } else {
              transform += `${stringifyProperty(val)}`
            }
          })

          transform += ')'
        }
      })
    })
    style.transform = transform

    if (parsedCss.transform.transformStyle) {
      style['transform-style'] = stringifyProperty(
        parsedCss.transform.transformStyle,
      )
    }
    if (parsedCss.transform.transformBox) {
      style['transform-box'] = stringifyProperty(
        parsedCss.transform.transformBox,
      )
    }
    if (parsedCss.transform.transformOrigin) {
      const defaultOrigin: ParsedValueType = {
        type: 'keyword',
        value: 'center',
      }
      const x = parsedCss.transform.transformOrigin.x
        ? stringifyProperty(parsedCss.transform.transformOrigin.x)
        : stringifyProperty(defaultOrigin)
      const y = parsedCss.transform.transformOrigin.y
        ? stringifyProperty(parsedCss.transform.transformOrigin.y)
        : stringifyProperty(defaultOrigin)
      const z = stringifyProperty(
        parsedCss.transform.transformOrigin.z ?? undefined,
      )

      style['transform-origin'] = `${x} ${y} ${z}`
      style['transform-origin'] = z !== '' ? `${x} ${y} ${z}` : `${x} ${y}`
    }
  }

  // Font
  if (parsedCss.font && Object.keys(parsedCss.font).length !== 0) {
    let font = ''
    if (
      parsedCss.font.family?.[0]?.value === 'inherit' &&
      parsedCss.font.size?.value === 'inherit' &&
      parsedCss.font.style?.style?.value === 'inherit' &&
      parsedCss.font.weight?.value === 'inherit' &&
      parsedCss.font.lineHeight?.value === 'inherit' &&
      parsedCss.font.stretch?.value === 'inherit' &&
      parsedCss.font.variant?.value === 'inherit'
    ) {
      font = 'inherit'
    } else {
      if (parsedCss.font.style) {
        if (parsedCss.font.style.style) {
          if (font !== '') {
            font += ' '
          }
          font += stringifyProperty(parsedCss.font.style.style)
        }
        if (parsedCss.font.style.angle) {
          if (font !== '') {
            font += ' '
          }
          font += stringifyProperty(parsedCss.font.style.angle)
        }
      }
      // What to do with the variants
      // if(parsedCss.font.variant){
      //     font += stringifyProperty(parsedCss.font.variant);
      // }
      if (parsedCss.font.weight) {
        if (font !== '') {
          font += ' '
        }
        font += stringifyProperty(parsedCss.font.weight)
      }
      if (parsedCss.font.stretch) {
        if (font !== '') {
          font += ' '
        }
        font += stringifyProperty(parsedCss.font.stretch)
      }
      if (parsedCss.font.size) {
        if (font !== '') {
          font += ' '
        }
        font += stringifyProperty(parsedCss.font.size)
        if (parsedCss.font.lineHeight) {
          if (font !== '') {
            font += ' '
          }
          font += `/${stringifyProperty(parsedCss.font.lineHeight)}`
        }
      }
      if (parsedCss.font.family) {
        const families = parsedCss.font.family.map((f) => {
          return stringifyProperty(f)
        })
        if (font !== '') {
          font += ' '
        }
        font += families.join(', ')
      }
    }

    style.font = font
  }

  // Background
  if (parsedCss.background) {
    const backgrounds =
      parsedCss.background.images?.toReversed().map((image) => {
        let background = ''

        if (image.image) {
          background += stringifyProperty(image.image)
        }
        if (image.attachment) {
          if (background !== '') {
            background += ' '
          }
          background += stringifyProperty(image.attachment)
        }
        if (image.clip) {
          if (background !== '') {
            background += ' '
          }
          background += stringifyProperty(image.clip)
        }
        if (image.origin) {
          if (background !== '') {
            background += ' '
          }
          background += stringifyProperty(image.origin)
        }
        if (image.repeat) {
          if (background !== '') {
            background += ' '
          }
          background += `${stringifyProperty(image.repeat?.horizontal)} ${stringifyProperty(image.repeat?.vertical)}`
        }
        if (image.position) {
          if (background !== '') {
            background += ' '
          }
          if (image.position.x?.align) {
            background += `${stringifyProperty(image.position.x.align)}`
          }
          if (image.position.x?.offset) {
            if (image.position.x?.align) {
              background += ' '
            }
            background += `${stringifyProperty(image.position.x.offset)}`
          }
          if (image.position.y?.align) {
            background += ` ${stringifyProperty(image.position.y.align)}`
          }
          if (image.position.y?.offset) {
            background += ` ${stringifyProperty(image.position.y.offset)}`
          }
        }
        if (image.size) {
          if (background !== '') {
            background += ' '
          }
          if (!image.position?.x?.align && !image.position?.x?.offset) {
            background += `0% 0%`
          }
          if (image.size.type === 'widthHeight') {
            background += `/ ${stringifyProperty(image.size.width)}`

            if (image.size.height) {
              background += ` ${stringifyProperty(image.size.height)}`
            }
          } else {
            background += `/ ${stringifyProperty(image.size)}`
          }
        }
        return background
      }) ?? []

    style.background = parsedCss.background.color
      ? `${backgrounds.join(', ')} ${stringifyProperty(parsedCss.background.color)}`
      : `${backgrounds.join(', ')}`
  }

  // Outline
  if (parsedCss.outline && Object.keys(parsedCss.outline).length !== 0) {
    style.outline = `${stringifyProperty(parsedCss.outline.width)} ${stringifyProperty(parsedCss.outline.style)} ${stringifyProperty(parsedCss.outline.color)}`
  }

  // Flex
  if (parsedCss.flex && Object.keys(parsedCss.flex).length !== 0) {
    style.flex = `${stringifyProperty(parsedCss.flex.grow)} ${stringifyProperty(parsedCss.flex.shrink)} ${stringifyProperty(parsedCss.flex.basis)}`
  }

  // Gap
  if (parsedCss.gap) {
    if (parsedCss.gap.row) {
      style['row-gap'] = stringifyProperty(parsedCss.gap.row)
    }

    if (parsedCss.gap.column) {
      style['column-gap'] = stringifyProperty(parsedCss.gap.column)
    }
  }

  // Overflow
  if (parsedCss.overflow) {
    if (parsedCss.overflow.x) {
      style['overflow-x'] = stringifyProperty(parsedCss.overflow.x)
    }

    if (parsedCss.overflow.y) {
      style['overflow-y'] = stringifyProperty(parsedCss.overflow.y)
    }
  }

  // Text decoration
  if (
    parsedCss.textDecoration &&
    Object.keys(parsedCss.textDecoration).length !== 0
  ) {
    style.textDecoration = ''
    parsedCss.textDecoration.line?.forEach((line) => {
      style.textDecoration += `${stringifyProperty(line)} `
    })
    style.textDecoration += `${stringifyProperty(parsedCss.textDecoration.style)} ${stringifyProperty(parsedCss.textDecoration.color)} ${stringifyProperty(parsedCss.textDecoration.thickness)}`
  }

  Object.keys(style).forEach((key) => {
    const keyProperty = key as unknown as keyof typeof STYLE_PROPERTIES
    if (Object.values(STYLE_PROPERTIES).includes(keyProperty)) {
      if (style[keyProperty]) {
        style[keyProperty] = style[keyProperty].trim()
      }
    }
  })

  return style
}

const combineValues = (values: string[]) => {
  if (values[1] === values[3]) {
    if (values[0] === values[2]) {
      if (values[0] === values[3]) {
        return values[0] ?? ''
      } else {
        return `${values[0]} ${values[3]}`
      }
    } else {
      return `${values[0]} ${values[3]} ${values[2]}`
    }
  } else {
    return `${values[0]} ${values[1]} ${values[2]} ${values[3]}`
  }
}

type ParsedLinearGradient = Omit<ParsedLinearGradientType, 'invalidValues'>
type ParsedConicGradient = Omit<ParsedConicGradientType, 'invalidValues'>
type ParsedRadialGradient = Omit<ParsedRadialGradientType, 'invalidValues'>
type ParsedImageSet = Omit<ParsedImageSetType, 'invalidValues'>

const stringifyProperty = (
  property?:
    | ParsedLinearGradient
    | ParsedConicGradient
    | ParsedRadialGradient
    | ParsedImageSet
    | ParsedValueType,
) => {
  switch (property?.type) {
    case 'length':
    case 'percentage':
    case 'length-percentage':
    case 'time':
    case 'angle':
    case 'resolution':
      return `${property.value}${property.unit}`
    case 'keyword':
      return property.value
    case 'string': {
      if (isDefined(property.quote)) {
        return `${property.quote}${property.value}${property.quote}`
      } else {
        return `${property.value}`
      }
    }
    case 'number':
      return `${property.value}`
    case 'hex':
      return `${property.value}`
    case 'function':
      if (property.name === 'url') {
        return `${property.name}("${property.value}")`
      } else {
        return `${property.name}(${property.value})`
      }
    case 'linear-function': {
      let value = `${property.name}(`
      if (property.interpolation?.type || property.direction?.type) {
        if (property.interpolation?.type) {
          value += `${stringifyProperty(property.interpolation)}`
          if (property.direction?.type) {
            value += ` `
          }
        }
        if (property.direction?.type) {
          value += `${stringifyProperty(property.direction)}`
        }
        value += ', '
      }

      property.stops.forEach((s, index) => {
        value += stringifyProperty(s.color)
        if (s.position?.start) {
          value += ` ${stringifyProperty(s.position.start)}`
        }
        if (s.position?.end) {
          value += ` ${stringifyProperty(s.position.end)}`
        }
        if (index < property.stops.length - 1) {
          value += ', '
        }
        if (s.midpoint) {
          value += `, ${stringifyProperty(s.midpoint)}`
        }
      })
      value += ')'
      return value
    }

    case 'conic-function': {
      let value = `${property.name}(`
      if (
        property.interpolation?.type ||
        property.angle?.type ||
        property.position?.x
      ) {
        if (property.interpolation?.type) {
          value += `${stringifyProperty(property.interpolation)}`
          if (property.angle?.type || property.position) {
            value += ` `
          }
        }
        if (property.angle?.type) {
          value += `from ${stringifyProperty(property.angle)}`
          if (property.position) {
            value += ` `
          }
        }
        if (property.position?.x) {
          value += 'at '
          if (property.position.x.align) {
            value += `${stringifyProperty(property.position.x.align)}`
          }
          if (property.position.x.offset) {
            if (property.position.x.align) {
              value += ' '
            }
            value += `${stringifyProperty(property.position.x.offset)}`
          }
          if (property.position.y?.align) {
            value += ` ${stringifyProperty(property.position.y.align)}`
          }
          if (property.position.y?.offset) {
            value += ` ${stringifyProperty(property.position.y.offset)}`
          }
        }
        value += ', '
      }

      property.stops.forEach((s: any, index: number) => {
        value += stringifyProperty(s.color)
        if (s.position?.start) {
          value += ` ${stringifyProperty(s.position.start)}`
        }
        if (s.position?.end) {
          value += ` ${stringifyProperty(s.position.end)}`
        }
        if (index < property.stops.length - 1) {
          value += ', '
        }
      })
      value += ')'
      return value
    }

    case 'radial-function': {
      let value = `${property.name}(`
      if (
        property.interpolation?.type ||
        property.shape?.type ||
        property.size?.type ||
        property.position?.x
      ) {
        if (property.interpolation?.type) {
          value += `${stringifyProperty(property.interpolation)}`
          if (
            property.shape?.type ||
            property.size?.type ||
            property.position
          ) {
            value += ` `
          }
        }
        if (property.shape?.type) {
          value += `${stringifyProperty(property.shape)}`
          if (property.position || property.size) {
            value += ` `
          }
        }
        if (property.size?.type) {
          value += `${stringifyProperty(property.size)}`
          if (property.position) {
            value += ` `
          }
        }
        if (property.position?.x) {
          value += 'at '
          if (property.position.x.align) {
            value += `${stringifyProperty(property.position.x.align)}`
          }
          if (property.position.x.offset) {
            if (property.position.x.align) {
              value += ' '
            }
            value += `${stringifyProperty(property.position.x.offset)}`
          }
          if (property.position.y?.align) {
            value += ` ${stringifyProperty(property.position.y.align)}`
          }
          if (property.position.y?.offset) {
            value += ` ${stringifyProperty(property.position.y.offset)}`
          }
        }
        value += ', '
      }

      property.stops.forEach((s: any, index: number) => {
        value += stringifyProperty(s.color)
        if (s.position?.start) {
          value += ` ${stringifyProperty(s.position.start)}`
        }
        if (s.position?.end) {
          value += ` ${stringifyProperty(s.position.end)}`
        }
        if (index < property.stops.length - 1) {
          value += ', '
        }
      })
      value += ')'
      return value
    }
    case 'image-set-function': {
      let value = 'image-set('
      property.imagesSet.forEach((image, index) => {
        value += `${stringifyProperty(image.image)}`
        if (image.resolution) {
          value += ` ${stringifyProperty(image.resolution)}`
        }
        if (image.type) {
          value += ` ${stringifyProperty(image.type)}`
        }
        if (index < property.imagesSet.length - 1) {
          value += ', '
        }
      })
      value += ')'
      return value
    }

    default:
      return ''
  }
}
