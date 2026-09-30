/* eslint-disable max-params */

import { escapeRegex } from './dom'

type Scale = [x: number, y: number]

/**
 * Measures an element so an overlay can be drawn on top of it that matches exactly.
 *
 * The overlay is a box plus a `matrix` that the consumer applies around the box
 * centre (`transform-origin: 50% 50%`). There are two flavours:
 *
 * - 2D chains (no 3D transform, no perspective above the node): the box is the
 *   *untransformed* box centred on the element's true centre and `matrix` is a
 *   translation-free rotate/skew matrix. Scale is deliberately NOT part of it: it is
 *   baked into the box's width/height instead.
 *
 * - 3D / perspective chains: the box is the element's *layout* box and `matrix` is the
 *   complete layout -> screen `matrix3d` (translation, scale and perspective included),
 *   so `perspective` is `null` and the consumer must NOT add a perspective container.
 *   The consumer's overlay layer must be untransformed and in viewport coordinates.
 *   See `getExactOverlay`.
 *
 * `parent`, `children` and `repeatItems` follow the same rule per element: an item
 * that is in a 3D / perspective chain carries its own `matrix` (3D flavour), any
 * other item has no `matrix` and is drawn as before. `inheritedMatrix` is the
 * parent's `matrix` in the 3D flavour.
 */
export function getRectData(selectedNode: Element | null | undefined) {
  if (!selectedNode) {
    return null
  }

  const {
    display,
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
    borderRadius,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomRightRadius,
    borderBottomLeftRadius,
    flexDirection,
    gap,
    rowGap,
    columnGap,
    transformOrigin,
    boxSizing,
  } = getStyle(selectedNode)

  // Solved frames are shared by the node, its parent, children and repeat items.
  const cache: FrameCache = new Map()
  const exact = getExactOverlay(selectedNode, cache)
  const { rect, rotate: matrix } = exact ?? getScaledIntrinsicRect(selectedNode)
  const parent = selectedNode.parentElement
  const parentData =
    parent && parent !== document.documentElement
      ? getParentRectData(parent, cache)
      : null

  return {
    ...toRectData(rect),
    boundingClientRect: toRectData(selectedNode.getBoundingClientRect()),
    border: [
      borderTopWidth || '0px',
      borderRightWidth || '0px',
      borderBottomWidth || '0px',
      borderLeftWidth || '0px',
    ],
    borderRadius: borderRadius
      ? borderRadius.split(' ')
      : [
          borderTopLeftRadius || '0px',
          borderTopRightRadius || '0px',
          borderBottomRightRadius || '0px',
          borderBottomLeftRadius || '0px',
        ],
    padding: [
      paddingTop || '0px',
      paddingRight || '0px',
      paddingBottom || '0px',
      paddingLeft || '0px',
    ],
    margin: [
      marginTop || '0px',
      marginRight || '0px',
      marginBottom || '0px',
      marginLeft || '0px',
    ],
    gap: gap.split(' '),
    boxSizing,
    display,
    flexDirection,
    rowGap,
    columnGap,
    // Matrix is the full transform of the element itself (see the doc comment above
    // for what it contains in the 2D and 3D flavours)
    matrix,
    // Inherited matrix is the transform of the element's parent chain (minus scale),
    // or the parent's exact `matrix` when the parent is in a 3D / perspective chain
    rotation: getRotationMatrix(selectedNode),
    inheritedMatrix: parentData?.matrix ?? getInheritedMatrix(selectedNode),
    // In the exact (3D) flavour perspective is baked into `matrix`, so there is
    // nothing for the consumer to apply.
    perspective: exact ? null : getPerspectiveData(selectedNode),
    transformOrigin,
    parent: parentData,
    children: Array.from(selectedNode.children).map((child) =>
      getBasicRectData(child, cache),
    ),
    repeatItems: getRepeatItemsData(selectedNode, cache),
    rawTransforms: {
      transform: getStyle(selectedNode).transform,
      translate: getStyle(selectedNode).translate,
      scale: getStyle(selectedNode).scale,
      rotate: getStyle(selectedNode).rotate,
      perspective: getStyle(selectedNode).perspective,
    },
  }
}

