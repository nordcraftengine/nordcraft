import { isElementInViewport } from '../../utils/isElementInViewport'
import {
  DRAG_INSERT_CLASSNAME,
  getBestPermutation,
  postHighlightMessage,
} from '../helpers'
import type { DragInsertState } from '../types'
import { removeDropHighlight, setDropHighlight } from './dropHighlight'

export const DRAG_REORDER_CLASSNAME = '__drag-mode--reorder'

const FLIP_DURATION_MS = 280
const FLIP_EASING_SPRING =
  'linear(0 0%, 0.0054 1.2376%, 0.0185 2.4752%, 0.0736 5.4455%, 0.5418 22.0297%, 0.6654 27.4752%, 0.7624 32.9208%, 0.8437 39.1089%, 0.9056 46.0396%, 0.929 49.7525%, 0.9492 53.9604%, 0.965 58.4158%, 0.9773 63.3663%, 0.9875 69.802%, 0.9945 77.7228%, 0.9982 87.1287%, 0.9999 100%)'
const FLIP_EASING_FALLBACK = 'ease-out'

/**
 * Stops any in-flight reorder glide. Cancelled animations snap to the
 * underlying (already final) layout, so the next FLIP step — or the drop —
 * always starts from settled positions.
 */
export function cancelReorderFlip(
  dragState: Pick<DragInsertState, 'flipAnimations'> | null | undefined,
) {
  const animations = dragState?.flipAnimations
  if (!animations || animations.length === 0) {
    return
  }
  dragState.flipAnimations = []
  for (const animation of animations) {
    try {
      animation.cancel()
    } catch {
      // Already finished/aborted — nothing to stop
    }
  }
}

function playFlipAnimation(
  element: HTMLElement,
  dx: number,
  dy: number,
): Animation | null {
  if (
    typeof element.animate !== 'function' ||
    (dx === 0 && dy === 0) ||
    Number.isNaN(dx) ||
    Number.isNaN(dy)
  ) {
    return null
  }
  const keyframes: Keyframe[] = [
    { transform: `translate(${dx}px, ${dy}px)` },
    { transform: 'translate(0, 0)' },
  ]
  // `composite: add` preserves any base CSS transform on the element.
  const options: KeyframeAnimationOptions = {
    duration: FLIP_DURATION_MS,
    easing: FLIP_EASING_SPRING,
    composite: 'add',
  }
  try {
    return element.animate(keyframes, options)
  } catch {
    try {
      return element.animate(keyframes, {
        ...options,
        easing: FLIP_EASING_FALLBACK,
      })
    } catch {
      return null
    }
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function dragReorder(dragState: DragInsertState | null) {
  if (!dragState) {
    return
  }

  if (dragState.mode === 'insert') {
    dragState.mode = 'reorder'
    removeDropHighlight()

    const prevRect = dragState.element.getBoundingClientRect()
    dragState.element.classList.add(DRAG_REORDER_CLASSNAME)
    dragState.element.classList.remove(DRAG_INSERT_CLASSNAME)
    dragState.initialContainer.insertBefore(
      dragState.element,
      dragState.initialNextSibling,
    )
    dragState.repeatedNodes.forEach((node, i) => {
      node.style.setProperty('--drag-repeat-node-opacity', i < 3 ? '1' : '0')
    })
    const nextRect = dragState.element.getBoundingClientRect()
    dragState.offset.x += nextRect.left - prevRect.left
    dragState.offset.y += nextRect.top - prevRect.top
    postHighlightMessage(dragState.initialContainer)
    setDropHighlight(
      dragState.element,
      dragState.initialContainer,
      dragState.elementType === 'component' ? 'D946EF' : '2563EB',
    )
  }

  const bestPermutation = getBestPermutation(
    dragState.lastCursorPosition,
    dragState.reorderPermutations,
  )
  if (
    !bestPermutation ||
    dragState.element.nextElementSibling === bestPermutation.nextSibling
  ) {
    return
  }

  const container = dragState.initialContainer
  const element = dragState.element
  const reduceMotion = prefersReducedMotion()

  const first = new Map<HTMLElement, DOMRect>()
  if (!reduceMotion) {
    for (const child of Array.from(container.children)) {
      if (
        child instanceof HTMLElement &&
        child !== element &&
        !dragState.repeatedNodes.includes(child) &&
        isElementInViewport(child)
      ) {
        first.set(child, child.getBoundingClientRect())
      }
    }
  }
  cancelReorderFlip(dragState)

  const prevLeft = element.offsetLeft
  const prevTop = element.offsetTop
  container.insertBefore(element, bestPermutation.nextSibling)
  dragState.offset.x += element.offsetLeft - prevLeft
  dragState.offset.y += element.offsetTop - prevTop
  element.style.setProperty(
    'translate',
    `${dragState.lastCursorPosition.x - dragState.offset.x}px ${
      dragState.lastCursorPosition.y - dragState.offset.y
    }px`,
  )
  setDropHighlight(
    element,
    container,
    dragState.elementType === 'component' ? 'D946EF' : '2563EB',
  )

  if (!reduceMotion) {
    const animations: Animation[] = []
    first.forEach((from, child) => {
      if (!child.isConnected) {
        return
      }
      const to = child.getBoundingClientRect()
      const animation = playFlipAnimation(
        child,
        from.left - to.left,
        from.top - to.top,
      )
      if (animation) {
        animations.push(animation)
      }
    })
    dragState.flipAnimations = animations
  }
}
