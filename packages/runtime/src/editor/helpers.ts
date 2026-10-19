import { isElementInViewport } from '../utils/isElementInViewport'
import { tryStartViewTransition } from '../utils/tryStartViewTransition'
import { getRepeatNodeIndex, stripNodeIdRepeatIndices } from './dom'
import {
  cancelReorderFlip,
  DRAG_REORDER_CLASSNAME,
} from './drag-drop/dragReorder'
import {
  removeDropHighlight,
  setDropHighlight,
  setExternalDropHighlight,
  setHighlightBlink,
} from './drag-drop/dropHighlight'
import { getInsertAreas, slotOwnsPlaceholder } from './drag-drop/getInsertAreas'
import { findNearestLine } from './findNearestLine'
import type { DragInsertState, InsertArea, Point } from './types'

const OVERLAP_OFFSET_PX = 100
export const MAX_SNAP_DISTANCE_PX = 80
export const GRID_RIM_PX = 8
export const DRAG_INSERT_CLASSNAME = '__drag-mode--move'

const voidElements = new Set([
  'AREA',
  'BASE',
  'BR',
  'COL',
  'EMBED',
  'HR',
  'IMG',
  'INPUT',
  'LINK',
  'META',
  'PARAM',
  'SOURCE',
  'TRACK',
  'WBR',
])

export function isVoidElement(element: Element) {
  return voidElements.has(element.tagName)
}

/**
 * Computed `display` values that use flex layout.
 */
export function isFlexDisplay(display: string): boolean {
  return display === 'flex' || display === 'inline-flex'
}

export function nodeIndexFromId(id: string | null | undefined): number {
  if (!id) {
    return NaN
  }
  const clean = id
    .split('.')
    .at(-1)
    ?.replace(/\[[^\]]*\]|\{[^}]*\}|\([^)]*\)/g, '')
  return clean ? Number(clean) : NaN
}

export function isPrimaryNodeElement(element: Element): boolean {
  const dataId = element.getAttribute('data-id')
  const nodeId = element.getAttribute('data-node-id')
  return Boolean(nodeId && !dataId?.endsWith(')'))
}

export function getPrimaryChildElements(parent: Element): HTMLElement[] {
  return Array.from(parent.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && isPrimaryNodeElement(child),
  )
}

export function cancelHoverInsert(
  dragState: Pick<DragInsertState, 'hover'> | null | undefined,
) {
  const hover = dragState?.hover
  if (!hover) {
    return
  }
  dragState.hover = undefined
  if (hover.timeout !== undefined) {
    clearTimeout(hover.timeout)
  }
  if (hover.interval !== undefined) {
    clearInterval(hover.interval)
  }
  setHighlightBlink(false, false)
}

export function postHighlightMessage(parent: Element) {
  const nodeId = parent.getAttribute('data-id')
  window.parent.postMessage(
    {
      type: 'highlight',
      highlightedNodeId: stripNodeIdRepeatIndices(nodeId),
      exactHighlightedNodeId: nodeId,
      repeatNodeIndex: getRepeatNodeIndex(nodeId, parent),
    },
    '*',
  )
}

export function centerGhostOnCursor(
  dragState: Pick<DragInsertState, 'element' | 'offset' | 'lastCursorPosition'>,
): void {
  const { element, offset, lastCursorPosition } = dragState
  element.style.removeProperty('translate')
  const box = element.getBoundingClientRect()
  offset.x = box.left + box.width / 2
  offset.y = box.top + box.height / 2
  element.style.setProperty(
    'translate',
    `${lastCursorPosition.x - offset.x}px ${lastCursorPosition.y - offset.y}px`,
  )
}

export function getBestPermutation(
  cursor: Point,
  reorderPermutations: Array<{
    nextSibling: Node | null
    rect: DOMRect
  }>,
) {
  let best: { nextSibling: Node | null; rect: DOMRect } | null = null
  let minDist = Infinity

  for (const curr of reorderPermutations) {
    const dx = curr.rect.left + curr.rect.width / 2 - cursor.x
    const dy = curr.rect.top + curr.rect.height / 2 - cursor.y
    if (
      Math.abs(dx) < curr.rect.width / 2 + OVERLAP_OFFSET_PX &&
      Math.abs(dy) < curr.rect.height / 2 + OVERLAP_OFFSET_PX
    ) {
      const dist = Math.hypot(dx, dy)
      if (dist <= minDist) {
        minDist = dist
        best = curr
      }
    }
  }

  return best
}