const getStyle = (el: Element) => window.getComputedStyle(el)

const toRectData = ({
  left,
  top,
  right,
  bottom,
  width,
  height,
  x = left,
  y = top,
}: DOMRect) => ({
  left,
  top,
  right,
  bottom,
  width,
  height,
  x,
  y,
})

/**
 * Rect of a related element (parent, child, repeat item). Elements in a 3D /
 * perspective chain also get their own `matrix`, to be drawn exactly like the
 * selected node: box at `left/top/width/height`, `matrix` about its own centre.
 * Without a `matrix` the element is in the 2D flavour and is drawn as before.
 */
const getBasicRectData = (
  node: Element,
  cache: FrameCache = new Map(),
): ReturnType<typeof toRectData> & { matrix?: string } => {
  const exact = getExactOverlay(node, cache)
  return exact
    ? { ...toRectData(exact.rect), matrix: exact.rotate }
    : toRectData(getScaledIntrinsicRect(node).rect)
}

function getParentRectData(parent: Element, cache: FrameCache) {
  const {
    rowGap,
    columnGap,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
  } = getStyle(parent)
  return {
    ...getBasicRectData(parent, cache),
    rowGap,
    columnGap,
    padding: [
      paddingTop || '0px',
      paddingRight || '0px',
      paddingBottom || '0px',
      paddingLeft || '0px',
    ],
  }
}

export function getRepeatItemsData(
  selectedNode: Element,
  cache: FrameCache = new Map(),
) {
  const path = selectedNode.getAttribute('data-id')
  if (!path) {
    return null
  }

  const parent = selectedNode.parentElement ?? selectedNode.parentNode
  if (!parent || !('children' in parent)) {
    return null
  }

  const repeatRegex = new RegExp(`^${escapeRegex(path)}\\(\\d+\\)$`)
  const repeatNodes = Array.from(parent.children).filter((child) => {
    if (child === selectedNode) {
      return false
    }
    const id = child.getAttribute('data-id')
    return id && repeatRegex.test(id)
  })

  if (repeatNodes.length === 0) {
    return null
  }

  return repeatNodes.map((node) => getBasicRectData(node, cache))
}

/** A `width` x `height` rect with the same centre as `around`. */
const centeredRect = (around: DOMRect, width: number, height: number) =>
  new DOMRect(
    around.left + (around.width - width) / 2,
    around.top + (around.height - height) / 2,
    width,
    height,
  )

function getPerspectiveProvider(node: Element): Element | null {
  for (
    let el = node.parentElement;
    el && el !== document.documentElement;
    el = el.parentElement
  ) {
    if (getStyle(el).perspective !== 'none') {
      return el
    }
  }
  return null
}

function getPerspectiveInfo(provider: Element) {
  const { perspective, perspectiveOrigin } = getStyle(provider)
  const d = parseFloat(perspective)
  if (!(d > 0)) {
    return null
  }

  const transform = getFullTransform(provider)
  // Intrinsic (untransformed, unscaled) size, since the origin is resolved
  // against the provider's own box.
  const { width, height } = getIntrinsicRect(provider, transform)
  const [originX, originY] = parseOrigin(perspectiveOrigin, width, height)

  // perspective-origin is a point fixed to the provider's box, so take its
  // offset from the box centre in local space and push it through the
  // provider's accumulated transform. The AABB centre is transform-invariant
  // (default centre transform-origin), so it is a safe anchor.
  const offset = transform.transformPoint(
    new DOMPoint(originX - width / 2, originY - height / 2),
  )
  const raw = provider.getBoundingClientRect()

  return {
    d,
    perspective,
    ox: raw.left + raw.width / 2 + offset.x,
    oy: raw.top + raw.height / 2 + offset.y,
  }
}

