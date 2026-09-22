import { describe, expect, test } from 'bun:test'
import '../happydom'
import { getRectData } from './overlay'

describe('getRectData()', () => {
  test('it returns null if node is null', () => {
    expect(getRectData(null)).toBeNull()
  })

  test('it returns rect data for standard block elements', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    // Mock getBoundingClientRect
    el.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      right: 110,
      bottom: 70,
      width: 100,
      height: 50,
      x: 10,
      y: 20,
      toJSON: () => {},
    })

    const data = getRectData(el)
    expect(data).not.toBeNull()
    expect(data!.width).toBe(100)
    expect(data!.height).toBe(50)
    expect(data!.left).toBe(10)
    expect(data!.top).toBe(20)

    document.body.removeChild(el)
  })

  test('it uses Range bounding box for span (inline) elements containing text', () => {
    const span = document.createElement('span')
    span.textContent = 'Hello world'
    span.style.display = 'inline'
    document.body.appendChild(span)

    // Mock getBoundingClientRect for range
    const mockRangeRect = {
      left: 15,
      top: 25,
      right: 95,
      bottom: 45,
      width: 80,
      height: 20,
      x: 15,
      y: 25,
      toJSON: () => {},
    }

    // Mock Range object
    const originalCreateRange = document.createRange
    document.createRange = () => {
      const range = originalCreateRange.call(document)
      range.getBoundingClientRect = () => mockRangeRect
      return range
    }

    const data = getRectData(span)
    expect(data).not.toBeNull()
    expect(data!.width).toBe(80)
    expect(data!.height).toBe(20)
    expect(data!.left).toBe(15)
    expect(data!.top).toBe(25)

    // Restore Range mock
    document.createRange = originalCreateRange
    document.body.removeChild(span)
  })

  test('it correctly positions elements with rotation using inverse matrix representation', () => {
    const parent = document.createElement('div')
    const child = document.createElement('span')
    parent.appendChild(child)
    document.body.appendChild(parent)

    // Let's mock getComputedStyle for parent to return a rotated state
    const originalGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = (el) => {
      const style = originalGetComputedStyle(el)
      if (el === parent) {
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'transform') {
              return 'matrix(0.866025, 0.5, -0.5, 0.866025, 0, 0)' // cos(30) = 0.866025, sin(30) = 0.5
            }
            if (prop === 'rotate') {
              return 'none'
            }
            const val = Reflect.get(target, prop, target)
            return typeof val === 'function' ? val.bind(target) : val
          },
        })
      }
      return style
    }

    // Let's mock getBoundingClientRect of child as the rotated box of some unrotated 100x50 element
    // Rotated by 30 degrees, unrotated center is at (100, 100).
    // So unrotated box is 50 to 150 on X, 75 to 125 on Y.
    // The rotated bounding box will be wider and taller. Let's calculate its rotated bounds:
    // cx = 100, cy = 100
    // width_unrotated = 100, height_unrotated = 50
    // w = 100, h = 50
    // W = w * cos(30) + h * sin(30) = 100 * 0.866025 + 50 * 0.5 = 86.6025 + 25 = 111.6025
    // H = w * sin(30) + h * cos(30) = 100 * 0.5 + 50 * 0.866025 = 50 + 43.30125 = 93.30125
    child.getBoundingClientRect = () => ({
      left: 100 - 111.6025 / 2, // 100 - 55.80125 = 44.19875
      top: 100 - 93.30125 / 2, // 100 - 46.650625 = 53.349375
      right: 100 + 111.6025 / 2,
      bottom: 100 + 93.30125 / 2,
      width: 111.6025,
      height: 93.30125,
      x: 100 - 111.6025 / 2,
      y: 100 - 93.30125 / 2,
      toJSON: () => {},
    })

    const data = getRectData(child)

    // Restore mock
    window.getComputedStyle = originalGetComputedStyle
    document.body.removeChild(parent)

    expect(data).not.toBeNull()
    // The calculated unrotated box width and height should be extremely close to 100 and 50 respectively
    expect(Math.abs(data!.width - 100)).toBeLessThan(0.1)
    expect(Math.abs(data!.height - 50)).toBeLessThan(0.1)
    expect(Math.abs(data!.left - 50)).toBeLessThan(0.1)
    expect(Math.abs(data!.top - 75)).toBeLessThan(0.1)
  })

  test.each([45, 135, 225, 315])(
    'it correctly calculates rect for elements rotated to %ddeg',
    (deg) => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      Object.defineProperty(el, 'offsetWidth', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(el, 'offsetHeight', {
        value: 50,
        configurable: true,
      })

      const rad = (deg * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const a = Math.abs(cos)
      const c = Math.abs(sin)
      const b = Math.abs(sin)
      const d = Math.abs(cos)

      // Unrotated: 100x50 centered at (100, 100)
      const W = 100 * a + 50 * c
      const H = 100 * b + 50 * d

      const originalGetComputedStyle = window.getComputedStyle
      window.getComputedStyle = (node) => {
        const style = originalGetComputedStyle(node)
        if (node === el) {
          return new Proxy(style, {
            get(target, prop) {
              if (prop === 'transform') {
                return `matrix(${cos}, ${sin}, ${-sin}, ${cos}, 0, 0)`
              }
              if (prop === 'rotate') {
                return 'none'
              }
              const val = Reflect.get(target, prop, target)
              return typeof val === 'function' ? val.bind(target) : val
            },
          })
        }
        return style
      }

      el.getBoundingClientRect = () => ({
        left: 100 - W / 2,
        top: 100 - H / 2,
        right: 100 + W / 2,
        bottom: 100 + H / 2,
        width: W,
        height: H,
        x: 100 - W / 2,
        y: 100 - H / 2,
        toJSON: () => {},
      })

      const data = getRectData(el)

      window.getComputedStyle = originalGetComputedStyle
      document.body.removeChild(el)

      expect(data).not.toBeNull()
      expect(Math.abs(data!.width - 100)).toBeLessThan(0.1)
      expect(Math.abs(data!.height - 50)).toBeLessThan(0.1)
      expect(Math.abs(data!.left - 50)).toBeLessThan(0.1)
      expect(Math.abs(data!.top - 75)).toBeLessThan(0.1)
    },
  )

  test('it correctly calculates rect for elements with both scale and 45deg rotation', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    Object.defineProperty(el, 'offsetWidth', {
      value: 100,
      configurable: true,
    })
    Object.defineProperty(el, 'offsetHeight', {
      value: 50,
      configurable: true,
    })

    const scaleX = 2
    const scaleY = 2
    const rad = (45 * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const a = Math.abs(cos)
    const c = Math.abs(sin)
    const b = Math.abs(sin)
    const d = Math.abs(cos)

    const scaledW = 100 * scaleX
    const scaledH = 50 * scaleY
    const W = scaledW * a + scaledH * c
    const H = scaledW * b + scaledH * d

    const originalGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = (node) => {
      const style = originalGetComputedStyle(node)
      if (node === el) {
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'transform') {
              return `matrix(${cos * scaleX}, ${sin * scaleX}, ${-sin * scaleY}, ${cos * scaleY}, 0, 0)`
            }
            if (prop === 'rotate') {
              return 'none'
            }
            const val = Reflect.get(target, prop, target)
            return typeof val === 'function' ? val.bind(target) : val
          },
        })
      }
      return style
    }

    el.getBoundingClientRect = () => ({
      left: 100 - W / 2,
      top: 100 - H / 2,
      right: 100 + W / 2,
      bottom: 100 + H / 2,
      width: W,
      height: H,
      x: 100 - W / 2,
      y: 100 - H / 2,
      toJSON: () => {},
    })

    const data = getRectData(el)

    window.getComputedStyle = originalGetComputedStyle
    document.body.removeChild(el)

    expect(data).not.toBeNull()
    expect(Math.abs(data!.width - 200)).toBeLessThan(0.1)
    expect(Math.abs(data!.height - 100)).toBeLessThan(0.1)
    expect(Math.abs(data!.left - 0)).toBeLessThan(0.1)
    expect(Math.abs(data!.top - 50)).toBeLessThan(0.1)
  })

  describe('shorthand transforms combined with transform: skew', () => {
    function testTransformedElement(styles: {
      rotate?: string
      transform?: string
      scale?: string
      translate?: string
    }) {
      const W = 100
      const H = 50
      const el = document.createElement('div')
      document.body.appendChild(el)
      Object.defineProperty(el, 'offsetWidth', {
        value: W,
        configurable: true,
      })
      Object.defineProperty(el, 'offsetHeight', {
        value: H,
        configurable: true,
      })

      const origGetComputedStyle = window.getComputedStyle
      window.getComputedStyle = (node) => {
        const s = origGetComputedStyle(node)
        if (node === el) {
          return new Proxy(s, {
            get(t, p) {
              if (typeof p === 'string' && p in styles) {
                return (styles as Record<string, string>)[p]
              }
              const val = Reflect.get(t, p, t)
              return typeof val === 'function' ? val.bind(t) : val
            },
          })
        }
        return s
      }

      const parseAngle = (token: string) => {
        if (token.endsWith('turn')) return parseFloat(token) * 360
        if (token.endsWith('rad')) return (parseFloat(token) * 180) / Math.PI
        if (token.endsWith('grad')) return parseFloat(token) * 0.9
        return parseFloat(token) || 0
      }
      const parseRotate = (v?: string) => {
        const m = new DOMMatrix()
        if (!v || v === 'none') return m
        const p = v.trim().split(/\s+/)
        if (p.length === 1) return m.rotateSelf(0, 0, parseAngle(p[0]))
        if (p.length === 2) {
          const isFirstAxis = ['x', 'y', 'z'].includes(p[0].toLowerCase())
          const axis = (isFirstAxis ? p[0] : p[1]).toLowerCase()
          const angle = parseAngle(isFirstAxis ? p[1] : p[0])
          return m.rotateSelf(
            axis === 'x' ? angle : 0,
            axis === 'y' ? angle : 0,
            axis === 'z' ? angle : 0,
          )
        }
        if (p.length === 4) {
          let x: number, y: number, z: number, angle: number
          if (
            p[0].includes('deg') ||
            p[0].includes('rad') ||
            p[0].includes('turn') ||
            p[0].includes('grad')
          ) {
            angle = parseAngle(p[0])
            ;[x, y, z] = p.slice(1).map(parseFloat)
          } else {
            angle = parseAngle(p[3])
            ;[x, y, z] = p.slice(0, 3).map(parseFloat)
          }
          return m.rotateAxisAngleSelf(x, y, z, angle)
        }
        return m
      }
      const parseScale = (v?: string) => {
        const m = new DOMMatrix()
        if (!v || v === 'none') return m
        const tok = v.trim().split(/\s+/)
        const num = (t: string) =>
          t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t)
        const x = num(tok[0])
        const y = tok[1] !== undefined ? num(tok[1]) : x
        const z = tok[2] !== undefined ? num(tok[2]) : 1
        return m.scaleSelf(x, y, z)
      }
      const parseTranslate = (v?: string) => {
        const m = new DOMMatrix()
        if (!v || v === 'none') return m
        const p = v.trim().split(/\s+/)
        return m.translateSelf(
          parseFloat(p[0]) || 0,
          parseFloat(p[1]) || 0,
          parseFloat(p[2]) || 0,
        )
      }

      const trM = parseTranslate(styles.translate)
      const rotM = parseRotate(styles.rotate)
      const scM = parseScale(styles.scale)
      const tfM =
        styles.transform && styles.transform !== 'none'
          ? new DOMMatrix(styles.transform)
          : new DOMMatrix()

      const ctm = trM.multiply(rotM).multiply(scM).multiply(tfM)

      const cx = 150
      const cy = 125
      const localCorners = [
        new DOMPoint(-W / 2, -H / 2),
        new DOMPoint(W / 2, -H / 2),
        new DOMPoint(W / 2, H / 2),
        new DOMPoint(-W / 2, H / 2),
      ]
      const targetCorners = localCorners.map((p) => {
        const pt = ctm.transformPoint(p)
        return { x: cx + pt.x, y: cy + pt.y }
      })

      const xs = targetCorners.map((p) => p.x)
      const ys = targetCorners.map((p) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      el.getBoundingClientRect = () => ({
        left: minX,
        top: minY,
        right: maxX,
        bottom: maxY,
        width: maxX - minX,
        height: maxY - minY,
        x: minX,
        y: minY,
        toJSON: () => {},
      })

      const data = getRectData(el)

      const oMatrix = new DOMMatrix(data!.rotate)
      const oCenterX = data!.left + data!.width / 2
      const oCenterY = data!.top + data!.height / 2

      const overlayCorners = [
        new DOMPoint(-data!.width / 2, -data!.height / 2),
        new DOMPoint(data!.width / 2, -data!.height / 2),
        new DOMPoint(data!.width / 2, data!.height / 2),
        new DOMPoint(-data!.width / 2, data!.height / 2),
      ].map((p) => {
        const pt = oMatrix.transformPoint(p)
        return { x: oCenterX + pt.x, y: oCenterY + pt.y }
      })

      let maxCornerDiff = 0
      for (let i = 0; i < 4; i++) {
        const d = Math.hypot(
          overlayCorners[i].x - targetCorners[i].x,
          overlayCorners[i].y - targetCorners[i].y,
        )
        maxCornerDiff = Math.max(maxCornerDiff, d)
      }

      window.getComputedStyle = origGetComputedStyle
      document.body.removeChild(el)

      return { data: data!, maxCornerDiff }
    }

    test('it matches overlay when rotate shorthand and transform: skewX are applied', () => {
      const { data, maxCornerDiff } = testTransformedElement({
        rotate: '30deg',
        transform: 'skewX(20deg)',
        scale: 'none',
        translate: 'none',
      })
      expect(Math.abs(data.width - 100)).toBeLessThan(0.1)
      expect(Math.abs(data.height - 50)).toBeLessThan(0.1)
      expect(maxCornerDiff).toBeLessThan(0.1)
    })

    test('it matches overlay at 45deg rotation with transform: skewX', () => {
      const { data, maxCornerDiff } = testTransformedElement({
        rotate: '45deg',
        transform: 'skewX(20deg)',
        scale: 'none',
        translate: 'none',
      })
      expect(Math.abs(data.width - 100)).toBeLessThan(0.1)
      expect(Math.abs(data.height - 50)).toBeLessThan(0.1)
      expect(maxCornerDiff).toBeLessThan(0.1)
    })

    test('it matches overlay when rotate shorthand and transform: skewY are applied', () => {
      const { maxCornerDiff } = testTransformedElement({
        rotate: '30deg',
        transform: 'skewY(20deg)',
        scale: 'none',
        translate: 'none',
      })
      expect(maxCornerDiff).toBeLessThan(0.1)
    })

    test('it matches overlay when rotate shorthand and transform: skew(x, y) are applied', () => {
      const { maxCornerDiff } = testTransformedElement({
        rotate: '45deg',
        transform: 'skew(15deg, 15deg)',
        scale: 'none',
        translate: 'none',
      })
      expect(maxCornerDiff).toBeLessThan(0.1)
    })

    test('it matches overlay when scale, rotate shorthands and transform: skew are mixed', () => {
      const { data, maxCornerDiff } = testTransformedElement({
        rotate: '45deg',
        scale: '2',
        transform: 'skewX(20deg)',
        translate: 'none',
      })
      expect(Math.abs(data.width - 200)).toBeLessThan(0.1)
      expect(Math.abs(data.height - 100)).toBeLessThan(0.1)
      expect(maxCornerDiff).toBeLessThan(0.1)
    })

    test('it matches overlay with non-uniform scale and rotate with transform: skew', () => {
      const { data, maxCornerDiff } = testTransformedElement({
        rotate: '30deg',
        scale: '1.5 2',
        transform: 'skewX(20deg)',
        translate: 'none',
      })
      expect(Math.abs(data.width - 150)).toBeLessThan(0.1)
      expect(Math.abs(data.height - 100)).toBeLessThan(0.1)
      expect(maxCornerDiff).toBeLessThan(0.1)
    })

    test('it matches overlay when translate shorthand is mixed with rotate and transform: skew', () => {
      const { data, maxCornerDiff } = testTransformedElement({
        translate: '40px -20px',
        rotate: '30deg',
        transform: 'skewX(20deg)',
        scale: 'none',
      })
      expect(Math.abs(data.width - 100)).toBeLessThan(0.1)
      expect(Math.abs(data.height - 50)).toBeLessThan(0.1)
      expect(maxCornerDiff).toBeLessThan(0.1)
    })

    test('it parses rotate angles with turn and rad units correctly with transform: skew', () => {
      const turnResult = testTransformedElement({
        rotate: '0.25turn',
        transform: 'skewX(20deg)',
        scale: 'none',
        translate: 'none',
      })
      expect(turnResult.maxCornerDiff).toBeLessThan(0.1)

      const radResult = testTransformedElement({
        rotate: '1.5707963267948966rad',
        transform: 'skewX(20deg)',
        scale: 'none',
        translate: 'none',
      })
      expect(radResult.maxCornerDiff).toBeLessThan(0.1)
    })

    test('it parses axis-specified rotate shorthand with transform: skew', () => {
      const zResult = testTransformedElement({
        rotate: 'z 45deg',
        transform: 'skewX(20deg)',
        scale: 'none',
        translate: 'none',
      })
      expect(zResult.maxCornerDiff).toBeLessThan(0.1)

      const vectorResult = testTransformedElement({
        rotate: '0 0 1 45deg',
        transform: 'skewX(20deg)',
        scale: 'none',
        translate: 'none',
      })
      expect(vectorResult.maxCornerDiff).toBeLessThan(0.1)
    })
  })

  describe('perspective-transformed elements center calculation', () => {
    function testPerspectiveElement(config: {
      perspective: string
      perspectiveOrigin: string
      transform: string
      cxActual: number
      cyActual: number
    }) {
      const container = document.createElement('div')
      const child = document.createElement('div')
      container.appendChild(child)
      document.body.appendChild(container)

      const W = 100
      const H = 100
      Object.defineProperty(child, 'offsetWidth', {
        value: W,
        configurable: true,
      })
      Object.defineProperty(child, 'offsetHeight', {
        value: H,
        configurable: true,
      })
      Object.defineProperty(container, 'offsetWidth', {
        value: 400,
        configurable: true,
      })
      Object.defineProperty(container, 'offsetHeight', {
        value: 400,
        configurable: true,
      })

      const d = parseFloat(config.perspective)
      const matrix = new DOMMatrix(config.transform)

      const [oxToken = '50%', oyToken = '50%'] = config.perspectiveOrigin
        .trim()
        .split(/\s+/)
      const resolve = (tok: string, sz: number) =>
        tok.endsWith('%') ? (parseFloat(tok) / 100) * sz : parseFloat(tok) || 0
      const ox = 100 + resolve(oxToken, 400)
      const oy = 100 + resolve(oyToken, 400)

      const localCorners = [
        new DOMPoint(-W / 2, -H / 2, 0),
        new DOMPoint(W / 2, -H / 2, 0),
        new DOMPoint(W / 2, H / 2, 0),
        new DOMPoint(-W / 2, H / 2, 0),
      ]

      const projectedCorners = localCorners.map((p) => {
        const t = matrix.transformPoint(p)
        const X_3d = config.cxActual + t.x
        const Y_3d = config.cyActual + t.y
        const Z_3d = t.z
        const s = d / (d - Z_3d)
        return {
          x: ox + (X_3d - ox) * s,
          y: oy + (Y_3d - oy) * s,
        }
      })

      const xs = projectedCorners.map((p) => p.x)
      const ys = projectedCorners.map((p) => p.y)
      const childBoundingRect = {
        left: Math.min(...xs),
        right: Math.max(...xs),
        top: Math.min(...ys),
        bottom: Math.max(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
        x: Math.min(...xs),
        y: Math.min(...ys),
        toJSON: () => {},
      }

      container.getBoundingClientRect = () => ({
        left: 100,
        top: 100,
        right: 500,
        bottom: 500,
        width: 400,
        height: 400,
        x: 100,
        y: 100,
        toJSON: () => {},
      })

      child.getBoundingClientRect = () => childBoundingRect

      const origGetComputedStyle = window.getComputedStyle
      window.getComputedStyle = (node) => {
        const s = origGetComputedStyle(node)
        if (node === container) {
          return new Proxy(s, {
            get(t, p) {
              if (p === 'perspective') return config.perspective
              if (p === 'perspectiveOrigin') return config.perspectiveOrigin
              if (p === 'transform') return 'none'
              if (p === 'rotate') return 'none'
              if (p === 'scale') return 'none'
              if (p === 'translate') return 'none'
              const val = Reflect.get(t, p, t)
              return typeof val === 'function' ? val.bind(t) : val
            },
          })
        }
        if (node === child) {
          return new Proxy(s, {
            get(t, p) {
              if (p === 'transform') return config.transform
              if (p === 'perspective') return 'none'
              if (p === 'rotate') return 'none'
              if (p === 'scale') return 'none'
              if (p === 'translate') return 'none'
              const val = Reflect.get(t, p, t)
              return typeof val === 'function' ? val.bind(t) : val
            },
          })
        }
        return s
      }

      const data = getRectData(child)

      window.getComputedStyle = origGetComputedStyle
      document.body.removeChild(container)

      const cx = data!.left + data!.width / 2
      const cy = data!.top + data!.height / 2
      const aabbCx = childBoundingRect.left + childBoundingRect.width / 2
      const aabbCy = childBoundingRect.top + childBoundingRect.height / 2

      return { cx, cy, aabbCx, aabbCy, data: data! }
    }

    test('it calculates the rect centre matching perspective instead of client bounding rect centre', () => {
      const { cx, cy, aabbCx, aabbCy } = testPerspectiveElement({
        perspective: '500px',
        perspectiveOrigin: '50% 50%',
        transform: 'rotateY(60deg)',
        cxActual: 250,
        cyActual: 250,
      })

      // The AABB centre is shifted from the true centre by ~2.56px on X and ~4.74px on Y
      expect(Math.abs(aabbCx - 250)).toBeGreaterThan(2)
      expect(Math.abs(aabbCy - 250)).toBeGreaterThan(4)

      // The recovered centre must match the actual untransformed centre
      expect(Math.abs(cx - 250)).toBeLessThan(0.01)
      expect(Math.abs(cy - 250)).toBeLessThan(0.01)
    })

    test('it handles asymmetric perspective-origin correctly', () => {
      const { cx, cy, aabbCx, aabbCy } = testPerspectiveElement({
        perspective: '500px',
        perspectiveOrigin: '25% 75%',
        transform: 'rotateY(60deg)',
        cxActual: 250,
        cyActual: 250,
      })

      expect(Math.abs(aabbCx - 250)).toBeGreaterThan(1)
      expect(Math.abs(aabbCy - 250)).toBeGreaterThan(5)
      expect(Math.abs(cx - 250)).toBeLessThan(0.01)
      expect(Math.abs(cy - 250)).toBeLessThan(0.01)
    })
  })
})