/**
 * Measures how the dragged element would lay out before each sibling of a
 * container. A hidden probe clone is moved through the slots instead of the
 * dragged element itself, so the real node (focus, observers, translate
 * state) is never disturbed; the dragged element is hidden meanwhile to
 * keep the item count identical. The sibling list is snapshotted first
 * since probing mutates the DOM.
 */
export function measureReorderPermutations(
  container: HTMLElement,
  element: HTMLElement,
  repeatedNodes: HTMLElement[],
): Array<{ nextSibling: Node | null; rect: DOMRect }> {
  const permutations: Array<{ nextSibling: Node | null; rect: DOMRect }> = []
  const probe = element.cloneNode(true) as HTMLElement
  probe.removeAttribute('id')
  probe.style.setProperty('visibility', 'hidden')
  probe.style.setProperty('pointer-events', 'none')
  probe.style.removeProperty('translate')
  const prevDisplay = element.style.getPropertyValue('display')
  element.style.setProperty('display', 'none')
  try {
    const siblingsSnapshot = Array.from(container.childNodes)
    for (const sibling of siblingsSnapshot) {
      if (
        sibling instanceof Element &&
        sibling.getAttribute('data-id') &&
        // Only first item of repeated nodes should be considered
        !sibling.getAttribute('data-id')?.endsWith(')') &&
        !sibling.hasAttribute('data-component') &&
        repeatedNodes.every((node) => node !== sibling)
      ) {
        container.insertBefore(probe, sibling)
        permutations.push({
          nextSibling: sibling,
          rect: probe.getBoundingClientRect(),
        })
      }
    }
    // Test the last position
    if (!container.hasAttribute('data-component')) {
      container.appendChild(probe)
      permutations.push({
        nextSibling: null,
        rect: probe.getBoundingClientRect(),
      })
    }
  } finally {
    probe.remove()
    if (prevDisplay) {
      element.style.setProperty('display', prevDisplay)
    } else {
      element.style.removeProperty('display')
    }
  }
  return permutations
}

export function dragInsertStarted({
  action,
  element,
  lastCursorPosition,
  repeatedNodes,
  asCopy,
  initialContainer = action === 'drag'
    ? (element.parentElement as HTMLElement)
    : (element as HTMLElement),
  initialNextSibling,
  trueOrigin,
}: {
  action: 'drag' | 'insert'
  element: HTMLElement
  lastCursorPosition: Point
  repeatedNodes: HTMLElement[]
  asCopy: boolean
  initialContainer?: HTMLElement
  initialNextSibling?: Element | null
  trueOrigin?: DragInsertState['trueOrigin']
}) {
  // Move repeat nodes as a stack below the dragged element.
  const repeatPositions = repeatedNodes.map((node, i) => {
    const rect = node.getBoundingClientRect()
    node.classList.add('drag-repeat-node')
    node.style.setProperty('--drag-repeat-node-width', `${rect.width}px`)
    node.style.setProperty('--drag-repeat-node-height', `${rect.height}px`)
    node.style.setProperty(
      '--drag-repeat-node-translate',
      `${rect.left}px ${rect.top}px`,
    )
    node.style.setProperty(
      '--drag-repeat-node-rotate',
      `${((i * 4.7) % 9) - 4.5}deg`,
    )
    node.style.setProperty('--drag-repeat-node-opacity', i < 3 ? '1' : '0')
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
  })

  initialNextSibling ??= element.nextElementSibling

  const dragInsertState: DragInsertState = {
    destroying: false,
    action,
    elementType:
      elementIsComponent(element) && action === 'drag'
        ? 'component'
        : 'element',
    element,
    // Own copy: the ghost offset is mutated in place all through the drag
    // and must never alias (and corrupt) the cursor position.
    offset: { ...lastCursorPosition },
    lastCursorPosition,
    initialContainer,
    initialNextSibling,
    trueOrigin,
    initialRect:
      action === 'drag'
        ? element.getBoundingClientRect()
        : initialContainer.getBoundingClientRect(),
    reorderPermutations: [],
    flipAnimations: [],
    isSoleChildDrag: false,
    repeatedNodes,
    mode: action === 'drag' ? 'reorder' : 'insert',
  }

  if (action === 'drag') {
    if (asCopy) {
      dragInsertState.copy = element.cloneNode(true) as HTMLElement
      dragInsertState.copy.style.setProperty('opacity', '0.5')
      dragInsertState.copy.classList.remove(DRAG_REORDER_CLASSNAME)
      dragInsertState.copy.classList.remove(DRAG_INSERT_CLASSNAME)
      const copyContainer =
        trueOrigin?.container ?? dragInsertState.initialContainer
      const copyNextSibling = trueOrigin
        ? trueOrigin.nextSibling
        : dragInsertState.initialNextSibling
      copyContainer.insertBefore(dragInsertState.copy, copyNextSibling)
    }

    dragInsertState.reorderPermutations = measureReorderPermutations(
      dragInsertState.initialContainer,
      element,
      repeatedNodes,
    )

    const homeChildren = Array.from(
      dragInsertState.initialContainer.children,
    ).filter((child) => child.hasAttribute('data-node-id'))
    const elementHome =
      dragInsertState.element.parentElement === dragInsertState.initialContainer
    dragInsertState.isSoleChildDrag =
      homeChildren.length + (elementHome ? 0 : 1) === 1
  }
  ;(function followRepeatedNodes() {
    if (dragInsertState.destroying || !dragInsertState.element.isConnected) {
      return
    }

    const followRect = dragInsertState.element.getBoundingClientRect()
    const interpolation = 0.4
    dragInsertState.repeatedNodes.forEach((node, i) => {
      const cached = repeatPositions[i] as
        (typeof repeatPositions)[number] | undefined
      if (!cached) {
        return
      }
      const toX = followRect.left + followRect.width / 2 - cached.width / 2
      const toY = followRect.top + followRect.height / 2 - cached.height / 2
      cached.x += (toX - cached.x) * interpolation
      cached.y += (toY - cached.y) * interpolation
      node.style.setProperty(
        '--drag-repeat-node-translate',
        `${cached.x}px ${cached.y}px`,
      )
    })

    requestAnimationFrame(followRepeatedNodes)
  })()

  if (action === 'drag') {
    // Highlight container
    element.classList.add(DRAG_REORDER_CLASSNAME)
    postHighlightMessage(dragInsertState.initialContainer)

    setDropHighlight(
      dragInsertState.element,
      dragInsertState.initialContainer,
      dragInsertState.elementType === 'component' ? 'D946EF' : '2563EB',
    )
  }

  return dragInsertState
}