function getPerspectiveData(node: Element) {
  const provider = getPerspectiveProvider(node)
  const info = provider && getPerspectiveInfo(provider)
  if (!info) {
    return null
  }

  return {
    perspective: info.perspective,
    origin: { x: info.ox + window.scrollX, y: info.oy + window.scrollY },
  }
}

/**
 * Calculates the exact centre of an element under 3D perspective projection.
 *
 * Perspective causes the nearer edge to appear larger than the further edge,
 * producing an asymmetric trapezoid whose AABB centre no longer coincides
 * with the element's actual centre. This solves for the true centre point
 * (cx, cy) such that its perspective projection matches the observed AABB bounds.
 *
 * NOTE: this is only used as a fallback now (see `getExactOverlay`). It assumes the
 * centre sits at z = 0 and that perspective is applied in screen space, which is
 * wrong as soon as an ancestor has a 3D transform.
 */
function getPerspectiveCenter(
  node: Element,
  matrix: DOMMatrix,
  width: number,
  height: number,
  rect: DOMRect,
) {
  const aabbCenter = {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
  }
  const provider = getPerspectiveProvider(node)
  const info = provider && getPerspectiveInfo(provider)
  if (!info) {
    return aabbCenter
  }

  const { d, ox, oy } = info

  // Transformed corners and their perspective scale don't depend on the centre
  // being solved for, so compute them once.
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const p = matrix.transformPoint(
      new DOMPoint((sx * width) / 2, (sy * height) / 2, 0),
    )
    const denom = d - p.z
    return { x: p.x, y: p.y, s: denom > 1e-4 ? d / denom : 1 }
  })

  // One fixed-point step along one axis: given the current centre offset `c`,
  // find the corners that define the projected min/max and re-solve `c`.
  const refine = (
    axis: 'x' | 'y',
    c: number,
    min: number,
    max: number,
    origin: number,
  ) => {
    const val = (p: (typeof corners)[number]) => p.s * c + p.s * p[axis]
    const lo = corners.reduce((m, p) => (val(p) < val(m) ? p : m))
    const hi = corners.reduce((m, p) => (val(p) > val(m) ? p : m))
    const denom = lo.s + hi.s
    return Math.abs(denom) > 1e-6
      ? (min + max - 2 * origin - (lo.s * lo[axis] + hi.s * hi[axis])) / denom
      : c
  }

  let U = aabbCenter.cx - ox
  let V = aabbCenter.cy - oy
  for (let i = 0; i < 3; i++) {
    U = refine('x', U, rect.left, rect.right, ox)
    V = refine('y', V, rect.top, rect.bottom, oy)
  }

  return { cx: ox + U, cy: oy + V }
}

function parseOrigin(
  value: string,
  width: number,
  height: number,
): [number, number] {
  const [x = '50%', y = '50%'] = value.trim().split(/\s+/)
  const resolve = (token: string, size: number) =>
    token.endsWith('%')
      ? (parseFloat(token) / 100) * size
      : parseFloat(token) || 0

  return [resolve(x, width), resolve(y, height)]
}

function getTransformStyles(el: Element) {
  const computed = getStyle(el)
  const inline =
    el instanceof HTMLElement || el instanceof SVGElement ? el.style : null

  const get = (name: 'transform' | 'rotate' | 'scale' | 'translate'): string =>
    computed[name] || inline?.getPropertyValue(name) || inline?.[name] || 'none'

  return {
    transform: get('transform'),
    rotate: get('rotate'),
    scale: get('scale'),
    translate: get('translate'),
  }
}

/**
 * The element's own transform as a matrix (about the origin, i.e. before
 * `transform-origin` is applied).
 * CSS order: translate, rotate, scale, then the transform list.
 */
function getOwnTransform(el: Element): DOMMatrix {
  const { transform, rotate, scale, translate } = getTransformStyles(el)
  return parseTranslate(translate)
    .multiply(parseRotate(rotate))
    .multiply(parseScale(scale))
    .multiply(parseTransform(transform))
}

