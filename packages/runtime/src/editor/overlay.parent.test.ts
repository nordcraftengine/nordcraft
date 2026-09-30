import { afterEach, describe, expect, test } from 'bun:test'
import '../happydom'
import { getRectData } from './overlay'

/**
 * Ground-truth harness
 * --------------------
 * Builds a nested chain of <div>s (root -> ... -> node), computes what a
 * browser would really render using CSS semantics, mocks the DOM APIs
 * overlay.ts reads (getBoundingClientRect / offsetWidth / getComputedStyle),
 * and then checks that the overlay described by getRectData() lands on the
 * same four screen-space corners as the real element.
 *
 * CSS semantics modelled:
 *  - every element transforms about its own box centre (transform-origin: 50% 50%)
 *  - `perspective` on a parent applies to its children *in the parent's local
 *    frame*, i.e. BEFORE the parent's own transform
 *  - a parent without `transform-style: preserve-3d` flattens its children into
 *    its own plane (z is dropped between levels)
 */
type Spec = {
  cx: number // layout (untransformed) centre, page coordinates
  cy: number
  w: number
  h: number
  transform?: string
  perspective?: number
  perspectiveOrigin?: string
  preserve3d?: boolean
}

const T = (x: number, y: number) => new DOMMatrix().translateSelf(x, y, 0)
const about = (x: number, y: number, m: DOMMatrix) =>
  T(x, y).multiply(m).multiply(T(-x, -y))

function perspectiveMatrix(s: Spec) {
  const [fx, fy] = (s.perspectiveOrigin ?? '50% 50%')
    .split(/\s+/)
    .map((t) => parseFloat(t) / 100)
  const P = new DOMMatrix()
  P.m34 = -1 / s.perspective!
  return about(s.cx - s.w / 2 + fx * s.w, s.cy - s.h / 2 + fy * s.h, P)
}

function flatten(q: DOMMatrix) {
  const f = new DOMMatrix(q.toString())
  f.m13 = f.m23 = f.m33 = f.m43 = 0 // z output := 0, keep w (perspective)
  return f
}

/** layout space -> screen matrix for every element in the chain */
function worldMatrices(chain: Spec[]) {
  let acc = new DOMMatrix()
  return chain.map((s, i) => {
    const parent = chain[i - 1]
    let q = about(s.cx, s.cy, new DOMMatrix(s.transform ?? 'none'))
    if (parent?.perspective) q = perspectiveMatrix(parent).multiply(q)
    if (parent && !parent.preserve3d) q = flatten(q)
    acc = acc.multiply(q)
    return acc
  })
}

const project = (m: DOMMatrix, x: number, y: number, z = 0) => {
  const w = m.m14 * x + m.m24 * y + m.m34 * z + m.m44
  return {
    x: (m.m11 * x + m.m21 * y + m.m31 * z + m.m41) / w,
    y: (m.m12 * x + m.m22 * y + m.m32 * z + m.m42) / w,
  }
}
const CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((fn) => fn()))

type Extras = {
  /** extra leaf elements inside the last element of the chain (its `children`) */
  children?: Spec[]
  /** extra siblings of the last element with `data-id="0.0(n)"` (its `repeatItems`) */
  repeats?: Spec[]
}

/**
 * Mounts `chain` (root -> node) plus optional children / repeat siblings of the node.
 * Every element gets the DOM mocks for its own ground-truth rendering, so any of them
 * can be checked with `cornersOf(el)`.
 */