export async function dragInsertEnded(
  dragInsertState: DragInsertState,
  canceled: boolean,
  options?: {
    /**
     * Snap back synchronously without a view transition. Used when the drag
     * immediately restarts (ALT duplicate toggle) so pressing/releasing ALT
     * takes effect at once instead of playing — and awaiting — the 0.4s
     * drop animation.
     */
    instant?: boolean
  },
) {
  dragInsertState.destroying = true
  cancelHoverInsert(dragInsertState)
  // Settle any in-flight reorder glide first so measurements and the drop
  // transition start from final positions.
  cancelReorderFlip(dragInsertState)
  const selectedInsertArea =
    dragInsertState.insertAreas?.[dragInsertState.selectedInsertAreaIndex ?? -1]
  // A hover-insert re-homes mid-drag without committing: cancelling still
  // falls back to the original position.
  const fallbackHome = canceled ? dragInsertState.trueOrigin : undefined
  const homeContainer =
    fallbackHome?.container ?? dragInsertState.initialContainer
  const homeNextSibling = fallbackHome
    ? fallbackHome.nextSibling
    : dragInsertState.initialNextSibling

  const restoreDom = () => {
    if (canceled) {
      dragInsertState.copy?.remove()
      if (dragInsertState.action === 'insert') {
        dragInsertState.element.remove()
      } else {
        homeContainer.insertBefore(dragInsertState.element, homeNextSibling)
      }
      if (dragInsertState.hoverPlacement) {
        const hoverParent = dragInsertState.hoverPlacement.parent
        if (
          hoverParent instanceof HTMLElement &&
          hoverParent !== homeContainer
        ) {
          for (const prop of Object.keys(
            dragInsertState.hoverPlacement.styleProps,
          )) {
            hoverParent.style.removeProperty(prop)
          }
        }
      }
    } else if (dragInsertState.mode === 'insert') {
      const targetSiblings = selectedInsertArea
        ? getPrimaryChildElements(selectedInsertArea.parent)
        : []
      if (selectedInsertArea) {
        applyDropParentStyles(selectedInsertArea.parent, selectedInsertArea)
        const placeholderChildren = selectedInsertArea.slotPlaceholder
          ? Array.from(selectedInsertArea.parent.children).filter((child) =>
              slotOwnsPlaceholder(child, selectedInsertArea.slot),
            )
          : []
        const insertBeforeNode =
          placeholderChildren.length > 0
            ? placeholderChildren[0]
            : (targetSiblings.at(selectedInsertArea.indexAll) ?? null)
        selectedInsertArea.parent.insertBefore(
          dragInsertState.element,
          insertBeforeNode,
        )
        for (const placeholder of placeholderChildren) {
          placeholder.remove()
        }
      }
    }

    dragInsertState.element.classList.remove(DRAG_REORDER_CLASSNAME)
    dragInsertState.element.classList.remove(DRAG_INSERT_CLASSNAME)
    dragInsertState.element.style.removeProperty('translate')
    dragInsertState.repeatedNodes.toReversed().forEach((node) => {
      dragInsertState.element.insertAdjacentElement('afterend', node)
      node.classList.remove('drag-repeat-node')
      for (const prop of [
        'rotate',
        '--drag-repeat-node-width',
        '--drag-repeat-node-height',
        '--drag-repeat-node-translate',
        '--drag-repeat-node-rotate',
        '--drag-repeat-node-opacity',
      ]) {
        node.style.removeProperty(prop)
      }
    })
    removeDropHighlight()
  }

  if (options?.instant) {
    restoreDom()
    return
  }

  const siblings =
    (dragInsertState.mode === 'insert' && !canceled
      ? selectedInsertArea?.parent
      : homeContainer
    )?.querySelectorAll('[data-id]') ?? []
  if (dragInsertState.action === 'insert' && !canceled) {
    centerGhostOnCursor(dragInsertState)
    dragInsertState.element.style.removeProperty('--drag-mode--move-opacity')
  }
  dragInsertState.element.style.setProperty(
    'view-transition-name',
    'dropped-item-self',
  )
  siblings.forEach((node, i) => {
    if (node instanceof HTMLElement && isElementInViewport(node)) {
      node.style.setProperty(
        'view-transition-name',
        'dropped-item-sibling-' + i,
      )
    }
  })
  dragInsertState.repeatedNodes
    .filter(isElementInViewport)
    .forEach((node, i) => {
      node.style.setProperty(
        'view-transition-name',
        'dropped-item-repeated-' + i,
      )
    })

  const style = document.createElement('style')
  style.appendChild(
    document.createTextNode(`
      ::view-transition-group(*),
      ::view-transition-old(*),
      ::view-transition-new(*) {
        animation-timing-function: linear(0 0%, 0.005 0.9404%, 0.0202 2.0376%, 0.0775 4.3887%, 0.5344 17.0846%, 0.6528 21.1599%, 0.7502 25.3918%, 0.8332 30.2508%, 0.8943 35.4232%, 0.9185 38.2445%, 0.9385 41.2226%, 0.9554 44.5141%, 0.9689 48.1191%, 0.9825 53.605%, 0.9876 56.7398%, 0.9913 59.8746%, 0.9944 63.6364%, 0.9966 67.7116%, 0.9992 78.6834%, 1 100% /*{"type":"spring","stiffness":50,"damping":30,"mass":5}*/) !important;
        animation-duration: 0.4s !important;
      }
    `),
  )
  document.head.appendChild(style)

  await tryStartViewTransition(restoreDom).finished

  style.remove()
  dragInsertState.element.style.removeProperty('view-transition-name')
  siblings.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.style.removeProperty('view-transition-name')
    }
  })
}

