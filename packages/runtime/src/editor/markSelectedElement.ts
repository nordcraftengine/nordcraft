function clearSelectedElements() {
  document.querySelectorAll('[data-selected="true"]').forEach((el) => {
    el.removeAttribute('data-selected')
  })
  document.querySelectorAll('[data-repeat-selected="true"]').forEach((el) => {
    el.removeAttribute('data-repeat-selected')
  })
}

export function markSelectedElement(node: Element | null) {
  if (!node) {
    clearSelectedElements()
    return
  }

  if (!node.hasAttribute('data-selected')) {
    clearSelectedElements()

    node.setAttribute('data-selected', 'true')

    const dataId = node.getAttribute('data-id')
    if (dataId) {
      document.querySelectorAll(`[data-id^="${dataId}("]`).forEach((el) => {
        el.setAttribute('data-repeat-selected', 'true')
      })
    }
  }
}
