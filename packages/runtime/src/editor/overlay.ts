/* eslint-disable max-params */

import { escapeRegex } from './dom'

type Scale = [x: number, y: number]

type Point = { x: number; y: number }

const SIDES = ['Top', 'Right', 'Bottom', 'Left']

const CORNER_NAMES = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft']

/** Unit-square corners; scale by half a box's size to get its corner offsets. */
const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

/** Computed `${prefix}${name}${suffix}` values (e.g. `borderTopWidth`), `'0px'` when empty. */
const lengths = (
  style: CSSStyleDeclaration,
  names: string[],
  prefix: string,
  suffix = '',
) =>
  names.map(
    (name) =>
      (style as unknown as Record<string, string>)[
        `${prefix}${name}${suffix}`
      ] || '0px',
  )

/** Centre point of a rect. */
const centre = ({
  left,
  top,
  width,
  height,
}: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>): Point => ({
  x: left + width / 2,
  y: top + height / 2,
})

/** A `w` x `h` rect centred on `c`. */
const rectFromCentre = (c: Point, w: number, h: number) =>
  new DOMRect(c.x - w / 2, c.y - h / 2, w, h)

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

  const style = getStyle(selectedNode)
  const {
    display,
    borderRadius,
    flexDirection,
    gap,
    rowGap,
    columnGap,
    transformOrigin,
    boxSizing,
  } = style

  // Solved frames are shared by the node, its parent, children and repeat items.
  const cache: FrameCache = new Map()
  const exact = getExactOverlay(selectedNode, cache)
  const {
    rect,
    rotate: matrix,
    scale: boxScale,
  } = exact ?? getScaledIntrinsicRect(selectedNode)
  const parent = selectedNode.parentElement
  const parentData =
    parent && parent !== document.documentElement
      ? getParentRectData(parent, cache)
      : null

  return {
    ...toRectData(rect),
    // How much bigger the overlay box is than the layout box.
    // Multiply transform-origin by this to get it in overlay-box px.
    boxScale,
    boundingClientRect: toRectData(selectedNode.getBoundingClientRect()),
    border: lengths(style, SIDES, 'border', 'Width'),
    borderRadius: borderRadius
      ? borderRadius.split(' ')
      : lengths(style, CORNER_NAMES, 'border', 'Radius'),
    padding: lengths(style, SIDES, 'padding'),
    margin: lengths(style, SIDES, 'margin'),
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
      transform: style.transform,
      translate: style.translate,
      scale: style.scale,
      rotate: style.rotate,
      perspective: style.perspective,
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
}: DOMRect) => ({ left, top, right, bottom, width, height, x, y })

/**
 * Rect of a related element (parent, child, repeat item). Elements in a 3D /
 * perspective chain also get their own `matrix`, to be drawn exactly like the
 * selected node: box at `left/top/width/height`, `matrix` about its own centre.
 * Without a `matrix` the element is in the 2D flavour and is drawn as before.
 */
const getBasicRectData = (node: Element, cache: FrameCache = new Map()) => {
  const exact = getExactOverlay(node, cache)
  const { rect, scale } = exact ?? getScaledIntrinsicRect(node)
  return {
    ...toRectData(rect),
    boxScale: scale,
    ...(exact && { matrix: exact.rotate }),
  }
}