export function dragInsertMove(
  action: 'drag' | 'insert',
  dragInsertState: DragInsertState | null,
  exclude: HTMLElement[],
) {
  if (!dragInsertState) {
    return
  }

  if (dragInsertState.mode === 'reorder' || !dragInsertState.insertAreas) {
    cancelReorderFlip(dragInsertState)
    dragInsertState.mode = 'insert'
    const translate =
      dragInsertState.element.style.getPropertyValue('translate')
    dragInsertState.element.style.setProperty('translate', '0')
    const rect = dragInsertState.element.getBoundingClientRect()
    dragInsertState.element.style.setProperty('display', 'none')
    document.body.appendChild(dragInsertState.element)
    dragInsertState.insertAreas ??= getInsertAreas().filter(
      (x) =>
        exclude.every((e) => !e.contains(x.parent) && e !== x.parent) &&
        x.parent !== document.body,
    )
    dragInsertState.element.style.removeProperty('display')
    dragInsertState.element.classList.add(DRAG_INSERT_CLASSNAME)
    dragInsertState.element.classList.remove(DRAG_REORDER_CLASSNAME)
    if (action === 'insert') {
      dragInsertState.element.style.setProperty('--drag-mode--move-left', '0px')
      dragInsertState.element.style.setProperty('--drag-mode--move-top', '0px')
      dragInsertState.element.style.setProperty(
        '--drag-mode--move-opacity',
        '0',
      )
    } else if (
      !dragInsertState.element.style.getPropertyValue('--drag-mode--move-left')
    ) {
      dragInsertState.element.style.setProperty(
        '--drag-mode--move-left',
        `${rect.left}px`,
      )
      dragInsertState.element.style.setProperty(
        '--drag-mode--move-top',
        `${rect.top}px`,
      )
      dragInsertState.element.style.setProperty(
        '--drag-mode--move-width',
        `${dragInsertState.initialRect.width}px`,
      )
      dragInsertState.element.style.setProperty(
        '--drag-mode--move-opacity',
        '0.4',
      )
    }
    dragInsertState.element.style.setProperty('translate', translate)
  }
  dragInsertState.repeatedNodes.forEach((node, i) => {
    node.style.setProperty('--drag-repeat-node-opacity', i < 3 ? '0.2' : '0')
  })

  const allAreas = dragInsertState.insertAreas ?? []
  const cursor = dragInsertState.lastCursorPosition
  const gridUnions = new Map<
    Element,
    { left: number; top: number; right: number; bottom: number }
  >()
  for (const area of allAreas) {
    const bounds = area.bounds
    if (!bounds) {
      continue
    }
    const union = gridUnions.get(area.parent) ?? {
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity,
    }
    union.left = Math.min(union.left, bounds.x)
    union.top = Math.min(union.top, bounds.y)
    union.right = Math.max(union.right, bounds.x + bounds.width)
    union.bottom = Math.max(union.bottom, bounds.y + bounds.height)
    gridUnions.set(area.parent, union)
  }
  const containingGridAreas = allAreas.filter((area) => {
    if (!area.bounds) {
      return false
    }
    if (
      cursor.x < area.bounds.x ||
      cursor.x > area.bounds.x + area.bounds.width ||
      cursor.y < area.bounds.y ||
      cursor.y > area.bounds.y + area.bounds.height
    ) {
      return false
    }
    // Near the empty element's outer rim the cursor targets the surrounding
    // lines instead, keeping e.g. "drop after the empty element" reachable.
    if (action !== 'insert') {
      const union = gridUnions.get(area.parent)
      const rim = union
        ? Math.min(
            GRID_RIM_PX,
            (union.right - union.left) / 4,
            (union.bottom - union.top) / 4,
          )
        : 0
      if (
        union &&
        rim > 0 &&
        (cursor.x - union.left < rim ||
          union.right - cursor.x < rim ||
          cursor.y - union.top < rim ||
          union.bottom - cursor.y < rim)
      ) {
        return false
      }
    }
    return true
  })
  if (containingGridAreas.length > 0) {
    // Prefer the smallest (innermost) area when empty elements are nested
    const selected = containingGridAreas.reduce((prev, curr) =>
      prev.bounds!.width * prev.bounds!.height <=
      curr.bounds!.width * curr.bounds!.height
        ? prev
        : curr,
    )
    dragInsertState.selectedInsertAreaIndex = allAreas.indexOf(selected)

    postHighlightMessage(selected.parent)
    // Same-name slot outlets each render their own overlay, but all of them
    // light up together. The drop itself still uses only `selected`.
    const owningSlotsRootOf = (descendant: Element): Element | null =>
      descendant.closest('[data-has-slots-elements]')
    const selectedOwner = owningSlotsRootOf(selected.parent)
    const peerZones =
      selected.bounds !== undefined &&
      selected.slotPlaceholder === true &&
      selected.slot !== undefined
        ? allAreas.filter(
            (area) =>
              area.bounds !== undefined &&
              area.slotPlaceholder === true &&
              area.slot !== undefined &&
              area.slot === selected.slot &&
              (selectedOwner
                ? owningSlotsRootOf(area.parent) === selectedOwner
                : area.parent === selected.parent),
          )
        : [selected]
    setExternalDropHighlight({
      insertAreas: peerZones.length > 0 ? peerZones : [selected],
      color: dragInsertState.elementType === 'component' ? 'D946EF' : '2563EB',
      projectionPoint: 0.5,
    })
    return
  }

  const lineAreas = allAreas.filter((area) => !area.bounds)
  const lines = lineAreas.map((line) => {
    // Hit-test at the exact center so the selected line matches the
    // rendered line pixel-for-pixel.
    const at = line.center
    const half = line.size / 2
    const horizontal = line.layout === 'block'
    return {
      x1: horizontal ? at.x - half : at.x,
      y1: horizontal ? at.y : at.y - half,
      x2: horizontal ? at.x + half : at.x,
      y2: horizontal ? at.y : at.y + half,
    }
  })
  const { nearestLine, dist, projectionPoint } = findNearestLine(
    lines,
    dragInsertState.lastCursorPosition,
  )

  if (!nearestLine || dist > MAX_SNAP_DISTANCE_PX) {
    dragInsertState.selectedInsertAreaIndex = undefined
    removeDropHighlight()
    return
  }

  const selected = lineAreas.at(lines.indexOf(nearestLine))

  if (selected) {
    dragInsertState.selectedInsertAreaIndex = allAreas.indexOf(selected)

    postHighlightMessage(selected.parent)
    setExternalDropHighlight({
      insertAreas: [selected],
      color: dragInsertState.elementType === 'component' ? 'D946EF' : '2563EB',
      projectionPoint,
    })
  } else {
    dragInsertState.selectedInsertAreaIndex = undefined
    removeDropHighlight()
  }
}