function mountChain(
  chain: Spec[],
  { children = [], repeats = [] }: Extras = {},
) {
  const els = chain.map(() => document.createElement('div'))
  els.forEach((el, i) => (i ? els[i - 1] : document.body).appendChild(el))
  const node = els[els.length - 1]
  const host = els.length > 1 ? els[els.length - 2] : document.body
  node.setAttribute('data-id', '0.0')

  const items = [
    ...els.map((el, i) => ({
      el,
      spec: chain[i],
      path: chain.slice(0, i + 1),
    })),
    ...children.map((spec) => ({
      el: node.appendChild(document.createElement('div')),
      spec,
      path: [...chain, spec],
    })),
    ...repeats.map((spec, i) => {
      const el = host.appendChild(document.createElement('div'))
      el.setAttribute('data-id', `0.0(${i + 1})`)
      return { el, spec, path: [...chain.slice(0, -1), spec] }
    }),
  ]

  const defaults = {
    transform: 'none',
    rotate: 'none',
    scale: 'none',
    translate: 'none',
    perspective: 'none',
    perspectiveOrigin: '50% 50%',
    transformOrigin: '50% 50%',
    transformStyle: 'flat',
    display: 'block',
  }
  const styles = new Map<Element, Record<string, string>>([
    [document.body, defaults],
    [document.documentElement, defaults],
  ])
  const truth = new Map<Element, { x: number; y: number }[]>()
  const rectCalls = new Map<Element, number>()

  for (const { el, spec: s, path } of items) {
    styles.set(el, {
      ...defaults,
      transform: s.transform ?? 'none',
      perspective: s.perspective ? `${s.perspective}px` : 'none',
      perspectiveOrigin: s.perspectiveOrigin ?? '50% 50%',
      transformStyle: s.preserve3d ? 'preserve-3d' : 'flat',
    })
    // Layout size (ignores transforms in a real browser)
    Object.defineProperty(el, 'offsetWidth', { value: s.w, configurable: true })
    Object.defineProperty(el, 'offsetHeight', {
      value: s.h,
      configurable: true,
    })

    const world = worldMatrices(path)[path.length - 1]
    const pts = CORNERS.map(([sx, sy]) =>
      project(world, s.cx + (sx * s.w) / 2, s.cy + (sy * s.h) / 2),
    )
    truth.set(el, pts)
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const [l, t, r, b] = [
      Math.min(...xs),
      Math.min(...ys),
      Math.max(...xs),
      Math.max(...ys),
    ]
    el.getBoundingClientRect = () => {
      rectCalls.set(el, (rectCalls.get(el) ?? 0) + 1)
      return {
        left: l,
        top: t,
        right: r,
        bottom: b,
        width: r - l,
        height: b - t,
        x: l,
        y: t,
        toJSON: () => {},
      }
    }
  }

  const orig = window.getComputedStyle
  window.getComputedStyle = ((n: Element) => {
    const s = orig(n)
    const o = styles.get(n)
    if (!o) return s
    return new Proxy(s, {
      get(t, p) {
        if (typeof p === 'string' && p in o) return o[p]
        const v = Reflect.get(t, p, t)
        return typeof v === 'function' ? v.bind(t) : v
      },
    })
  }) as typeof window.getComputedStyle
  cleanups.push(() => {
    window.getComputedStyle = orig
    els[0].remove()
  })

  return {
    node,
    parent: host,
    children: items
      .slice(els.length, els.length + children.length)
      .map((i) => i.el),
    repeats: items.slice(els.length + children.length).map((i) => i.el),
    truthOf: (el: Element) => truth.get(el)!,
    rectCalls,
  }
}

type Box = { left: number; top: number; width: number; height: number }

/** How a consumer renders an item: box centre + matrix around it, inside an optional perspective container. */
function overlayCorners(
  box: Box,
  matrix: string,
  p: { perspective: string; origin: { x: number; y: number } } | null = null,
) {
  const M = new DOMMatrix(matrix)
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  return CORNERS.map(([sx, sy]) => {
    const ox = (sx * box.width) / 2
    const oy = (sy * box.height) / 2
    // `matrix3d` may contain perspective (w != 1) in the 3D flavour
    const w = M.m14 * ox + M.m24 * oy + M.m44
    const x = M.m11 * ox + M.m21 * oy + M.m41
    const y = M.m12 * ox + M.m22 * oy + M.m42
    const z = M.m13 * ox + M.m23 * oy + M.m43
    let X = cx + x / w
    let Y = cy + y / w
    if (p) {
      // legacy flavour: consumer wraps the overlay in a perspective container
      const d = parseFloat(p.perspective)
      const s = d / (d - z)
      X = p.origin.x + (X - p.origin.x) * s
      Y = p.origin.y + (Y - p.origin.y) * s
    }
    return { x: X, y: Y }
  })
}

