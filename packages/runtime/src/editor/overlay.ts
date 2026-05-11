export function getRectData(selectedNode: Element | null | undefined) {
  if (!selectedNode) {
    return null
  }

  const { borderRadius, rotate, padding, margin, gap } =
    window.getComputedStyle(selectedNode)
  let rect: DOMRect
  if (selectedNode.getAttribute('data-node-type') === 'text') {
    selectedNode.classList.add('__nc-text-node-measure')
    rect = selectedNode.getBoundingClientRect()
    selectedNode.classList.remove('__nc-text-node-measure')
  } else {
    rect = selectedNode.getBoundingClientRect()
  }

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
    padding: padding.split(' '),
    margin: margin.split(' '),
    gap: gap.split(' '),
  }
}