/**
 * Pure orientation of the element: every ancestor's own transform × the
 * element's own transform, with translation, perspective, scale and skew removed.
 *
 * Unlike `matrix` this ignores flattening by non-preserve-3d parents, so it always
 * describes the element's intended 3D direction. Use it for orientation-only
 * consumers (e.g. the transform gizmo); `matrix` remains the source of truth for
 * where the overlay is drawn.
 */
function getRotationMatrix(node: Element): string {
  const identity = new DOMMatrix().toString()
  const m = getFullTransform(node)

  const norm = (v: number[]) => {
    const l = Math.hypot(v[0], v[1], v[2])
    return l > 1e-9 ? v.map((n) => n / l) : null
  }
  const cross = (a: number[], b: number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]

  // DOMMatrix columns: m11..m13 = image of the x axis, m21..m23 = image of the y axis
  const x = norm([m.m11, m.m12, m.m13])
  const y = norm([m.m21, m.m22, m.m23])
  if (!x || !y) {
    return identity
  }

  // Symmetric orthonormalisation, so skew is split evenly between the axes
  const h = norm([x[0] + y[0], x[1] + y[1], x[2] + y[2]])
  const k = norm([x[0] - y[0], x[1] - y[1], x[2] - y[2]])
  if (!h || !k) {
    return identity
  }

  const s = Math.SQRT1_2
  const X = [(h[0] + k[0]) * s, (h[1] + k[1]) * s, (h[2] + k[2]) * s]
  const Y = [(h[0] - k[0]) * s, (h[1] - k[1]) * s, (h[2] - k[2]) * s]
  const Z = cross(X, Y)

  const round = (n: number) => Math.round(n * 1e6) / 1e6 || 0 // `|| 0` folds -0 into 0
  const values = [...X, 0, ...Y, 0, ...Z, 0, 0, 0, 0, 1]
  return `matrix3d(${values.map(round).join(', ')})`
}

/**
 * Accumulated transform of `node` and all its ancestors, with translation
 * removed (only rotation / skew / scale / 3D remain).
 *
 * This is the naive product used by the 2D path. It knows nothing about
 * perspective or `transform-style`; for 3D chains see `getExactOverlay`.
 */
function getFullTransform(node: Element): DOMMatrix {
  let combined = new DOMMatrix()

  for (
    let el: Element | null = node;
    el && el !== document.documentElement;
    el = el.parentElement
  ) {
    combined = getOwnTransform(el).multiply(combined)
  }

  combined.e = combined.f = combined.m43 = 0
  return combined
}

const parseTransform = (value: string) =>
  !value || value === 'none' ? new DOMMatrix() : new DOMMatrix(value)

/** Identity for `none`, otherwise `build` gets the whitespace-separated tokens. */
const parseProperty = (
  value: string,
  build: (tokens: string[]) => DOMMatrix,
) =>
  !value || value === 'none'
    ? new DOMMatrix()
    : build(value.trim().split(/\s+/))

const parseTranslate = (value: string) =>
  parseProperty(value, (tokens) => {
    const [x = 0, y = 0, z = 0] = tokens.map((t) => parseFloat(t) || 0)
    return new DOMMatrix().translateSelf(x, y, z)
  })

const parseScale = (value: string) =>
  parseProperty(value, (tokens) => {
    const num = (t: string) =>
      (parseFloat(t) || 0) / (t.endsWith('%') ? 100 : 1)
    const [x, y = x, z = 1] = tokens.map(num)
    return new DOMMatrix().scaleSelf(x, y, z)
  })

const ANGLE_UNITS: [suffix: string, degrees: number][] = [
  ['turn', 360],
  ['rad', 180 / Math.PI],
  ['grad', 0.9],
]

function parseAngle(token: string): number {
  const [, degrees = 1] =
    ANGLE_UNITS.find(([unit]) => token.endsWith(unit)) ?? []
  return (parseFloat(token) || 0) * degrees
}

