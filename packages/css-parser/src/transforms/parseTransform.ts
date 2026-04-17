import { getValue, parse, parseMultipleValues } from '../shared'
import type { ParsedTransform, ParsedValueType } from '../types'

const parseTransformAll = (transforms?: ParsedValueType[]) => {
  if (!transforms) {
    return []
  }

  return transforms.reduce<ParsedTransform>((result, transform) => {
    if (transform.type === 'functionArguments') {
      switch (transform.name) {
        // rotate
        case 'rotate3d':
          return [
            ...result,
            {
              [transform.name]: {
                x: transform.arguments[0],
                y: transform.arguments[1],
                z: transform.arguments[2],
                angle: transform.arguments[3],
              },
            },
          ]
        case 'rotateX':
          return [
            ...result,
            {
              [transform.name]: {
                angle: transform.arguments[0],
              },
            },
          ]
        case 'rotateY':
          return [
            ...result,
            {
              [transform.name]: {
                angle: transform.arguments[0],
              },
            },
          ]
        case 'rotateZ':
          return [
            ...result,
            {
              [transform.name]: {
                angle: transform.arguments[0],
              },
            },
          ]
        case 'rotate':
          return [
            ...result,
            {
              [transform.name]: {
                angle: transform.arguments[0],
              },
            },
          ]

        // translate
        case 'translate3d':
          return [
            ...result,
            {
              [transform.name]: {
                x: transform.arguments[0],
                y: transform.arguments[1],
                z: transform.arguments[2],
              },
            },
          ]
        case 'translateX':
          return [
            ...result,
            {
              [transform.name]: {
                x: transform.arguments[0],
              },
            },
          ]
        case 'translateY':
          return [
            ...result,
            {
              [transform.name]: {
                y: transform.arguments[0],
              },
            },
          ]
        case 'translateZ':
          return [
            ...result,
            {
              [transform.name]: {
                z: transform.arguments[0],
              },
            },
          ]
        case 'translate':
          return [
            ...result,
            {
              [transform.name]: {
                x: transform.arguments[0],
                y: transform.arguments[1],
              },
            },
          ]

        // scale
        case 'scale3d':
          return [
            ...result,
            {
              [transform.name]: {
                x: transform.arguments[0],
                y: transform.arguments[1],
                z: transform.arguments[2],
              },
            },
          ]
        case 'scaleX':
          return [
            ...result,
            {
              [transform.name]: {
                x: transform.arguments[0],
              },
            },
          ]
        case 'scaleY':
          return [
            ...result,
            {
              [transform.name]: {
                y: transform.arguments[0],
              },
            },
          ]
        case 'scaleZ':
          return [
            ...result,
            {
              [transform.name]: {
                z: transform.arguments[0],
              },
            },
          ]
        case 'scale':
          return [
            ...result,
            {
              [transform.name]: {
                x: transform.arguments[0],
                y: transform.arguments[1] ?? transform.arguments[0],
              },
            },
          ]

        // skew
        case 'skew':
          return [
            ...result,
            {
              [transform.name]: {
                x: transform.arguments[0],
                y: transform.arguments[1] ?? transform.arguments[0],
              },
            },
          ]
        case 'skewX':
          return [
            ...result,
            {
              [transform.name]: {
                x: transform.arguments[0],
              },
            },
          ]
        case 'skewY':
          return [
            ...result,
            {
              [transform.name]: {
                y: transform.arguments[0],
              },
            },
          ]

        // matrix
        case 'matrix3d':
          return [
            ...result,
            {
              [transform.name]: {
                a1: transform.arguments[0],
                b1: transform.arguments[1],
                c1: transform.arguments[2],
                d1: transform.arguments[3],
                a2: transform.arguments[4],
                b2: transform.arguments[5],
                c2: transform.arguments[6],
                d2: transform.arguments[7],
                a3: transform.arguments[8],
                b3: transform.arguments[9],
                c3: transform.arguments[10],
                d3: transform.arguments[11],
                a4: transform.arguments[12],
                b4: transform.arguments[13],
                c4: transform.arguments[14],
                d4: transform.arguments[15],
              },
            },
          ]
        case 'matrix':
          return [
            ...result,
            {
              [transform.name]: {
                a: transform.arguments[0],
                b: transform.arguments[1],
                c: transform.arguments[2],
                d: transform.arguments[3],
                x: transform.arguments[4],
                y: transform.arguments[5],
              },
            },
          ]

        // perspective
        case 'perspective':
          return [
            ...result,
            { [transform.name]: { distance: transform.arguments[0] } },
          ]
      }
    }

    return result
  }, [])
}

export const parseTransform = (style: Record<string, any>) => {
  if (
    style.transform !== '' ||
    style['transform-origin'] !== '' ||
    style['transform-style'] !== '' ||
    style['transform-box'] !== ''
  ) {
    const transform = parse({ input: style.transform })
    const transformOrigin = parse({ input: style['transform-origin'] })
    const transformStyle = parse({ input: style['transform-style'] })
    const transformBox = parse({ input: style['transform-box'] })

    return {
      all: parseTransformAll(parseMultipleValues(getValue(transform[0], true))),
      transformOrigin: {
        x: parseMultipleValues(getValue(transformOrigin[0]))[0] ?? null,
        y: parseMultipleValues(getValue(transformOrigin[0]))[1] ?? null,
        z: parseMultipleValues(getValue(transformOrigin[0]))[2] ?? null,
      },
      transformStyle:
        parseMultipleValues(getValue(transformStyle[0]))[0] ?? null,
      transformBox: parseMultipleValues(getValue(transformBox[0]))[0] ?? null,
    }
  }

  return {
    all: [],
    transformOrigin: null,
    transformStyle: null,
    transformBox: null,
  }
}
