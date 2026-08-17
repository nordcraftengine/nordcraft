export function getRectData(selectedNode: Element | null | undefined) {
  if (!selectedNode) {
    return null
  }

  const { borderRadius, padding, margin, gap } =
    window.getComputedStyle(selectedNode)

  const rotate = getFullRotation(selectedNode)
  const rect = getIntrinsicRect(selectedNode, rotate)

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
    rotate,
  }
}

/**
 * Intrinsic size is the size of the element without any rotation applied (ie. the smallest
 * bounding box that can contain the element). getBoundingClientRect() includes rotation, so we
 * temporarily undo it (see neutralizeRotation) to measure the unrotated box.
 */
function getIntrinsicRect(node: Element, rotate: string): DOMRect {
  const isInline = window.getComputedStyle(node).display === 'inline'
  const rect = isInline ? getInlineRect(node) : node.getBoundingClientRect()

  const matrix = new DOMMatrix(rotate)
  if (matrix.isIdentity) {
    return rect
  }

  const inverse = matrix.inverse()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const transformPoint = (x: number, y: number) => {
    const dx = x - cx
    const dy = y - cy
    const tx = inverse.a * dx + inverse.c * dy + inverse.e
    const ty = inverse.b * dx + inverse.d * dy + inverse.f
    return {
      x: tx + cx,
      y: ty + cy,
    }
  }

  const p1 = transformPoint(rect.left, rect.top)
  const p2 = transformPoint(rect.left + rect.width, rect.top)
  const p3 = transformPoint(rect.left, rect.top + rect.height)
  const p4 = transformPoint(rect.left + rect.width, rect.top + rect.height)

  const xs = [p1.x, p2.x, p3.x, p4.x]
  const ys = [p1.y, p2.y, p3.y, p4.y]

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  let width = maxX - minX
  let height = maxY - minY

  const a = Math.abs(matrix.a)
  const c = Math.abs(matrix.c)
  const denom = a * a - c * c

  if (Math.abs(denom) > 0.15) {
    const exactW = (rect.width * a - rect.height * c) / denom
    const exactH = (rect.height * a - rect.width * c) / denom
    if (exactW > 0 && exactH > 0) {
      width = exactW
      height = exactH
    }
  }

  const left = cx - width / 2
  const top = cy - height / 2
  return new DOMRect(left, top, width, height)
}

/**
 * Uses a Range to get a stable, precise rect around the text content of an inline element/span.
 * This avoids browser-dependent baseline/line-height quirks that getBoundingClientRect()
 * can produce for inline elements.
 */
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
 * There is no well supported API to get the "world" rotation of an element (even though the
 * browser knows it and uses it internally). This traverses up the DOM tree, multiplying the
 * rotation matrices of each ancestor to get the combined rotation in world space.
 */
function getFullRotation(node: Element): string {
  let combined = new DOMMatrix()
  let current: Element | null = node

  while (current && current !== document.documentElement) {
    const { transform, rotate } = window.getComputedStyle(current)

    if (transform !== 'none') {
      combined = new DOMMatrix(transform).multiply(combined)
    }
    if (rotate !== 'none') {
      combined = parseRotate(rotate).multiply(combined)
    }

    current = current.parentElement
  }

  return extractRotationMatrix(combined).toString()
}

/** Strips scale from a matrix, leaving only rotation. */
function extractRotationMatrix(m: DOMMatrix): DOMMatrix {
  const sx = Math.hypot(m.m11, m.m12, m.m13) || 1
  const sy = Math.hypot(m.m21, m.m22, m.m23) || 1
  const sz = Math.hypot(m.m31, m.m32, m.m33) || 1

  if (m.is2D) {
    return new DOMMatrix([m.a / sx, m.b / sx, m.c / sy, m.d / sy, 0, 0])
  }

  return new DOMMatrix([
    m.m11 / sx,
    m.m12 / sx,
    m.m13 / sx,
    0,
    m.m21 / sy,
    m.m22 / sy,
    m.m23 / sy,
    0,
    m.m31 / sz,
    m.m32 / sz,
    m.m33 / sz,
    0,
    0,
    0,
    0,
    1,
  ])
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