const parseRotate = (value: string) =>
  parseProperty(value, (parts) => {
    const matrix = new DOMMatrix()

    if (parts.length === 1) {
      return matrix.rotateSelf(0, 0, parseAngle(parts[0]))
    }

    if (parts.length === 2) {
      const axisFirst = ['x', 'y', 'z'].includes(parts[0].toLowerCase())
      const axis = (axisFirst ? parts[0] : parts[1]).toLowerCase()
      const angle = parseAngle(axisFirst ? parts[1] : parts[0])
      return matrix.rotateSelf(
        axis === 'x' ? angle : 0,
        axis === 'y' ? angle : 0,
        axis === 'z' ? angle : 0,
      )
    }

    if (parts.length === 4) {
      const angleFirst = /deg|rad|turn|grad/.test(parts[0])
      const angle = parseAngle(angleFirst ? parts[0] : parts[3])
      const [x, y, z] = (angleFirst ? parts.slice(1) : parts.slice(0, 3)).map(
        (t) => parseFloat(t),
      )
      return !x && !y && !z
        ? matrix
        : matrix.rotateAxisAngleSelf(x, y, z, angle)
    }

    return matrix
  })

/**
 * Splits a 2D matrix into scale and a scale-free rotate/skew matrix.
 * 3D matrices are returned untouched (scale 1).
 */
function decomposeScale(matrix: DOMMatrix) {
  const unchanged = { rotateSkew: matrix, scale: [1, 1] as Scale }
  if (!matrix.is2D) {
    return unchanged
  }

  const { a, b, c, d } = matrix
  const scaleX = Math.hypot(a, b)
  if (!scaleX) {
    return unchanged
  }

  const a1 = a / scaleX
  const b1 = b / scaleX
  const skew = a1 * c + b1 * d
  const scaleY = Math.hypot(c - a1 * skew, d - b1 * skew)
  if (!scaleY) {
    return unchanged
  }

  return {
    rotateSkew: new DOMMatrix([a1, b1, c / scaleY, d / scaleY, 0, 0]),
    scale: [scaleX, scaleY] as Scale,
  }
}

/** Untransformed box (with scale applied to its size) plus the rotate/skew matrix as a string. */
function getScaledIntrinsicRect(node: Element) {
  const { rotateSkew, scale } = decomposeScale(getFullTransform(node))

  return {
    rect: getIntrinsicRect(node, rotateSkew, scale),
    rotate: rotateSkew.toString(),
  }
}

/**
 * Recovers the untransformed box from the AABB that the browser reports.
 * `matrix` is the transform to undo; `scale` is how much bigger than the
 * layout box the AABB already is (because scale isn't part of `matrix`).
 */
function getIntrinsicRect(
  node: Element,
  matrix: DOMMatrix,
  [scaleX, scaleY]: Scale = [1, 1],
): DOMRect {
  const computed = getStyle(node)
  const isInline = computed.display === 'inline'
  const rect = isInline ? getInlineRect(node) : node.getBoundingClientRect()

  if (matrix.isIdentity) {
    return rect
  }

  const layout = getLayoutSize(node, computed)
  if (!matrix.is2D && !isInline && getPerspectiveProvider(node)) {
    const width = layout
      ? layout.width * scaleX
      : node instanceof HTMLElement
        ? node.offsetWidth * scaleX
        : rect.width
    const height = layout
      ? layout.height * scaleY
      : node instanceof HTMLElement
        ? node.offsetHeight * scaleY
        : rect.height
    const { cx, cy } = getPerspectiveCenter(node, matrix, width, height, rect)
    return new DOMRect(cx - width / 2, cy - height / 2, width, height)
  }

  const [a, b, c, d] = [matrix.a, matrix.b, matrix.c, matrix.d].map(Math.abs)
  const det = a * d - b * c

  // Relative to the column lengths so the test doesn't depend on scale/skew.
  if (Math.abs(det) / (Math.hypot(a, b) * Math.hypot(c, d)) > 0.05) {
    const width = (rect.width * d - rect.height * c) / det
    const height = (rect.height * a - rect.width * b) / det
    if (width > 0 && height > 0) {
      return centeredRect(rect, width, height)
    }
  }

  // Special handling for ~45deg rotation, or wherever skew makes the two equations near-identical)
  const layoutW = layout ? layout.width * scaleX : rect.width || 1
  const layoutH = layout ? layout.height * scaleY : rect.height || 1
  const p = a * layoutW + c * layoutH
  const q = b * layoutW + d * layoutH
  const denominator = p * p + q * q

  if (denominator < 1e-9) {
    return rect
  }

  const k = (rect.width * p + rect.height * q) / denominator
  return centeredRect(rect, k * layoutW, k * layoutH)
}

