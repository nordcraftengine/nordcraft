import { getDOMNodeFromNodeId } from './dom'
import { postMessageToEditor } from './postMessageToEditor'
import type { AnimationState } from './timeline'

export const throttleToIdleCallback = (func: () => void) => {
  let scheduled = false
  return () => {
    if (!scheduled) {
      scheduled = true
      ;(globalThis.requestIdleCallback ?? globalThis.requestAnimationFrame)(
        () => {
          func()
          scheduled = false
        },
      )
    }
  }
}

export const getFormattedTime = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeStyle: 'long',
  }).format(new Date())

export const roundCssValue = (input: string): string =>
  input
    .split(' ')
    .map((value) => {
      const match = value.match(/^(-?\d+\.\d+)([a-z]*|%?)$/)
      if (!match) {
        return value
      }
      const number = match[1]
      const unit = match[2]
      const roundNumber = Number(Number(number).toFixed(2))
      return roundNumber.toString() + unit
    })
    .join(' ')

export const getElementComputedStyles = (
  element: Element,
  styles: string[],
): Record<string, string> => {
  const computedStyle = window.getComputedStyle(element)
  return Object.fromEntries(
    styles.map((style) => [
      style,
      roundCssValue(computedStyle.getPropertyValue(style)),
    ]),
  )
}

export const handleGetComputedStyle = (
  selectedNodeId: string | null,
  styles: string[] | undefined,
  animationState: AnimationState | null,
) => {
  const selectedNode = getDOMNodeFromNodeId(selectedNodeId)
  if (!selectedNode) {
    return
  }

  postMessageToEditor({
    type: 'computedStyle',
    computedStyle: getElementComputedStyles(selectedNode, styles ?? []),
    repeatedItemsValues: animationState?.repeatedElementsValues ?? [],
    timelineTime: animationState?.timelineTime ?? {
      delay: '0s',
      duration: '0s',
    },
  })
}

export const getBorderLengths = (
  style: CSSStyleDeclaration,
): [string, string, string, string] => [
  style.borderTopWidth || '0px',
  style.borderRightWidth || '0px',
  style.borderBottomWidth || '0px',
  style.borderLeftWidth || '0px',
]

export const getPaddingLengths = (
  style: CSSStyleDeclaration,
): [string, string, string, string] => [
  style.paddingTop || '0px',
  style.paddingRight || '0px',
  style.paddingBottom || '0px',
  style.paddingLeft || '0px',
]

export function getInlineRect(node: Element): DOMRect {
  try {
    const range = document.createRange()
    range.selectNodeContents(node)
    const rangeRect = range.getBoundingClientRect()
    if (rangeRect.width > 0 && rangeRect.height > 0) {
      return rangeRect
    }
  } catch {
    // fall through to getBoundingClientRect below
  }

  return node.getBoundingClientRect()
}

export function getTransformStyles(el: Element) {
  const computed = window.getComputedStyle(el)
  const inline = el instanceof HTMLElement ? el.style : undefined

  const get = (name: 'transform' | 'rotate' | 'scale' | 'translate'): string =>
    computed[name] || inline?.getPropertyValue(name) || 'none'

  return {
    transform: get('transform'),
    rotate: get('rotate'),
    scale: get('scale'),
    translate: get('translate'),
  }
}

/** `el` and its ancestors (innermost first), stopping before <html>. */
export function getChain(el: Element | null): Element[] {
  const chain: Element[] = []
  for (; el && el !== document.documentElement; el = el.parentElement) {
    chain.push(el)
  }
  return chain
}
