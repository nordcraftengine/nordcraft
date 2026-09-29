import {
  DATA_ATTR_ID,
  DATA_ATTR_REPEAT_SELECTED,
  DATA_ATTR_SELECTED,
  SELECTOR_REPEAT_SELECTED,
  SELECTOR_SELECTED,
} from './const'

function clearSelectedElements() {
  document.querySelectorAll(SELECTOR_SELECTED).forEach((el) => {
    el.removeAttribute(DATA_ATTR_SELECTED)
  })
  document.querySelectorAll(SELECTOR_REPEAT_SELECTED).forEach((el) => {
    el.removeAttribute(DATA_ATTR_REPEAT_SELECTED)
  })
}

export function markSelectedElement(node: Element | null) {
  if (!node) {
    clearSelectedElements()
    return
  }

  if (!node.hasAttribute(DATA_ATTR_SELECTED)) {
    clearSelectedElements()

    node.setAttribute(DATA_ATTR_SELECTED, 'true')

    const dataId = node.getAttribute(DATA_ATTR_ID)
    if (dataId) {
      document
        .querySelectorAll(`[${DATA_ATTR_ID}^="${dataId}("]`)
        .forEach((el) => {
          el.setAttribute(DATA_ATTR_REPEAT_SELECTED, 'true')
        })
    }
  }
}
