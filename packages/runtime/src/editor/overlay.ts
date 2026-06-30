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
    rotate: rotate,
    padding: padding.split(' '),
    margin: margin.split(' '),
    gap: gap.split(' '),
    fullRotation: rotate,
  }
}

/**
 * Intrinsic size is the size of the element without any rotation applied (ie. the smallest bounding box that can contain the element).
 * By default, getBoundingClientRect() returns a rectangle that contains the element as-is, so undoing the rotation is necessary to get the intrinsic size.
 */
function getIntrinsicRect(
  node: Element,
  rotate: string,
): {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
  x: number
  y: number
} {
  const nodeEl = node as HTMLElement
  const prevTransform = nodeEl.style.transform
  const prevDisplay = nodeEl.style.display
  const style = window.getComputedStyle(nodeEl)
  const currentTransform = style.transform
  const baseTransform =
    currentTransform === 'none' ? 'matrix(1,0,0,1,0,0)' : currentTransform

  if (style.display === 'inline') {
    nodeEl.style.setProperty('display', 'inline-block', 'important')
  }

  nodeEl.style.setProperty(
    'transform',
    `${new DOMMatrix(rotate).inverse().toString()} ${baseTransform}`,
    'important',
  )

  const rect = node.getBoundingClientRect()

  if (prevTransform) {
    nodeEl.style.setProperty('transform', prevTransform)
  } else {
    nodeEl.style.removeProperty('transform')
  }

  if (prevDisplay) {
    nodeEl.style.setProperty('display', prevDisplay)
  } else {
    nodeEl.style.removeProperty('display')
  }

  return rect
}

/**
 * There is no well supported API to get the "world" rotation of an element (even though the browser knows it and uses it internally).
 * This function traverses up the DOM tree and multiplies the rotation matrices of each element to get the combined rotation of the element in world space.
 */
function getFullRotation(node: Element): string {
  let combined = new DOMMatrix()
  let current: Element | null = node

  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current)
    const { transform, rotate } = style

    if (transform && transform !== 'none') {
      combined = new DOMMatrix(transform).multiply(combined)
    }
    if (rotate && rotate !== 'none') {
      combined = parseRotate(rotate).multiply(combined)
    }

    current = current.parentElement
  }

  return extractRotationMatrix(combined).toString()
}

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

  if (parts.length === 1) {
    return matrix.rotateSelf(0, 0, angle)
  }

  if (parts.length === 2) {
    const axis = parts[0].toLowerCase()
    if (axis === 'x') return matrix.rotateSelf(angle, 0, 0)
    if (axis === 'y') return matrix.rotateSelf(0, angle, 0)
    if (axis === 'z') return matrix.rotateSelf(0, 0, angle)
  }

  if (parts.length === 4) {
    const x = parseFloat(parts[0])
    const y = parseFloat(parts[1])
    const z = parseFloat(parts[2])
    return matrix.rotateAxisAngleSelf(x, y, z, angle)
  }

  return matrix
}