const cornerError = (
  got: { x: number; y: number }[],
  truth: { x: number; y: number }[],
) =>
  Math.max(...got.map((g, i) => Math.hypot(g.x - truth[i].x, g.y - truth[i].y)))

function maxCornerError(chain: Spec[]) {
  const { node, truthOf } = mountChain(chain)
  const data = getRectData(node)!
  const err = cornerError(
    overlayCorners(data, data.matrix, data.perspective),
    truthOf(node),
  )
  return { err, data }
}

const TOL = 0.5 // px

describe('overlay vs. transformed ancestors (controls: these should already pass)', () => {
  test('2D: rotated+scaled parent, skewed+rotated child offset from parent centre', () => {
    const { err } = maxCornerError([
      {
        cx: 300,
        cy: 300,
        w: 400,
        h: 300,
        transform: 'rotate(25deg) scale(1.3)',
      },
      {
        cx: 380,
        cy: 330,
        w: 120,
        h: 60,
        transform: 'rotate(-10deg) skewX(10deg)',
      },
    ])
    expect(err).toBeLessThan(TOL)
  })

  test('perspective provider with a 2D rotation, asymmetric perspective-origin', () => {
    const { err } = maxCornerError([
      {
        cx: 300,
        cy: 300,
        w: 400,
        h: 400,
        transform: 'rotate(20deg)',
        perspective: 500,
        perspectiveOrigin: '25% 75%',
      },
      { cx: 350, cy: 280, w: 100, h: 100, transform: 'rotateY(50deg)' },
    ])
    expect(err).toBeLessThan(TOL)
  })
})

describe('overlay vs. 3D-transformed ancestors (these expose the problems)', () => {
  test('perspective provider that is itself tilted in 3D (preserve-3d scene)', () => {
    const { err } = maxCornerError([
      {
        cx: 300,
        cy: 300,
        w: 400,
        h: 400,
        transform: 'rotateX(25deg)',
        perspective: 800,
        preserve3d: true,
      },
      { cx: 340, cy: 290, w: 120, h: 120, transform: 'rotateY(40deg)' },
    ])
    expect(err).toBeLessThan(TOL)
  })

  test('ancestor ABOVE the perspective provider is tilted in 3D', () => {
    const { err } = maxCornerError([
      {
        cx: 300,
        cy: 300,
        w: 500,
        h: 500,
        transform: 'rotateX(20deg)',
        preserve3d: true,
      },
      { cx: 300, cy: 300, w: 400, h: 400, perspective: 600, preserve3d: true },
      { cx: 350, cy: 280, w: 100, h: 100, transform: 'rotateY(35deg)' },
    ])
    expect(err).toBeLessThan(TOL)
  })

  test('untransformed child sitting OFF-CENTRE inside a parent rotated about Y (centre has z != 0)', () => {
    const { err } = maxCornerError([
      { cx: 300, cy: 300, w: 400, h: 400, perspective: 600, preserve3d: true },
      {
        cx: 300,
        cy: 300,
        w: 300,
        h: 300,
        transform: 'rotateY(40deg)',
        preserve3d: true,
      },
      { cx: 390, cy: 270, w: 100, h: 80 },
    ])
    expect(err).toBeLessThan(TOL)
  })

  test('parent WITHOUT preserve-3d flattens the child: child rotateX must not compose in 3D', () => {
    const { err } = maxCornerError([
      { cx: 300, cy: 300, w: 400, h: 400, perspective: 600 },
      { cx: 300, cy: 300, w: 300, h: 300, transform: 'rotateY(40deg)' }, // flat
      { cx: 390, cy: 270, w: 100, h: 80, transform: 'rotateX(30deg)' },
    ])
    expect(err).toBeLessThan(TOL)
  })
})

