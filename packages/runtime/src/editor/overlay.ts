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
  } = window.getComputedStyle(selectedNode)

  const { rect, rotate } = getScaledIntrinsicRect(selectedNode)

  const parentElement = selectedNode.parentElement
  const parent =
    parentElement && parentElement !== document.documentElement
      ? getParentRectData(parentElement)
      : null

  const children = Array.from(selectedNode.children).map((child) =>
    getBasicRectData(child),
  )

  const perspective = getPerspectiveData(selectedNode)

  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
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
    transformOrigin,
    parent,
    children,
    perspective,
  }
}

function getPerspectiveData(selectedNode: Element) {
  const provider = getPerspectiveProvider(selectedNode)
  if (!provider) {
    return null
  }

  const providerStyle = window.getComputedStyle(provider)
  const providerTransform = getFullTransform(provider)
  const intrinsicRect = getIntrinsicRect(provider, providerTransform)

  const [originX, originY] = parsePerspectiveOrigin(
    providerStyle.perspectiveOrigin,
    intrinsicRect.width, // ✅ intrinsic (untransformed, unscaled) size
    intrinsicRect.height,
  )

  // Offset of the origin point from the box's own center, in the provider's LOCAL
  // (untransformed) coordinate space.
  const localOffsetX = originX - intrinsicRect.width / 2
  const localOffsetY = originY - intrinsicRect.height / 2

  // Rotate/scale that offset into world space using the provider's full accumulated
  // transform, since perspective-origin is a point fixed to the provider's own box,
  // not to axis-aligned space.
  const matrix = new DOMMatrix(providerTransform)
  const worldOffset = matrix.transformPoint(
    new DOMPoint(localOffsetX, localOffsetY),
  )

  // The raw AABB center is transform-invariant (default center transform-origin),
  // so it's a safe anchor to add the rotated offset to.
  const rawRect = provider.getBoundingClientRect()
  const centerX = rawRect.left + rawRect.width / 2
  const centerY = rawRect.top + rawRect.height / 2

  const originViewportX = centerX + worldOffset.x
  const originViewportY = centerY + worldOffset.y

  return {
    perspective: providerStyle.perspective,
    origin: {
      x: originViewportX + window.scrollX,
      y: originViewportY + window.scrollY,
    },
  }
}

function getPerspectiveProvider(node: Element): Element | null {
  let current: Element | null = node.parentElement

  while (current && current !== document.documentElement) {
    if (window.getComputedStyle(current).perspective !== 'none') {
      return current
    }
    current = current.parentElement
  }

  return null
}

function parsePerspectiveOrigin(
  value: string,
  width: number,
  height: number,
): [number, number] {
  const parts = value.trim().split(/\s+/)
  const xToken = parts[0] ?? '50%'
  const yToken = parts[1] ?? '50%'

  return [resolveLength(xToken, width), resolveLength(yToken, height)]
}

function resolveLength(token: string, size: number): number {
  if (token.endsWith('%')) {
    return (parseFloat(token) / 100) * size
  }
  return parseFloat(token) || 0
}

function getBasicRectData(node: Element) {
  const { rect } = getScaledIntrinsicRect(node)

  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  }
}

function getParentRectData(parentElement: Element) {
  const { rowGap, columnGap, padding } = window.getComputedStyle(parentElement)

  return {
    ...getBasicRectData(parentElement),
    rowGap,
    columnGap,
    padding: padding.split(' '),
  }
}

function getScaledIntrinsicRect(node: Element): {
  rect: DOMRect
  rotate: string
} {
  const fullTransform = getFullTransform(node)
  const { rotateSkew } = decomposeScale(new DOMMatrix(fullTransform))
  const rotate = rotateSkew.toString()
  const rect = getIntrinsicRect(node, rotate)

  return { rect, rotate }
}