/** Unscaled, untransformed border-box size from layout, or `null` if unavailable. */
function getLayoutSize(node: Element, computed: CSSStyleDeclaration) {
  if (
    node instanceof HTMLElement &&
    (node.offsetWidth > 0 || node.offsetHeight > 0)
  ) {
    return { width: node.offsetWidth, height: node.offsetHeight }
  }

  if ('getBBox' in node) {
    try {
      const { width, height } = (node as SVGGraphicsElement).getBBox()
      if (width > 0 || height > 0) {
        return { width, height }
      }
    } catch {
      // getBBox throws for non-rendered elements; fall through to computed size
    }
  }

  const width = parseFloat(computed.width)
  const height = parseFloat(computed.height)
  if (isNaN(width) || isNaN(height) || (width <= 0 && height <= 0)) {
    return null
  }

  if (computed.boxSizing !== 'content-box') {
    return { width, height }
  }

  const sum = (...props: string[]) =>
    props.reduce(
      (t, p) => t + (parseFloat(computed.getPropertyValue(p)) || 0),
      0,
    )

  return {
    width:
      width +
      sum(
        'padding-left',
        'padding-right',
        'border-left-width',
        'border-right-width',
      ),
    height:
      height +
      sum(
        'padding-top',
        'padding-bottom',
        'border-top-width',
        'border-bottom-width',
      ),
  }
}

function getInlineRect(node: Element): DOMRect {
  try {
    const range = document.createRange()
    range.selectNodeContents(node)
    const rangeRect = range.getBoundingClientRect()
    if (rangeRect.width > 0 && rangeRect.height > 0) {
      return rangeRect
    }
  } catch {
    // fall through to getBoundingClientRect below
  }

  return node.getBoundingClientRect()
}

/**
 * Scale-free rotate/skew matrix (as a string) accumulated from the element's
 * ancestors only, excluding the element's own transform.
 */
function getInheritedMatrix(node: Element): string {
  const parent = node.parentElement
  if (!parent) {
    return new DOMMatrix().toString()
  }

  // getFullTransform walks from `parent` up to (but not including) <html>,
  // so it returns identity if the parent is the root element.
  const { rotateSkew } = decomposeScale(getFullTransform(parent))
  return rotateSkew.toString()
}

// ---------------------------------------------------------------------------
// Exact overlay for 3D / perspective chains
// ---------------------------------------------------------------------------

type Point = { x: number; y: number }

const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

const translation = (x: number, y: number, z = 0) =>
  new DOMMatrix().translateSelf(x, y, z)

/** `m` applied about the point `origin` instead of about (0, 0, 0). */
const about = (m: DOMMatrix, [x, y, z]: [number, number, number]) =>
  translation(x, y, z)
    .multiply(m)
    .multiply(translation(-x, -y, -z))

/** Where the point (x, y, 0) ends up on screen, including the perspective divide. */
function project(m: DOMMatrix, x: number, y: number): Point {
  const w = m.m14 * x + m.m24 * y + m.m44
  return w > 0
    ? {
        x: (m.m11 * x + m.m21 * y + m.m41) / w,
        y: (m.m12 * x + m.m22 * y + m.m42) / w,
      }
    : { x: NaN, y: NaN } // behind the camera
}