describe('robustness', () => {
  test.each([15, 40, 65, 80])(
    'tilted preserve-3d scene, child rotated %ddeg',
    (deg) => {
      const { err } = maxCornerError([
        {
          cx: 300,
          cy: 300,
          w: 400,
          h: 400,
          transform: `rotateX(${deg}deg) rotateZ(10deg)`,
          perspective: 700,
          preserve3d: true,
        },
        {
          cx: 360,
          cy: 250,
          w: 200,
          h: 100,
          transform: `rotateY(${-deg}deg) scale(1.2)`,
          preserve3d: true,
        },
        { cx: 380, cy: 260, w: 80, h: 40, transform: `rotateX(${deg / 2}deg)` },
      ])
      expect(err).toBeLessThan(TOL)
    },
  )

  test('a plain 3D-rotated node keeps its z so a 3D gizmo can still extrude', () => {
    const { err, data } = maxCornerError([
      { cx: 300, cy: 300, w: 400, h: 400 },
      { cx: 320, cy: 300, w: 120, h: 80, transform: 'rotateX(30deg)' },
    ])
    const m = new DOMMatrix(data.matrix)
    expect(err).toBeLessThan(TOL)
    expect(Math.abs(m.m23) + Math.abs(m.m32)).toBeGreaterThan(0.1)
  })

  test('does not depend on offsetLeft/offsetTop/offsetParent', () => {
    const { node, truthOf } = mountChain([
      {
        cx: 300,
        cy: 300,
        w: 400,
        h: 400,
        transform: 'rotateY(30deg)',
        perspective: 600,
        preserve3d: true,
      },
      { cx: 350, cy: 300, w: 100, h: 100, transform: 'rotateX(20deg)' },
    ])
    for (const k of ['offsetLeft', 'offsetTop']) {
      Object.defineProperty(node, k, { value: 12345, configurable: true })
    }
    const data = getRectData(node)!
    expect(
      cornerError(
        overlayCorners(data, data.matrix, data.perspective),
        truthOf(node),
      ),
    ).toBeLessThan(TOL)
  })
})

const det4 = (m: DOMMatrix) => {
  const a = [
    [m.m11, m.m21, m.m31, m.m41],
    [m.m12, m.m22, m.m32, m.m42],
    [m.m13, m.m23, m.m33, m.m43],
    [m.m14, m.m24, m.m34, m.m44],
  ]
  const det3 = (b: number[][]) =>
    b[0][0] * (b[1][1] * b[2][2] - b[1][2] * b[2][1]) -
    b[0][1] * (b[1][0] * b[2][2] - b[1][2] * b[2][0]) +
    b[0][2] * (b[1][0] * b[2][1] - b[1][1] * b[2][0])
  return a[0].reduce((sum, v, j) => {
    const minor = a.slice(1).map((row) => row.filter((_, k) => k !== j))
    return sum + (j % 2 ? -1 : 1) * v * det3(minor)
  }, 0)
}

describe('untransformed children of 3D-transformed parents', () => {
  test.each([
    [
      'flat parent, no perspective',
      [
        { cx: 300, cy: 300, w: 300, h: 300, transform: 'rotateY(40deg)' },
        { cx: 390, cy: 270, w: 100, h: 80 },
      ],
    ],
    [
      'flat parent under a perspective provider',
      [
        { cx: 300, cy: 300, w: 400, h: 400, perspective: 600 },
        { cx: 300, cy: 300, w: 300, h: 300, transform: 'rotateY(40deg)' },
        { cx: 390, cy: 270, w: 100, h: 80 },
      ],
    ],
    [
      'preserve-3d parent under a perspective provider',
      [
        {
          cx: 300,
          cy: 300,
          w: 400,
          h: 400,
          perspective: 600,
          preserve3d: true,
        },
        {
          cx: 300,
          cy: 300,
          w: 300,
          h: 300,
          transform: 'rotateY(40deg)',
          preserve3d: true,
        },
        { cx: 390, cy: 270, w: 100, h: 80 },
      ],
    ],
  ] as [string, Spec[]][])(
    '%s: matrix is invertible and lands on the element',
    (_, chain) => {
      const { err, data } = maxCornerError(chain)
      expect(err).toBeLessThan(TOL)
      expect(Math.abs(det4(new DOMMatrix(data.matrix)))).toBeGreaterThan(1e-6)
      expect(data.perspective).toBeNull()
    },
  )
})

