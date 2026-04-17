import type {
  StyleToken,
  StyleTokenCategory,
} from '@nordcraft/core/dist/styling/theme'
import type {
  angleUnits,
  lengthUnits,
  percentageUnits,
  resolutionUnits,
  STYLE_PROPERTIES,
} from './const'

type ParsedStyle = {
  background?: {
    images?: ParsedImageType[]
    color?: ParsedValueType
  } | null
  transition?:
    | {
        duration?: ParsedValueType
        delay?: ParsedValueType
        property?: ParsedValueType
        timing?: ParsedValueType
        behavior?: ParsedValueType
      }[]
    | null
  animation?: Animation[] | null
  boxShadow?: ParsedBoxShadow[] | null
  textShadow?: ParsedTextShadow[] | null
  margin?: {
    left: ParsedValueType | null
    right: ParsedValueType | null
    top: ParsedValueType | null
    bottom: ParsedValueType | null
  } | null
  padding?: {
    left: ParsedValueType | null
    right: ParsedValueType | null
    top: ParsedValueType | null
    bottom: ParsedValueType | null
  } | null
  translate?: ParsedTranslate | null
  scale?: ParsedScale | null
  rotate?: ParsedRotate | null
  perspective?: ParsedPerspective | null
  transform?: {
    all: ParsedTransform | null
    transformOrigin: {
      x: ParsedValueType | null
      y: ParsedValueType | null
      z: ParsedValueType | null
    } | null
    transformStyle?: ParsedValueType | null
    transformBox?: ParsedValueType | null
  } | null
  inset?: ParsedInset | null
  overflow?: ParsedOverflow | null
  outline?: ParsedBorderOutline | null
  border?: ParsedBorder | null
  borderRadius?: ParsedBorderRadius | null
  font?: ParsedFont | null
  flex?: ParsedFlex | null
  gap?: ParsedGap | null
  textDecoration?: ParsedTextDecoration | null
  color?: ParsedValueType | null
}

type ParsedTransformPerspective = {
  perspective: { distance?: ParsedValueType }
}

type ParsedMatrix =
  | {
      matrix3d: {
        a1?: ParsedValueType
        b1?: ParsedValueType
        c1?: ParsedValueType
        d1?: ParsedValueType
        a2?: ParsedValueType
        b2?: ParsedValueType
        c2?: ParsedValueType
        d2?: ParsedValueType
        a3?: ParsedValueType
        b3?: ParsedValueType
        c3?: ParsedValueType
        d3?: ParsedValueType
        a4?: ParsedValueType
        b4?: ParsedValueType
        c4?: ParsedValueType
        d4?: ParsedValueType
      }
    }
  | {
      matrix: {
        a?: ParsedValueType
        b?: ParsedValueType
        c?: ParsedValueType
        d?: ParsedValueType
        x?: ParsedValueType
        y?: ParsedValueType
      }
    }

type ParsedTransformSkew =
  | {
      skew: {
        x?: ParsedValueType
        y?: ParsedValueType
      }
    }
  | {
      skewX: {
        x?: ParsedValueType
      }
    }
  | {
      skewY: {
        y?: ParsedValueType
      }
    }
  | {
      skewZ: {
        z?: ParsedValueType
      }
    }

type ParsedTransformScale =
  | {
      scale3d: {
        x?: ParsedValueType
        y?: ParsedValueType
        z?: ParsedValueType
      }
    }
  | {
      scaleX: {
        x?: ParsedValueType
      }
    }
  | {
      scaleY: {
        y?: ParsedValueType
      }
    }
  | {
      scaleZ: {
        z?: ParsedValueType
      }
    }
  | {
      scale: {
        x?: ParsedValueType
        y?: ParsedValueType
      }
    }

type ParsedTransformTranslate =
  | {
      translate3d: {
        x?: ParsedValueType
        y?: ParsedValueType
        z?: ParsedValueType
        angle?: ParsedValueType
      }
    }
  | {
      translateX: {
        x?: ParsedValueType
      }
    }
  | {
      translateY: {
        y?: ParsedValueType
      }
    }
  | {
      translateZ: {
        z?: ParsedValueType
      }
    }
  | {
      translate: {
        x?: ParsedValueType
        y?: ParsedValueType
      }
    }

