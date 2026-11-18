import { postMessageToEditor } from './postMessageToEditor'
import type { EditorMode } from './types'

const LINE_HEIGHT_PX = 16
const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay'])

type Axis = 'x' | 'y'

/** Normalize wheel deltas to pixels so the editor pans by a consistent amount */
const getPixelDelta = (event: WheelEvent) => {
  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return {
        deltaX: event.deltaX * LINE_HEIGHT_PX,
        deltaY: event.deltaY * LINE_HEIGHT_PX,
      }
    case WheelEvent.DOM_DELTA_PAGE:
      return {
        deltaX: event.deltaX * window.innerWidth,
        deltaY: event.deltaY * window.innerHeight,
      }
    default:
      return { deltaX: event.deltaX, deltaY: event.deltaY }
  }
}

/** Whether the browser will natively scroll `element` for this delta */
const canScrollOnAxis = ({
  element,
  axis,
  delta,
  isRoot,
}: {
  element: Element
  axis: Axis
  delta: number
  isRoot: boolean
}) => {
  if (delta === 0) {
    return false
  }
  const style = window.getComputedStyle(element)
  const overflow = axis === 'x' ? style.overflowX : style.overflowY
  const isScrollContainer = isRoot
    ? overflow !== 'hidden' && overflow !== 'clip'
    : SCROLLABLE_OVERFLOW.has(overflow)
  if (!isScrollContainer) {
    return false
  }
  const scrollSize =
    axis === 'x'
      ? element.scrollWidth - element.clientWidth
      : element.scrollHeight - element.clientHeight
  if (scrollSize <= 1) {
    return false
  }
  const overscroll =
    axis === 'x' ? style.overscrollBehaviorX : style.overscrollBehaviorY
  if (overscroll && overscroll !== 'auto') {
    // The element keeps the scroll to itself, even at its edges
    return true
  }
  const position = Math.abs(
    axis === 'x' ? element.scrollLeft : element.scrollTop,
  )
  const isRtl = axis === 'x' && style.direction === 'rtl'
  const towardsStart = isRtl ? delta > 0 : delta < 0
  return towardsStart ? position > 0 : position < scrollSize - 1
}

/** Whether a scroll area under the pointer (or the document) will consume the wheel */
const isScrollHandledByPage = (
  event: WheelEvent,
  deltaX: number,
  deltaY: number,
) => {
  const root = document.scrollingElement
  for (const target of event.composedPath()) {
    if (
      !(target instanceof Element) ||
      target === root ||
      target === document.body
    ) {
      continue
    }
    if (
      canScrollOnAxis({
        element: target,
        axis: 'y',
        delta: deltaY,
        isRoot: false,
      }) ||
      canScrollOnAxis({
        element: target,
        axis: 'x',
        delta: deltaX,
        isRoot: false,
      })
    ) {
      return true
    }
  }
  return root
    ? canScrollOnAxis({
        element: root,
        axis: 'y',
        delta: deltaY,
        isRoot: true,
      }) ||
        canScrollOnAxis({
          element: root,
          axis: 'x',
          delta: deltaX,
          isRoot: true,
        })
    : false
}

/**
 * In interactive (test) mode the canvas iframe receives all wheel events, so the
 * editor can't pan the canvas. Forward wheel events the page doesn't consume
 * itself, so the editor can pan/zoom the canvas instead.
 */
export const initWheelListeners = (getMode: () => EditorMode) => {
  document.addEventListener('wheel', (event) => {
    if (getMode() !== 'test' || event.defaultPrevented) {
      return
    }
    const { deltaX, deltaY } = getPixelDelta(event)
    const isZoom = event.ctrlKey || event.metaKey

    // If this isn't a zoom gesture AND the page can scroll,
    // let the browser handle it.
    if (!isZoom && isScrollHandledByPage(event, deltaX, deltaY)) {
      return
    }

    // Otherwise, let the editor handle it.
    event.preventDefault()

    postMessageToEditor({
      type: 'wheel',
      deltaX,
      deltaY,
      clientX: event.clientX,
      clientY: event.clientY,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    })
  })
}