describe('parent, children, repeatItems and inheritedMatrix in 3D chains', () => {
  const scene = (nodePreserve3d: boolean): [Spec[], Extras] => [
    [
      { cx: 300, cy: 300, w: 400, h: 400, perspective: 600, preserve3d: true },
      {
        cx: 300,
        cy: 300,
        w: 300,
        h: 300,
        transform: 'rotateY(40deg)',
        preserve3d: true,
      },
      {
        cx: 340,
        cy: 280,
        w: 160,
        h: 120,
        transform: 'rotateX(15deg)',
        preserve3d: nodePreserve3d,
      },
    ],
    {
      children: [
        { cx: 360, cy: 290, w: 60, h: 40 }, // untransformed
        { cx: 330, cy: 270, w: 50, h: 30, transform: 'rotateZ(20deg)' },
      ],
      repeats: [
        {
          cx: 340,
          cy: 340,
          w: 160,
          h: 120,
          transform: 'rotateX(15deg)',
          preserve3d: nodePreserve3d,
        },
        {
          cx: 340,
          cy: 400,
          w: 160,
          h: 120,
          transform: 'rotateX(15deg)',
          preserve3d: nodePreserve3d,
        },
      ],
    },
  ]

  describe.each([
    ['flat node', false],
    ['preserve-3d node', true],
  ])('%s', (_, preserve3d) => {
    test('every child carries a matrix that lands on the child', () => {
      const [chain, extras] = scene(preserve3d)
      const m = mountChain(chain, extras)
      const data = getRectData(m.node)!
      expect(data.children).toHaveLength(2)
      data.children.forEach((child, i) => {
        expect(child.matrix).toBeString()
        expect(
          cornerError(
            overlayCorners(child, child.matrix!),
            m.truthOf(m.children[i]),
          ),
        ).toBeLessThan(TOL)
      })
    })

    test('the parent carries a matrix that lands on the parent, and inheritedMatrix is that matrix', () => {
      const [chain, extras] = scene(preserve3d)
      const m = mountChain(chain, extras)
      const data = getRectData(m.node)!
      expect(data.parent!.matrix).toBeString()
      expect(
        cornerError(
          overlayCorners(data.parent!, data.parent!.matrix!),
          m.truthOf(m.parent),
        ),
      ).toBeLessThan(TOL)
      expect(data.inheritedMatrix).toBe(data.parent!.matrix!)
    })

    test('every repeat item carries a matrix that lands on the item', () => {
      const [chain, extras] = scene(preserve3d)
      const m = mountChain(chain, extras)
      const data = getRectData(m.node)!
      expect(data.repeatItems).toHaveLength(2)
      data.repeatItems!.forEach((item, i) => {
        expect(item.matrix).toBeString()
        expect(
          cornerError(
            overlayCorners(item, item.matrix!),
            m.truthOf(m.repeats[i]),
          ),
        ).toBeLessThan(TOL)
      })
    })

    test('all returned matrices are invertible', () => {
      const [chain, extras] = scene(preserve3d)
      const m = mountChain(chain, extras)
      const data = getRectData(m.node)!
      const all = [
        data.matrix,
        data.inheritedMatrix,
        ...data.children.map((c) => c.matrix!),
        ...data.repeatItems!.map((r) => r.matrix!),
      ]
      for (const matrix of all) {
        expect(matrix).toBeString() // a missing matrix would silently parse as identity
        expect(Math.abs(det4(new DOMMatrix(matrix)))).toBeGreaterThan(1e-6)
      }
    })
  })

  test('a 2D node with a child that has its own 3D transform: only the child is in the 3D flavour', () => {
    const m = mountChain(
      [
        { cx: 300, cy: 300, w: 400, h: 400 },
        { cx: 300, cy: 300, w: 200, h: 200, transform: 'rotate(20deg)' },
      ],
      {
        children: [
          { cx: 340, cy: 300, w: 80, h: 60, transform: 'rotateY(50deg)' },
        ],
      },
    )
    const data = getRectData(m.node)!
    // the node keeps the 2D flavour (translation-free matrix) ...
    expect(data.perspective).toBeNull()
    expect(new DOMMatrix(data.matrix).e).toBe(0)
    expect(
      cornerError(overlayCorners(data, data.matrix), m.truthOf(m.node)),
    ).toBeLessThan(TOL)
    expect(data.parent).not.toHaveProperty('matrix')
    // ... while the child brings its own exact matrix
    const child = data.children[0]
    expect(
      cornerError(
        overlayCorners(child, child.matrix!),
        m.truthOf(m.children[0]),
      ),
    ).toBeLessThan(TOL)
  })

  test('2D chains keep the previous shape: no matrix on the parent, children or repeat items', () => {
    const m = mountChain(
      [
        { cx: 300, cy: 300, w: 400, h: 400, transform: 'rotate(20deg)' },
        { cx: 320, cy: 300, w: 200, h: 100, transform: 'rotate(10deg)' },
      ],
      {
        children: [{ cx: 330, cy: 300, w: 60, h: 40 }],
        repeats: [
          { cx: 320, cy: 420, w: 200, h: 100, transform: 'rotate(10deg)' },
        ],
      },
    )
    const data = getRectData(m.node)!
    expect(data.parent).not.toHaveProperty('matrix')
    expect(data.children[0]).not.toHaveProperty('matrix')
    expect(data.repeatItems![0]).not.toHaveProperty('matrix')
    // inheritedMatrix is still the parent's scale-free rotation
    const inherited = new DOMMatrix(data.inheritedMatrix)
    expect(inherited.a).toBeCloseTo(Math.cos((20 * Math.PI) / 180), 5)
    expect(inherited.e).toBe(0)
  })

  test('ancestors are solved once per call, however many children there are', () => {
    const [chain] = scene(false)
    const children = Array.from({ length: 20 }, (_, i) => ({
      cx: 300 + i,
      cy: 290,
      w: 20,
      h: 20,
    }))
    const m = mountChain(chain, { children })
    const data = getRectData(m.node)!
    expect(data.children).toHaveLength(20)
    expect(m.rectCalls.get(m.node.parentElement!.parentElement!)).toBe(1) // perspective provider
    expect(m.rectCalls.get(m.parent)).toBe(1) // transformed parent
    for (const child of m.children) expect(m.rectCalls.get(child)).toBe(1)
  })
})