type ParsedTransformRotate =
  | {
      rotate3d: {
        x?: ParsedValueType
        y?: ParsedValueType
        z?: ParsedValueType
        angle?: ParsedValueType
      }
    }
  | {
      rotateX: {
        angle?: ParsedValueType
      }
    }
  | {
      rotateY: {
        angle?: ParsedValueType
      }
    }
  | {
      rotateZ: {
        angle?: ParsedValueType
      }
    }
  | {
      rotate: {
        angle?: ParsedValueType
      }
    }

type ParsedTransform = Array<
  | ParsedTransformRotate
  | ParsedTransformScale
  | ParsedTransformTranslate
  | ParsedTransformSkew
  | ParsedTransformRotate
  | ParsedTransformPerspective
  | ParsedMatrix
>

type Animation = {
  duration?: ParsedValueType
  timing?: ParsedValueType
  delay?: ParsedValueType
  iterationCount?: ParsedValueType
  direction?: ParsedValueType
  fillMode?: ParsedValueType
  playState?: ParsedValueType
  name?: ParsedValueType
}

type ParsedBoxShadow = {
  horizontal?: ParsedValueType
  vertical?: ParsedValueType
  blur?: ParsedValueType
  spread?: ParsedValueType
  color?: ParsedValueType
  position?: ParsedValueType
}

type ParsedTextShadow = {
  horizontal?: ParsedValueType
  vertical?: ParsedValueType
  blur?: ParsedValueType
  color?: ParsedValueType
}

type ParsedTranslate =
  | {
      type: 'keyword'
      value: string
    }
  | {
      type: 'axis'
      x?: ParsedValueType
      y?: ParsedValueType
      z?: ParsedValueType
    }

type ParsedScale =
  | {
      type: 'keyword'
      value: string
    }
  | {
      type: 'axis'
      x?: ParsedValueType
      y?: ParsedValueType
      z?: ParsedValueType
    }

type ParsedRotate =
  | {
      type: 'keyword'
      value: string
    }
  | {
      type: 'axis'
      x?: ParsedValueType
      y?: ParsedValueType
      z?: ParsedValueType
      angle?: ParsedValueType
    }

type ParsedPerspective =
  | {
      type: 'keyword'
      value: string
    }
  | ParsedValueType

type ParsedInset = {
  top: ParsedValueType | null
  bottom: ParsedValueType | null
  left: ParsedValueType | null
  right: ParsedValueType | null
}

type ParsedOverflow = {
  x?: ParsedValueType
  y?: ParsedValueType
}

type ParsedBorderOutline = {
  width?: ParsedValueType
  style?: ParsedValueType
  color?: ParsedValueType
}

type ParsedBorder = {
  all?: ParsedBorderOutline
  top?: ParsedBorderOutline
  bottom?: ParsedBorderOutline
  left?: ParsedBorderOutline
  right?: ParsedBorderOutline
}
type BorderRadiusDirection = {
  horizontal?: ParsedValueType
  vertical?: ParsedValueType
}

type ParsedBorderRadius = {
  topLeft?: BorderRadiusDirection
  topRight?: BorderRadiusDirection
  bottomLeft?: BorderRadiusDirection
  bottomRight?: BorderRadiusDirection
} | null

type ParsedFontProperty = Exclude<
  ParsedValueType,
  {
    type: 'functionArguments'
    name: string
    arguments: ParsedValueType[]
  }
>

type ParsedFont = {
  family: ParsedFontProperty[]
  size?: ParsedFontProperty
  stretch?: ParsedFontProperty
  style?: {
    angle?: ParsedFontProperty
    style?: ParsedFontProperty
  }
  variant?: ParsedFontProperty
  weight?: ParsedFontProperty
  lineHeight?: ParsedFontProperty
}

type ParsedFlex = {
  grow?: ParsedValueType
  shrink?: ParsedValueType
  basis?: ParsedValueType
}

type ParsedGap = {
  row?: ParsedValueType
  column?: ParsedValueType
}

type ParsedTextDecoration = {
  line?: ParsedValueType[]
  style?: ParsedValueType
  color?: ParsedValueType
  thickness?: ParsedValueType
}

export type ThemeVariables = Partial<
  Record<StyleTokenCategory, CSSStyleToken[]>
>

export type CSSStyleToken = StyleToken & {
  category: StyleTokenCategory
  unit?: string | null
}

