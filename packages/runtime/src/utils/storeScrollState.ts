interface ScrollPosition {
  x: number
  y: number
}

type ScrollPositionKey = '__window' | string

type ScrollPositions = Partial<Record<ScrollPositionKey, ScrollPosition>>

export const storeScrollState = (
  key: string = '',
  querySelector = '[data-id]',
  comparerFn = (node: Element) => node.getAttribute('data-id'),
) => {
  const scrollPositions: Record<string, ScrollPosition> = {}
  Array.from(document.querySelectorAll<HTMLElement>(querySelector)).forEach(
    (node) => {
      const nodeId = comparerFn(node)
      if (nodeId && (node.scrollTop || node.scrollLeft)) {
        scrollPositions[nodeId] = {
          y: node.scrollTop,
          x: node.scrollLeft,
        }
      }
    },
  )

  // Always store window scroll position as well
  scrollPositions['__window'] = {
    y: window.scrollY,
    x: window.scrollX,
  }

  sessionStorage.setItem(
    `scroll-position(${key})`,
    JSON.stringify(scrollPositions),
  )

  return getScrollStateRestorer(key)
}

export const getScrollStateRestorer =
  (key: string) => (selectorFn: (id: string) => HTMLElement | null) => {
    const { __window, ...rest } = JSON.parse(
      sessionStorage.getItem(`scroll-position(${key})`) ?? '{}',
    ) as Record<string, ScrollPosition> & {
      __window?: ScrollPosition
    }
    if (!__window) {
      return
    }

    Object.entries(rest).forEach(([nodeId, { y, x }]) => {
      const domNode = selectorFn(nodeId)
      if (!domNode) {
        return
      }

      if (y) {
        domNode.scrollTop = y
      }
      if (x) {
        domNode.scrollLeft = x
      }
    })

    window.scrollTo(__window.x, __window.y)
  }