/** [left, top, right, bottom] of the `w` x `h` box centred on `c` after `m`. */
function projectedBounds(m: DOMMatrix, c: Point, w: number, h: number) {
  const pts = CORNERS.map(([sx, sy]) =>
    project(m, c.x + (sx * w) / 2, c.y + (sy * h) / 2),
  )
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

const dot = (a: number[], b: number[]) =>
  a.reduce((sum, v, i) => sum + v * b[i], 0)

/**
 * Finds the layout centre `c` for which `worldAt(c)` renders the `w` x `h` box exactly
 * onto `target` (Gauss-Newton on the four bounding-rect edges; the Jacobian is
 * measured by nudging `c` by 1px). Returns `null` if the model can't reproduce the
 * browser's own rect, so callers never trust a wrong model.
 */
function solveLayoutCentre(
  target: DOMRect,
  w: number,
  h: number,
  worldAt: (c: Point) => DOMMatrix,
): Point | null {
  const want = [target.left, target.top, target.right, target.bottom]
  const misfit = (c: Point) =>
    projectedBounds(worldAt(c), c, w, h).map((v, i) => want[i] - v)

  let c = {
    x: target.left + target.width / 2,
    y: target.top + target.height / 2,
  }
  for (let i = 0; i < 10; i++) {
    const r = misfit(c)
    const jx = misfit({ x: c.x + 1, y: c.y }).map((v, k) => r[k] - v)
    const jy = misfit({ x: c.x, y: c.y + 1 }).map((v, k) => r[k] - v)
    const [a, b, d] = [dot(jx, jx), dot(jx, jy), dot(jy, jy)]
    const det = a * d - b * b
    if (!(Math.abs(det) > 1e-9)) {
      break
    }
    const [e, g] = [dot(jx, r), dot(jy, r)]
    const step = { x: (d * e - b * g) / det, y: (a * g - b * e) / det }
    c = { x: c.x + step.x, y: c.y + step.y }
    if (Math.hypot(step.x, step.y) < 1e-6) {
      break
    }
  }
  return Math.max(...misfit(c).map(Math.abs)) < 1 ? c : null
}

const hasPerspectiveAncestor = (node: Element) => {
  for (
    let el = node.parentElement;
    el && el !== document.documentElement;
    el = el.parentElement
  ) {
    if (parseFloat(getStyle(el).perspective) > 0) {
      return true
    }
  }
  return false
}

/** An element's rendering: its layout box, its layout -> screen matrix and what its children inherit. */
type Frame = {
  c: Point
  w: number
  h: number
  world: DOMMatrix
  perspective: number
  perspectiveOrigin: string
  preserve3d: boolean
  solved: boolean
}

/** Frames (or `null` if unsolvable) for one `getRectData` call, so ancestors are solved once. */
type FrameCache = Map<Element, Frame | null>

/**
 * Walks root -> `el` with the CSS rules, per element:
 *
 *  1. it transforms about its own `transform-origin`,
 *  2. its parent's `perspective` is applied to it before it is composed onto the
 *     parent's accumulated matrix,
 *  3. a parent that isn't `preserve-3d` flattens it (only matters when the parent's
 *     matrix actually mixes z into x/y/w, otherwise z is kept for the consumer).
 *
 * An element's layout position isn't observable directly, but its rendered bounding
 * rect is and rendering is a known function of the layout centre, so the centre is
 * solved from the rect (`solveLayoutCentre`). Only elements whose position affects the
 * result are solved: the requested `target`, transformed elements and perspective
 * providers.
 */
function getFrame(
  el: Element,
  cache: FrameCache,
  target = false,
): Frame | null {
  const cached = cache.get(el)
  if (cached !== undefined && (!cached || cached.solved || !target)) {
    return cached
  }

  const p = el.parentElement
  const parent = p && p !== document.documentElement ? getFrame(p, cache) : null
  if (
    !(el instanceof HTMLElement) ||
    (p && p !== document.documentElement && !parent)
  ) {
    cache.set(el, null)
    return null
  }

  const style = getStyle(el)
  const own = getOwnTransform(el)
  const perspective = parseFloat(style.perspective) || 0
  const [w, h] = [el.offsetWidth, el.offsetHeight]
  const parentWorld = parent?.world ?? new DOMMatrix()

  // Layout centre of `el` -> its accumulated matrix
  const place = (c: Point) => {
    const [ox, oy] = parseOrigin(style.transformOrigin || '50% 50%', w, h)
    let m = about(own, [c.x - w / 2 + ox, c.y - h / 2 + oy, 0])
    if (parent) {
      if (parent.perspective > 0) {
        const [px, py] = parseOrigin(
          parent.perspectiveOrigin,
          parent.w,
          parent.h,
        )
        const persp = new DOMMatrix()
        persp.m34 = -1 / parent.perspective
        m = about(persp, [
          parent.c.x - parent.w / 2 + px,
          parent.c.y - parent.h / 2 + py,
          0,
        ]).multiply(m)
      }
      if (
        !parent.preserve3d &&
        (parentWorld.m31 || parentWorld.m32 || parentWorld.m34)
      ) {
        const flat = new DOMMatrix() // drop the child's z before the parent's matrix sees it
        flat.m33 = 0
        m = flat.multiply(m)
      }
    }
    return parentWorld.multiply(m)
  }

  const solved = target || !own.isIdentity || perspective > 0
  if (solved && !(w > 0 || h > 0)) {
    cache.set(el, null)
    return null
  }
  const c = solved
    ? solveLayoutCentre(el.getBoundingClientRect(), w, h, place)
    : { x: 0, y: 0 } // identity and no perspective: position is irrelevant
  const frame = c && {
    c,
    w,
    h,
    world: place(c),
    perspective,
    perspectiveOrigin: style.perspectiveOrigin || '50% 50%',
    preserve3d: style.transformStyle === 'preserve-3d',
    solved,
  }
  cache.set(el, frame)
  return frame
}

/**
 * Exact overlay for elements in chains that involve 3D or perspective.
 *
 * Inverting the node's bounding rect alone (as the 2D path does) can't work here: the
 * centre isn't at z = 0, perspective lives in the provider's local frame, and
 * `transform-style` decides which ancestors compose in 3D. See `getFrame`.
 *
 * The result is a box at the layout position plus one `matrix3d` (translation, scale
 * and perspective included) to be applied about the box centre.
 *
 * Returns `null` for plain 2D chains, and whenever the model can't reproduce the
 * browser's rects, so the caller falls back to the 2D path.
 */
function getExactOverlay(node: Element, cache: FrameCache = new Map()) {
  if (!(node instanceof HTMLElement) || getStyle(node).display === 'inline') {
    return null
  }
  if (getFullTransform(node).is2D && !hasPerspectiveAncestor(node)) {
    return null
  }

  const frame = getFrame(node, cache, true)
  if (!frame) {
    return null
  }

  const { c, w, h, world } = frame
  // The consumer applies `matrix` about the box centre: T(c) * matrix * T(-c) === world
  const matrix = translation(-c.x, -c.y)
    .multiply(world)
    .multiply(translation(c.x, c.y))

  // Flattening zeroes z going into and/or out of the matrix, which makes it singular:
  // it can't be inverted (hit-testing, gizmo drags) and some consumers drop the element.
  // Nothing is visible along z after flattening, so let z pass straight through.
  const noZOut = !(matrix.m13 || matrix.m23 || matrix.m33 || matrix.m43)
  const noZIn = !(matrix.m31 || matrix.m32 || matrix.m33 || matrix.m34)
  if (noZOut || noZIn) {
    matrix.m33 = 1
  }

  return {
    rect: new DOMRect(c.x - w / 2, c.y - h / 2, w, h),
    rotate: matrix.toString(),
  }
}
