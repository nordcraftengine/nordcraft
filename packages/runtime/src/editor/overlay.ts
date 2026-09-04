export function getRectData(selectedNode: Element | null | undefined) {
  if (!selectedNode) {
    return null
  }

  const { borderRadius, padding, margin, gap, transformOrigin } =
    window.getComputedStyle(selectedNode)

  const rotate = getFullTransform(selectedNode)
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
    transformOrigin,
  }
}

/**
 * Intrinsic size is the size of the element without any rotation/scale/skew applied (ie. the
 * untransformed layout box). getBoundingClientRect() includes the full transform, so we solve
 * for the untransformed width/height that would produce the observed (transformed) bounding box,
 * given the element's full local affine transform matrix.
 *
 * For a W x H rect transformed by 2x2 matrix [[a,c],[b,d]] (DOMMatrix convention:
 * x' = a*x + c*y, y' = b*x + d*y), the axis-aligned bounding box of the resulting parallelogram
 * satisfies:
 *   bboxWidth  = |a|*W + |c|*H
 *   bboxHeight = |b|*W + |d|*H
 * Inverting this (Cramer's rule) recovers W and H exactly for ANY combination of rotation,
 * scale, and skew — not just pure rotation like the old a/c-only formula assumed.
 *
 * Note: this assumes the pivot (transform-origin) is at the element's own center (the CSS
 * default, 50% 50%). That's a safe assumption because any linear map preserves central
 * symmetry - for every corner there's an antipodal corner, so the bbox stays centered on the
 * same point regardless of rotation/scale/skew. If transform-origin is overridden to something
 * off-center, this positioning will be off and needs separate handling.
 */
function getIntrinsicRect(node: Element, transform: string): DOMRect {
  const isInline = window.getComputedStyle(node).display === 'inline'
  const rect = isInline ? getInlineRect(node) : node.getBoundingClientRect()

  const matrix = new DOMMatrix(transform)
  if (matrix.isIdentity) {
    return rect
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
 * There is no well supported API to get the "world" transform of an element (even though the
 * browser knows it and uses it internally). This traverses up the DOM tree, multiplying the
 * transform/rotate matrices of each ancestor to get the combined LOCAL affine transform in
 * world space — rotation, scale, AND skew. This is what needs to be applied to an overlay
 * element to exactly reproduce the visual shape, including skewed elements.
 */
function getFullTransform(node: Element): string {
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

  // Strip translation - position is handled separately via left/top on the overlay, so we
  // only want the linear part (rotation + scale + skew) here.
  combined.e = 0
  combined.f = 0

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