function decomposeScale(matrix: DOMMatrix): {
  rotateSkew: DOMMatrix
  scaleX: number
  scaleY: number
} {
  if (!matrix.is2D) {
    return { rotateSkew: matrix, scaleX: 1, scaleY: 1 }
  }

  const { a, b, c, d } = matrix

  const scaleX = Math.hypot(a, b)
  const a1 = scaleX ? a / scaleX : 0
  const b1 = scaleX ? b / scaleX : 0

  // Component of the second column along the (normalized) first column - the shear coupling
  // that has to be removed before measuring scaleY orthogonally.
  const skew = a1 * c + b1 * d
  const scaleY = Math.hypot(c - a1 * skew, d - b1 * skew)

  if (!scaleX || !scaleY) {
    // Degenerate (zero-size along an axis) - nothing sane to divide by, leave matrix as-is.
    return { rotateSkew: matrix, scaleX: 1, scaleY: 1 }
  }

  const rotateSkew = new DOMMatrix([
    a / scaleX,
    b / scaleX,
    c / scaleY,
    d / scaleY,
    0,
    0,
  ])

  return { rotateSkew, scaleX, scaleY }
}

function getIntrinsicRect(node: Element, transform: string): DOMRect {
  const computed = window.getComputedStyle(node)
  const isInline = computed.display === 'inline'
  const rect = isInline ? getInlineRect(node) : node.getBoundingClientRect()

  const matrix = new DOMMatrix(transform)

  if (matrix.isIdentity) {
    return rect
  }

  const underProjectiveDistortion =
    !matrix.is2D && getPerspectiveProvider(node) !== null

  if (underProjectiveDistortion && !isInline && node instanceof HTMLElement) {
    return getLayoutBoxRect(node, computed)
  }

  const a = Math.abs(matrix.a)
  const b = Math.abs(matrix.b)
  const c = Math.abs(matrix.c)
  const d = Math.abs(matrix.d)

  const det = a * d - b * c

  let width = rect.width
  let height = rect.height

  if (Math.abs(det) > 1e-6) {
    const exactW = (rect.width * d - rect.height * c) / det
    const exactH = (rect.height * a - rect.width * b) / det
    if (exactW > 0 && exactH > 0) {
      width = exactW
      height = exactH
    }
  }

  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const left = cx - width / 2
  const top = cy - height / 2

  return new DOMRect(left, top, width, height)
}

function getLayoutBoxRect(
  node: HTMLElement,
  computed: CSSStyleDeclaration,
): DOMRect {
  const width = node.offsetWidth
  const height = node.offsetHeight

  if (computed.boxSizing === 'content-box') {
    // offsetWidth/Height are always border-box; getBoundingClientRect (used for position/other
    // callers) is expected to be border-box too, so no conversion needed here — content-box
    // sizing only affects how `width`/`height` CSS properties are interpreted upstream, not
    // what offsetWidth reports.
  }

  const rawRect = node.getBoundingClientRect()
  const cx = rawRect.left + rawRect.width / 2
  const cy = rawRect.top + rawRect.height / 2

  return new DOMRect(cx - width / 2, cy - height / 2, width, height)
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

function getFullTransform(node: Element): string {
  let combined = new DOMMatrix()
  let current: Element | null = node

  while (current && current !== document.documentElement) {
    const { transform, rotate } = window.getComputedStyle(current)

    let level = new DOMMatrix()
    if (rotate !== 'none') {
      level = parseRotate(rotate).multiply(level)
    }
    if (transform !== 'none') {
      level = new DOMMatrix(transform).multiply(level)
    }

    combined = level.multiply(combined)

    current = current.parentElement
  }

  combined.e = 0
  combined.f = 0
  combined.m43 = 0

  return combined.toString()
}

function parseRotate(rotate: string): DOMMatrix {
  const matrix = new DOMMatrix()
  if (!rotate || rotate === 'none') {
    return matrix
  }

  const parts = rotate.trim().split(/\s+/)
  const angle = parseFloat(parts[parts.length - 1])

  switch (parts.length) {
    case 1:
      return matrix.rotateSelf(0, 0, angle)
    case 2: {
      const axis = parts[0].toLowerCase()
      if (axis === 'x') return matrix.rotateSelf(angle, 0, 0)
      if (axis === 'y') return matrix.rotateSelf(0, angle, 0)
      if (axis === 'z') return matrix.rotateSelf(0, 0, angle)
      return matrix
    }
    case 4: {
      const [x, y, z] = parts.slice(0, 3).map(parseFloat)
      return matrix.rotateAxisAngleSelf(x, y, z, angle)
    }
    default:
      return matrix
  }
}