export type getValueType =
  | {
      type: 'function'
      name: string
      value: string | getValueType | getValueType[] | null
    }
  | {
      type: 'string'
      value: string
      quote: "'" | '"'
    }
  | {
      type: 'word'
      value: string
    }
  | {
      type: 'functionParam'
      value: getValueType[] | null
    }

export type ParsedValueType =
  | {
      type: 'number' | 'hex' | 'slash' | 'keyword' | 'integer'
      value: string
    }
  | {
      type: 'string'
      value: string
      quote?: "'" | '"'
    }
  | {
      type: 'length'
      unit: LengthType
      value: string
    }
  | {
      type: 'percentage'
      unit: PercentageType
      value: string
    }
  | {
      type: 'length-percentage'
      unit: LengthType | PercentageType
      value: string
    }
  | {
      type: 'angle'
      unit: AngleType
      value: string
    }
  | {
      type: 'resolution'
      unit: ResolutionType
      value: string
    }
  | {
      type: 'time'
      unit: 's' | 'ms'
      value: string
    }
  | {
      type: 'function'
      name: string
      value: string
    }
  | {
      type: 'functionArguments'
      name: string
      arguments: ParsedValueType[]
    }

export type LengthType = (typeof lengthUnits)[number]
export type PercentageType = (typeof percentageUnits)[number]
export type AngleType = (typeof angleUnits)[number]
export type ResolutionType = (typeof resolutionUnits)[number]

export type ParsedBlock = {
  type: 'block'
  nodes: NodeTypes[]
}

export type NodeTypes =
  | { type: 'unicode-range' | 'word' | 'div'; value: string }
  | {
      type: 'string'
      quote: "'" | '"'
      value: string
      unclosed?: boolean
    }
  | {
      type: 'function' | 'comment'
      unclosed?: boolean
      value: string
      nodes: NodeTypes[]
    }
  | {
      type: 'functionParam'
      nodes: NodeTypes[]
    }

export type BackgroundPositionType = {
  x?: { align?: ParsedValueType; offset?: ParsedValueType }
  y?: { align?: ParsedValueType; offset?: ParsedValueType }
}

export type ParsedConicGradientType = {
  type: 'conic-function'
  name: 'conic-gradient' | 'repeating-conic-gradient'
  angle?: ParsedValueType
  position?: BackgroundPositionType
  stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
  }[]
  interpolation?: ParsedValueType
  invalidValues: ParsedValueType[]
}

export type ParsedRadialGradientType = {
  type: 'radial-function'
  name: 'radial-gradient' | 'repeating-radial-gradient'
  shape?: ParsedValueType
  size?: ParsedValueType
  position?: BackgroundPositionType
  stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
  }[]
  interpolation?: ParsedValueType
  invalidValues: ParsedValueType[]
}

export type ParsedLinearGradientType = {
  type: 'linear-function'
  name: 'linear-gradient' | 'repeating-linear-gradient'
  direction?: ParsedValueType
  stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
    midpoint?: ParsedValueType
  }[]
  interpolation?: ParsedValueType
  invalidValues: ParsedValueType[]
}

export type ImagesSetType = {
  image:
    | Omit<ParsedConicGradientType, 'invalidValues'>
    | Omit<ParsedLinearGradientType, 'invalidValues'>
    | Omit<ParsedRadialGradientType, 'invalidValues'>
    | ParsedValueType
  type?: ParsedValueType
  resolution?: ParsedValueType
}

export type ParsedImageSetType = {
  type: 'image-set-function'
  name: 'image-set'
  imagesSet: ImagesSetType[]
  invalidValues: ParsedValueType[]
}

export type ParsedImageType = {
  image?:
    | Omit<ParsedConicGradientType, 'invalidValues'>
    | Omit<ParsedLinearGradientType, 'invalidValues'>
    | Omit<ParsedRadialGradientType, 'invalidValues'>
    | Omit<ParsedImageSetType, 'invalidValues'>
    | ParsedValueType
  repeat?: {
    horizontal?: ParsedValueType
    vertical?: ParsedValueType
  }
  position?: BackgroundPositionType
  size?:
    | ParsedValueType
    | { type: 'widthHeight'; width: ParsedValueType; height?: ParsedValueType }
  origin?: ParsedValueType
  clip?: ParsedValueType
  attachment?: ParsedValueType
}

export type StringifiedStyle = Partial<
  Record<keyof typeof STYLE_PROPERTIES, string>
>
