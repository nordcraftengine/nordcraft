export function getRectData(selectedNode: Element | null | undefined) {
  if (!selectedNode) {
    return null
  }

  const { borderRadius, rotate } = window.getComputedStyle(selectedNode)
  const rect: DOMRect = selectedNode.getBoundingClientRect()

  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
    borderRadius: borderRadius.split(' '),
    rotate,
  }
}