function getParentRectData(parent: Element, cache: FrameCache) {
  const style = getStyle(parent)
  return {
    ...getBasicRectData(parent, cache),
    rowGap: style.rowGap,
    columnGap: style.columnGap,
    padding: lengths(style, SIDES, 'padding'),
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
  const repeatNodes = Array.from(parent.children).filter((child) =>
    repeatRegex.test(child.getAttribute('data-id') ?? ''),
  )

  return repeatNodes.length
    ? repeatNodes.map((node) => getBasicRectData(node, cache))
    : null
}

/** `el` and its ancestors (innermost first), stopping before <html>. */
function getChain(el: Element | null) {
  const chain: Element[] = []
  for (; el && el !== document.documentElement; el = el.parentElement) {
    chain.push(el)
  }
  return chain
}

/** The nearest ancestor with a real `perspective`, if any. */
const getPerspectiveProvider = (node: Element) =>
  getChain(node.parentElement).find(
    (el) => parseFloat(getStyle(el).perspective) > 0,
  ) ?? null

function getPerspectiveInfo(provider: Element) {
  const { perspective, perspectiveOrigin } = getStyle(provider)
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
  const { x, y } = centre(provider.getBoundingClientRect())

  return {
    d: parseFloat(perspective),
    perspective,
    ox: x + offset.x,
    oy: y + offset.y,
  }
}

function getPerspectiveData(node: Element) {
  const provider = getPerspectiveProvider(node)
  if (!provider) {
    return null
  }

  const { perspective, ox, oy } = getPerspectiveInfo(provider)
  return {
    perspective,
    origin: { x: ox + window.scrollX, y: oy + window.scrollY },
  }
}

/**
 * Calculates the exact centre of an element under 3D perspective projection.
 *
 * Perspective causes the nearer edge to appear larger than the further edge,
 * producing an asymmetric trapezoid whose AABB centre no longer coincides
 * with the element's actual centre. This solves for the true centre point
 * such that its perspective projection matches the observed AABB bounds.
 *
 * NOTE: this is only used as a fallback now (see `getExactOverlay`). It assumes the
 * centre sits at z = 0 and that perspective is applied in screen space, which is
 * wrong as soon as an ancestor has a 3D transform.
 */
function getPerspectiveCenter(
  provider: Element,
  matrix: DOMMatrix,
  width: number,
  height: number,
  rect: DOMRect,
): Point {
  const { d, ox, oy } = getPerspectiveInfo(provider)

  // Transformed corners and their perspective scale don't depend on the centre
  // being solved for, so compute them once.
  const corners = CORNERS.map(([sx, sy]) => {
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

  const aabb = centre(rect)
  let U = aabb.x - ox
  let V = aabb.y - oy
  for (let i = 0; i < 3; i++) {
    U = refine('x', U, rect.left, rect.right, ox)
    V = refine('y', V, rect.top, rect.bottom, oy)
  }

  return { x: ox + U, y: oy + V }
}

/** Resolves a CSS origin string (`'50% 50%'`, `'10px 20px'`) to px in a `width` x `height` box. */
function parseOrigin(
  value: string | undefined,
  width: number,
  height: number,
): [number, number] {
  const [x = '50%', y = '50%'] = (value ?? '').split(/\s+/).filter(Boolean)
  const resolve = (token: string, size: number) =>
    token.endsWith('%')
      ? (parseFloat(token) / 100) * size
      : parseFloat(token) || 0

  return [resolve(x, width), resolve(y, height)]
}

function getTransformStyles(el: Element) {
  const computed = getStyle(el)
  const inline = (el as HTMLElement).style

  const get = (name: 'transform' | 'rotate' | 'scale' | 'translate'): string =>
    computed[name] || inline?.getPropertyValue(name) || 'none'

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

/** Product of `own(el)` over `node` and its ancestors, outermost transform first. */
const composeChain = (node: Element, own: (el: Element) => DOMMatrix) =>
  getChain(node).reduce((m, el) => own(el).multiply(m), new DOMMatrix())

/**
 * Pure orientation of the element: every ancestor's rotate × the
 * element's own rotate, with translation, perspective, scale and skew removed.
 *
 * Unlike `matrix` this ignores flattening by non-preserve-3d parents, so it always
 * describes the element's intended 3D direction. Use it for orientation-only
 * consumers (e.g. the transform gizmo); `matrix` remains the source of truth for
 * where the overlay is drawn.
 *
 * Skew must not leak into the orientation: `transform: skewX(20deg)` alone has no
 * rotation, so this returns identity (a symmetric orthonormalisation would split
 * the skew evenly between the axes and misorient the rotate-tool gizmo).
 */
function getRotationMatrix(node: Element): string {
  const combined = composeChain(node, getOwnRotation)

  // Pure rotations compose to a pure rotation, but round for stable output.
  // `|| 0` folds -0 into 0.
  const round = (n: number) => Math.round(n * 1e6) / 1e6 || 0
  const col = (c: number) =>
    [1, 2, 3].map((r) => round(combined[`m${c}${r}` as 'm11']))
  return `matrix3d(${[...col(1), 0, ...col(2), 0, ...col(3), 0, 0, 0, 0, 1].join(', ')})`
}

/**
 * The element's own rotation as a matrix: the `rotate` property × the
 * `rotate*` functions in the `transform` list, in CSS order
 * (translate, rotate, scale, then the transform list).
 * Scale, skew, translate, perspective and `matrix()` mixing are ignored,
 * except `matrix()`/`matrix3d()` which are decomposed best-effort (they
 * mix rotate/scale/skew and cannot be separated exactly).
 */
function getOwnRotation(el: Element): DOMMatrix {
  const { transform, rotate } = getTransformStyles(el)
  return parseRotate(rotate).multiply(parseTransformRotates(transform))
}

/** Rotation-only part of a `transform` list, preserving outer-to-inner order. */
function parseTransformRotates(value: string): DOMMatrix {
  const funcs = value.match(/[a-zA-Z0-9]+\([^)]*\)/g) ?? []
  let acc = new DOMMatrix()
  for (const func of funcs) {
    const name = func.slice(0, func.indexOf('(')).toLowerCase()
    if (name.startsWith('rotate')) {
      // Pure rotation (rotate, rotateX/Y/Z/3d): no scale/skew to remove.
      acc = acc.multiply(new DOMMatrix(func))
    } else if (name === 'matrix' || name === 'matrix3d') {
      // Mixed rotate/scale/skew: best-effort extraction (symmetric split,
      // minimising worst-case bias when the true decomposition is unknown).
      acc = acc.multiply(rotationFromMatrix(new DOMMatrix(func)))
    }
    // translate, scale, skew, perspective: no rotation, skip.
  }
  return acc
}

/**
 * Closest rotation to `m` (symmetric orthonormalisation, skew split evenly).
 * Only used for `matrix()`/`matrix3d()` functions in the transform list,
 * which mix rotate/scale/skew and cannot be separated exactly.
 */
function rotationFromMatrix(m: DOMMatrix): DOMMatrix {
  const norm = (v: number[]) => {
    const l = Math.hypot(...v)
    return l > 1e-9 ? v.map((n) => n / l) : null
  }

  // DOMMatrix columns: m11..m13 = image of the x axis, m21..m23 = image of the y axis
  const x = norm([m.m11, m.m12, m.m13])
  const y = norm([m.m21, m.m22, m.m23])
  const h = x && y && norm(x.map((n, i) => n + y[i]))
  const k = x && y && norm(x.map((n, i) => n - y[i]))
  if (!h || !k) {
    return new DOMMatrix()
  }

  const X = h.map((n, i) => (n + k[i]) * Math.SQRT1_2)
  const Y = h.map((n, i) => (n - k[i]) * Math.SQRT1_2)
  const Z = [
    X[1] * Y[2] - X[2] * Y[1],
    X[2] * Y[0] - X[0] * Y[2],
    X[0] * Y[1] - X[1] * Y[0],
  ]

  return new DOMMatrix([...X, 0, ...Y, 0, ...Z, 0, 0, 0, 0, 1])
}

/**
 * Accumulated transform of `node` and all its ancestors, with translation
 * removed (only rotation / skew / scale / 3D remain).
 *
 * This is the naive product used by the 2D path. It knows nothing about
 * perspective or `transform-style`; for 3D chains see `getExactOverlay`.
 */
function getFullTransform(node: Element): DOMMatrix {
  const combined = composeChain(node, getOwnTransform)
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

// `grad` has to come before `rad`, since "grad" ends with "rad".
const ANGLE_UNITS: [suffix: string, degrees: number][] = [
  ['turn', 360],
  ['grad', 0.9],
  ['rad', 180 / Math.PI],
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
  const { a, b, c, d } = matrix
  const scaleX = Math.hypot(a, b)
  const [a1, b1] = [a / scaleX, b / scaleX]
  const skew = a1 * c + b1 * d
  const scaleY = Math.hypot(c - a1 * skew, d - b1 * skew)

  return !matrix.is2D || !scaleX || !scaleY
    ? { rotateSkew: matrix, scale: [1, 1] as Scale }
    : {
        rotateSkew: new DOMMatrix([a1, b1, c / scaleY, d / scaleY, 0, 0]),
        scale: [scaleX, scaleY] as Scale,
      }
}

/** Untransformed box (with scale applied to its size) plus the rotate/skew matrix as a string. */
function getScaledIntrinsicRect(node: Element) {
  const { rotateSkew, scale } = decomposeScale(getFullTransform(node))
  const rect = getIntrinsicRect(node, rotateSkew, scale)

  return {
    rect,
    rotate: rotateSkew.toString(),
    // How much bigger the overlay box is than the layout box. Derived from
    // the actual box (not the raw decomposition) so the near-45° fitted path
    // — where the box is `k * layout * scale` — stays exact.
    scale: getBakedScale(node, rect, scale),
  }
}

/**
 * Actual overlay-box / layout-box ratio, falling back to the decomposed scale
 * when the layout size is unavailable (inline/SVG without a measurable box).
 */
function getBakedScale(node: Element, rect: DOMRect, fallback: Scale): Scale {
  const layout = getLayoutSize(node, getStyle(node))
  return layout &&
    layout.width > 0 &&
    layout.height > 0 &&
    rect.width > 0 &&
    rect.height > 0
    ? [rect.width / layout.width, rect.height / layout.height]
    : fallback
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
  const provider =
    !matrix.is2D && !isInline ? getPerspectiveProvider(node) : null
  if (provider) {
    const [width, height] = layout
      ? [layout.width * scaleX, layout.height * scaleY]
      : node instanceof HTMLElement
        ? [0, 0]
        : [rect.width, rect.height]
    const c = getPerspectiveCenter(provider, matrix, width, height, rect)
    return rectFromCentre(c, width, height)
  }

  const [a, b, c, d] = [matrix.a, matrix.b, matrix.c, matrix.d].map(Math.abs)
  const det = a * d - b * c

  // Relative to the column lengths so the test doesn't depend on scale/skew.
  if (Math.abs(det) / (Math.hypot(a, b) * Math.hypot(c, d)) > 0.05) {
    const width = (rect.width * d - rect.height * c) / det
    const height = (rect.height * a - rect.width * b) / det
    if (width > 0 && height > 0) {
      return rectFromCentre(centre(rect), width, height)
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
  return rectFromCentre(centre(rect), k * layoutW, k * layoutH)
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

  const extra = (start: string, end: string) =>
    [
      `padding-${start}`,
      `padding-${end}`,
      `border-${start}-width`,
      `border-${end}-width`,
    ]
      .map((p) => parseFloat(computed.getPropertyValue(p)) || 0)
      .reduce((t, v) => t + v, 0)

  return {
    width: width + extra('left', 'right'),
    height: height + extra('top', 'bottom'),
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
  // getFullTransform skips <html>, so it is identity if the parent is the root.
  const { rotateSkew } = decomposeScale(
    parent ? getFullTransform(parent) : new DOMMatrix(),
  )
  return rotateSkew.toString()
}

// ---------------------------------------------------------------------------
// Exact overlay for 3D / perspective chains
// ---------------------------------------------------------------------------

const translation = (x: number, y: number, z = 0) =>
  new DOMMatrix().translateSelf(x, y, z)

/** `m` applied about the point `origin` instead of about (0, 0, 0). */
const about = (m: DOMMatrix, [x, y, z]: [number, number, number]) =>
  translation(x, y, z)
    .multiply(m)
    .multiply(translation(-x, -y, -z))

/** The point an origin string refers to, for a `w` x `h` box centred on `c`. */
function originPoint(
  value: string | undefined,
  c: Point,
  w: number,
  h: number,
): [number, number, number] {
  const [x, y] = parseOrigin(value, w, h)
  return [c.x - w / 2 + x, c.y - h / 2 + y, 0]
}

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

  let c = centre(target)
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

  const p =
    el.parentElement !== document.documentElement ? el.parentElement : null
  const parent = p && getFrame(p, cache)
  if (!(el instanceof HTMLElement) || (p && !parent)) {
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
    let m = about(own, originPoint(style.transformOrigin, c, w, h))
    if (parent) {
      if (parent.perspective > 0) {
        const persp = new DOMMatrix()
        persp.m34 = -1 / parent.perspective
        const origin = originPoint(
          parent.perspectiveOrigin,
          parent.c,
          parent.w,
          parent.h,
        )
        m = about(persp, origin).multiply(m)
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
    perspectiveOrigin: style.perspectiveOrigin,
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
  if (getFullTransform(node).is2D && !getPerspectiveProvider(node)) {
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
    rect: rectFromCentre(c, w, h),
    rotate: matrix.toString(),
    scale: [1, 1] as Scale,
  }
}
