/* eslint-disable max-params */

type Scale = [x: number, y: number]

/**
 * Measures an element so an overlay can be drawn on top of it that matches exactly.
 *
 * The overlay is described as an *untransformed* box plus a `rotate` matrix
 * (rotation/skew/3D only). Scale is deliberately NOT part of that matrix: it is
 * baked into the box's width/height instead, so the consumer only needs to apply
 * `matrix` around the box centre.
 */
export function getRectData(selectedNode: Element | null | undefined) {
  if (!selectedNode) {
    return null
  }

  const {
    display,
    borderRadius,
    padding,
    margin,
    flexDirection,
    gap,
    rowGap,
    columnGap,
    transformOrigin,
    boxSizing,
  } = getStyle(selectedNode)

  const { rect, rotate } = getScaledIntrinsicRect(selectedNode)
  const parent = selectedNode.parentElement

  return {
    ...toRectData(rect),
    borderRadius: borderRadius.split(' '),
    padding: padding.split(' '),
    margin: margin.split(' '),
    gap: gap.split(' '),
    boxSizing,
    display,
    flexDirection,
    rowGap,
    columnGap,
    rotate,
    matrix: rotate,
    perspective: getPerspectiveData(selectedNode),
    transformOrigin,
    parent:
      parent && parent !== document.documentElement
        ? getParentRectData(parent)
        : null,
    children: Array.from(selectedNode.children).map(getBasicRectData),
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
  x,
  y,
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

const getBasicRectData = (node: Element) =>
  toRectData(getScaledIntrinsicRect(node).rect)

function getParentRectData(parent: Element) {
  const { rowGap, columnGap, padding } = getStyle(parent)
  return {
    ...getBasicRectData(parent),
    rowGap,
    columnGap,
    padding: padding.split(' '),
  }
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
  const [originX, originY] = parsePerspectiveOrigin(
    perspectiveOrigin,
    width,
    height,
  )

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

function parsePerspectiveOrigin(
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
    computed[name] ||
    inline?.getPropertyValue(name) ||
    (inline as any)?.[name] ||
    'none'

  return {
    transform: get('transform'),
    rotate: get('rotate'),
    scale: get('scale'),
    translate: get('translate'),
  }
}

/**
 * Accumulated transform of `node` and all its ancestors, with translation
 * removed (only rotation / skew / scale / 3D remain).
 */
function getFullTransform(node: Element): DOMMatrix {
  let combined = new DOMMatrix()

  for (
    let el: Element | null = node;
    el && el !== document.documentElement;
    el = el.parentElement
  ) {
    const { transform, rotate, scale, translate } = getTransformStyles(el)
    // CSS order: translate, rotate, scale, then transform list.
    combined = parseTranslate(translate)
      .multiply(parseRotate(rotate))
      .multiply(parseScale(scale))
      .multiply(parseTransform(transform))
      .multiply(combined)
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