describe('rotation (orientation for gizmos)', () => {
  test('flattened child keeps its own 3D direction while matrix stays flattened', () => {
    const m = mountChain([
      { cx: 300, cy: 300, w: 400, h: 400, perspective: 600 },
      { cx: 300, cy: 300, w: 300, h: 300, transform: 'rotateY(40deg)' }, // flat
      { cx: 390, cy: 270, w: 100, h: 80, transform: 'rotateX(30deg)' },
    ])
    const data = getRectData(m.node)!

    const expected = new DOMMatrix('rotateY(40deg) rotateX(30deg)')
    const got = new DOMMatrix(data.rotation)
    for (const k of [
      'm11',
      'm12',
      'm13',
      'm21',
      'm22',
      'm23',
      'm31',
      'm32',
      'm33',
    ] as const) {
      expect(got[k]).toBeCloseTo(expected[k], 4)
    }
    // pure rotation: no translation or perspective
    expect([got.m14, got.m24, got.m34, got.m41, got.m42, got.m43]).toEqual([
      0, 0, 0, 0, 0, 0,
    ])
    expect(got.m44).toBe(1)
    // the placement matrix is unchanged and still lands on the element
    expect(data.rotation).not.toBe(data.matrix)
    expect(
      cornerError(overlayCorners(data, data.matrix), m.truthOf(m.node)),
    ).toBeLessThan(TOL)
  })

  test('scale and skew are removed', () => {
    const m = mountChain([
      {
        cx: 300,
        cy: 300,
        w: 200,
        h: 200,
        transform: 'rotateZ(30deg) scale(2) skewX(15deg)',
      },
    ])
    const r = new DOMMatrix(getRectData(m.node)!.rotation)
    expect(Math.hypot(r.m11, r.m12, r.m13)).toBeCloseTo(1, 5)
    expect(Math.hypot(r.m21, r.m22, r.m23)).toBeCloseTo(1, 5)
    expect(r.m11 * r.m21 + r.m12 * r.m22 + r.m13 * r.m23).toBeCloseTo(0, 5)
  })
})