export function dropStyleProps(area: InsertArea): {
  'justify-content'?: string
  'align-items'?: string
  'flex-direction'?: 'row' | 'column'
} {
  const props: {
    'justify-content'?: string
    'align-items'?: string
    'flex-direction'?: 'row' | 'column'
  } = {}
  if (area['justify-content'] !== undefined) {
    props['justify-content'] = area['justify-content']
  }
  if (area['align-items'] !== undefined) {
    props['align-items'] = area['align-items']
  }
  if (area['flex-direction'] !== undefined) {
    props['flex-direction'] = area['flex-direction']
    if (
      area['justify-content'] === undefined &&
      area['align-items'] === undefined
    ) {
      Object.assign(
        props,
        swappedParentAlignment(area.parent, area['flex-direction']),
      )
    }
  }
  return props
}

export function dropStylePropsOf(area: InsertArea | undefined) {
  return area ? dropStyleProps(area) : {}
}

function flexDirectionAxis(direction: string): 'horizontal' | 'vertical' {
  return direction === 'column' || direction === 'column-reverse'
    ? 'vertical'
    : 'horizontal'
}

function isMeaningfulAlignment(value: string): boolean {
  return value !== '' && value !== 'normal'
}

/**
 * The parent's current alignment with `justify-content`/`align-items`
 * swapped — but only when the new `flex-direction` switches the flex axis
 * of an already-flex parent. Otherwise (same axis, non-flex parent, no
 * meaningful values to preserve) an empty object is returned.
 */
