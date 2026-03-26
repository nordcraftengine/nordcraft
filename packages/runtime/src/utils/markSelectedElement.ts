export function markSelectedElement(node: Element | null) {
  if (node && !node.hasAttribute('data-selected')) {
    document.querySelectorAll('[data-selected="true"]').forEach((el) => {
      el.removeAttribute('data-selected')
    })
    node.setAttribute('data-selected', 'true')
  }
}
