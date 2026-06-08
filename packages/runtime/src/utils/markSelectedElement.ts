export function markSelectedElement(node: Element | null) {
  if (node && !node.hasAttribute('data-selected')) {
    document.querySelectorAll('[data-selected="true"]').forEach((el) => {
      el.removeAttribute('data-selected')
    })
    document.querySelectorAll('[data-repeat-selected="true"]').forEach((el) => {
      el.removeAttribute('data-repeat-selected')
    })

    node.setAttribute('data-selected', 'true')

    const dataId = node.getAttribute('data-id')

    document.querySelectorAll(`[data-id^="${dataId}("]`).forEach((el) => {
      el.setAttribute('data-repeat-selected', 'true')
    })
  }
}