function swappedParentAlignment(
  parent: Element,
  flexDirection: 'row' | 'column',
): {
  'justify-content'?: string
  'align-items'?: string
} {
  const computed = window.getComputedStyle(parent)
  if (!isFlexDisplay(computed.display)) {
    return {}
  }
  const currentDirection = computed.getPropertyValue('flex-direction') || 'row'
  if (
    flexDirectionAxis(currentDirection) === flexDirectionAxis(flexDirection)
  ) {
    return {}
  }
  const currentJustify = computed.getPropertyValue('justify-content')
  const currentAlign = computed.getPropertyValue('align-items')
  const swapped: {
    'justify-content'?: string
    'align-items'?: string
  } = {}
  if (isMeaningfulAlignment(currentAlign)) {
    swapped['justify-content'] = currentAlign
  }
  if (isMeaningfulAlignment(currentJustify)) {
    swapped['align-items'] = currentJustify
  }
  return swapped
}

export function applyDropParentStyles(parent: Element, area: InsertArea) {
  if (!(parent instanceof HTMLElement)) {
    return
  }
  const props = dropStyleProps(area)
  if (Object.keys(props).length === 0) {
    return
  }
  const display = window.getComputedStyle(parent).display
  if (
    !isFlexDisplay(display) &&
    display !== 'grid' &&
    display !== 'inline-grid'
  ) {
    parent.style.setProperty('display', 'flex')
  }
  for (const [prop, value] of Object.entries(props)) {
    parent.style.setProperty(prop, value)
  }
}

function elementIsComponent(element: Element) {
  return (
    element.getAttribute('data-node-id') === 'root' &&
    element.getAttribute('data-id') !== '0'
  )
}
