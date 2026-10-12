import { isDefined } from '@nordcraft/core/dist/utils/util'
import { getDOMNodeFromNodeId } from '../dom'
import {
  isFlexDisplay,
  isPrimaryNodeElement,
  isVoidElement,
  nodeIndexFromId,
} from '../helpers'
import type { InsertArea } from '../types'

const GRID_JUSTIFY_CONTENT = ['flex-start', 'center', 'flex-end'] as const
const GRID_ALIGN_ITEMS = ['flex-start', 'center', 'flex-end'] as const
const EMPTY_GRID_MIN_SIZE = 60
const MIN_GRID_SIZE_PX = 58

function isBlockDisplay(display: string): boolean {
  return (
    display === 'block' || display === 'flow-root' || display === 'list-item'
  )
}

function emptyDropBounds(rect: {
  left: number
  top: number
  width: number
  height: number
}): { x: number; y: number; width: number; height: number } {
  const width = rect.width > 0 ? rect.width : EMPTY_GRID_MIN_SIZE
  const height = rect.height > 0 ? rect.height : EMPTY_GRID_MIN_SIZE
  return {
    width,
    height,
    x: rect.left + (rect.width - width) / 2,
    y: rect.top + (rect.height - height) / 2,
  }
}

function slotNameOf(
  element: Element,
  id: string | null | undefined,
): string | undefined {
  return (
    element.getAttribute('data-node-slot-name') ??
    id?.match(/\[([^\]]*)\]/)?.[1]
  )
}

/**
 * Create 9 insert areas (top-left, top-center, ..., bottom-right) covering an
 * empty element. Each area inserts at index 0 of the empty parent, but carries
 * the `justify-content` / `align-items` the parent should be given by the editor.
 * Callers only use this for visually large enough containers (see
 * `fitsGridCells`), so the rect is used as-is and cells never overflow it.
 */
function createEmptyGridAreas({
  parent,
  slot,
  rect,
  indexAll = 0,
  index = 0,
}: {
  parent: Element
  slot?: string
  rect: { left: number; top: number; width: number; height: number }
  indexAll?: number
  index?: number
}): Array<InsertArea> {
  const { width, height, left, top } = rect
  const cellWidth = width / 3
  const cellHeight = height / 3

  const areas: Array<InsertArea> = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const bounds = {
        x: left + col * cellWidth,
        y: top + row * cellHeight,
        width: cellWidth,
        height: cellHeight,
      }
      areas.push({
        layout: 'block',
        parent,
        indexAll,
        index,
        slot,
        center: {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        },
        size: Math.min(cellWidth, cellHeight),
        direction: 1,
        bounds,
        'justify-content': GRID_JUSTIFY_CONTENT[col],
        'align-items': GRID_ALIGN_ITEMS[row],
        'flex-direction': 'row',
      })
    }
  }
  return areas
}

/**
 * Same as `createEmptyGridAreas`, but returns a single area covering the entire empty element.
 * This is used for non-flex containers.
 */
function emptyDropArea({
  parent,
  slot,
  rect,
  indexAll = 0,
  index = 0,
}: {
  parent: Element
  slot?: string
  rect: { left: number; top: number; width: number; height: number }
  indexAll?: number
  index?: number
}): InsertArea {
  const { x, y, width, height } = emptyDropBounds(rect)
  const bounds = { x, y, width, height }
  return {
    layout: 'block',
    parent,
    indexAll,
    index,
    slot,
    center: {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    },
    size: Math.min(width, height),
    direction: 1,
    bounds,
  }
}

function fitsGridCells(rect: { width: number; height: number }): boolean {
  return rect.width >= MIN_GRID_SIZE_PX && rect.height >= MIN_GRID_SIZE_PX
}

/**
 * Elements further than this outside the viewport are skipped: with a snap
 * cap on drop targets (see `dragInsertMove`), far-offscreen lines can never
 * be selected, so building areas for them only costs layout time and keeps
 * the overlap pass quadratic in area count.
 */
export const INSERT_AREA_OVERSCAN_PX = 400

function isRectInOverscan(rect: {
  left: number
  top: number
  right: number
  bottom: number
}): boolean {
  const width = window.innerWidth || document.documentElement.clientWidth
  const height = window.innerHeight || document.documentElement.clientHeight
  return (
    rect.right >= -INSERT_AREA_OVERSCAN_PX &&
    rect.left <= width + INSERT_AREA_OVERSCAN_PX &&
    rect.bottom >= -INSERT_AREA_OVERSCAN_PX &&
    rect.top <= height + INSERT_AREA_OVERSCAN_PX
  )
}

/**
 * Somewhat convoluted function to calculate all possible drop insertion areas, as lines between elements.
 *
 * Drop locations follows the following rules:
 * - All lines for a single container are either horizontal or vertical (block or inline layout)
 * - If the next sibling of an element follows the expected layout (not wrapped) a single line is drawn between the two (taking gap/margin into consideration),
 * - If the next sibling is wrapped, a line is drawn both after and before the next element. Both lines inserts the dragged element at the same index.
 * - Empty flex elements large enough to aim at instead get 9 grid areas (3x3)
 *   covering the element. These count
 *   as insert positions and highlight the hovered cell rather than showing a line.
 *   Smaller or non-flex empty elements get a single drop area covering the
 *   container for the index-0 insertion.
 * - Flex elements with just one element child get drop lines on all four sides of
 *   that child (above/below with `flex-direction: column`, left/right with
 *   `flex-direction: row`). Non-flex parents fall through to the generic
 *   lines below, positioned where the element will actually be inserted.
 * - A slot outlet with placeholder content gets a single full drop-zone
 *   covering the placeholders (never the 3x3 grid). Slots without
 *   placeholder content keep the generic lines.
 */
export function getInsertAreas() {
  const insertAreas: Array<InsertArea> = []
  const displayCache = new Map<Element, string>()
  const displayOf = (element: Element): string => {
    const cached = displayCache.get(element)
    if (cached !== undefined) {
      return cached
    }
    const display = window.getComputedStyle(element).display
    displayCache.set(element, display)
    return display
  }

  const elementIds = Array.from(
    document.querySelectorAll(
      '[data-id]:is(:not([data-component]), [data-component][data-node-slot-name])',
    ),
  )
    .filter(
      (e) =>
        e.getAttribute('data-id')?.includes(')') === false &&
        e.parentElement?.closest('[data-component]') === null &&
        e.parentElement.closest(
          '[data-node-id="root"]:not([data-has-slots-elements]):not([data-is-root-component])',
        ) === null,
    )
    .map((e) => e.getAttribute('data-id'))
    .filter(isDefined)

  const elementApp = document.getElementById('App')
  if (!elementApp) {
    // eslint-disable-next-line no-console
    console.warn(`Element with id "App" not found`)
  } else if (elementApp.children.length === 0) {
    // This means we have an empty page or component. App (root) itself is always
    // flex but is not an editable target, so it always gets a single full-size area.
    const rect = elementApp.getBoundingClientRect()
    insertAreas.push(emptyDropArea({ parent: elementApp, rect }))
  }

  elementIds.forEach((id) => {
    const element = getDOMNodeFromNodeId(id, true, true)

    if (!element) {
      // eslint-disable-next-line no-console
      console.warn(`Element with path ${id} not found`)
      return
    }

    if (id === '0' && element.parentElement?.id === 'App') {
      // If the only element in a component/page is Text
      // we should not allow insert of another elements
      if (element.getAttribute('data-node-type') === 'text') {
        // eslint-disable-next-line no-console
        console.warn(`Is not possible to insert in a text element`)
        return
      }

      // We don't allow inserting another root element
      if (element.hasChildNodes()) {
        // eslint-disable-next-line no-console
        console.warn(`Is not possible to another root element`)
        return
      }
    }

    const rect = element.getBoundingClientRect()
    const parent = element.parentElement
    if (!parent) {
      return
    }

    if (!isRectInOverscan(rect)) {
      return
    }

    const defaultSlotContent = element.hasAttribute('data-node-slot-name')

    const slotName = slotNameOf(element, id)

    const isVoid = isVoidElement(element)

    if (!isVoid && !element.hasChildNodes() && !defaultSlotContent) {
      const elementDisplay = displayOf(element)
      if (isFlexDisplay(elementDisplay) && fitsGridCells(rect)) {
        insertAreas.push(
          ...createEmptyGridAreas({ parent: element, slot: slotName, rect }),
        )
      } else {
        insertAreas.push(
          emptyDropArea({ parent: element, slot: slotName, rect }),
        )
      }
    }

    const parentChildren = Array.from(parent.children)
    const siblingsAll = parentChildren.filter(isPrimaryNodeElement)

    const index = nodeIndexFromId(id)
    if (defaultSlotContent && index > 0) {
      return
    }

    const indexAll = siblingsAll.indexOf(element)

    if (defaultSlotContent && index === 0) {
      const slotAttr = element.getAttribute('data-node-slot-name')
      let left = Infinity
      let top = Infinity
      let right = -Infinity
      let bottom = -Infinity
      for (const child of parentChildren) {
        if (child.getAttribute('data-node-slot-name') !== slotAttr) {
          continue
        }
        const childRect = child.getBoundingClientRect()
        left = Math.min(left, childRect.left)
        top = Math.min(top, childRect.top)
        right = Math.max(right, childRect.right)
        bottom = Math.max(bottom, childRect.bottom)
      }
      insertAreas.push({
        ...emptyDropArea({
          parent,
          slot: slotName,
          rect: { left, top, width: right - left, height: bottom - top },
          indexAll,
          index,
        }),
        slotPlaceholder: true,
      })
      return
    }

    const prevElement = siblingsAll[indexAll - 1] as Element | undefined
    const prevId = prevElement?.getAttribute('data-id')
    const prevAfterCoversGap =
      prevElement !== undefined &&
      !(
        prevElement.hasAttribute('data-component') &&
        !prevElement.hasAttribute('data-node-slot-name')
      ) &&
      !(
        prevId === '0' &&
        prevElement.parentElement?.id === 'App' &&
        (prevElement.getAttribute('data-node-type') === 'text' ||
          prevElement.hasChildNodes())
      ) &&
      !(
        prevElement.hasAttribute('data-node-slot-name') &&
        nodeIndexFromId(prevId) === 0
      ) &&
      (slotNameOf(prevElement, prevId) ?? '') === (slotName ?? '')

    // A flex parent with just one element child gets drop lines on all four
    // sides of that child (above/below as `column`, left/right as `row`),
    // so the editor knows which `flex-direction` the parent should be given.
    // Non-flex parents fall through to the generic lines below, positioned
    // where the element will actually be inserted.
    // Repeat containers (extra `id(n)` siblings) keep the generic lines:
    // indices there address repeated instances, not plain sibling slots.
    const parentDisplay = displayOf(parent)
    const parentIsFlex = isFlexDisplay(parentDisplay)
    const hasRepeatChildren = parentChildren.some((child) =>
      child.getAttribute('data-id')?.endsWith(')'),
    )
    if (siblingsAll.length === 1 && !hasRepeatChildren && parentIsFlex) {
      type SingleChildLine = Pick<
        InsertArea,
        | 'layout'
        | 'center'
        | 'size'
        | 'direction'
        | 'indexAll'
        | 'index'
        | 'flex-direction'
      >
      const beforeLines: Array<SingleChildLine> = [
        {
          layout: 'block',
          center: { x: rect.left + rect.width / 2, y: rect.top },
          size: rect.width,
          direction: -1,
          indexAll,
          index,
          'flex-direction': 'column',
        },
        {
          layout: 'inline',
          center: { x: rect.left, y: rect.top + rect.height / 2 },
          size: rect.height,
          direction: -1,
          indexAll,
          index,
          'flex-direction': 'row',
        },
      ]
      // If it's the first element in the slot we don't want to show the line after the element
      const afterLines: Array<SingleChildLine> =
        !defaultSlotContent || index !== 0
          ? [
              {
                layout: 'block',
                center: { x: rect.left + rect.width / 2, y: rect.bottom },
                size: rect.width,
                direction: 1,
                indexAll: indexAll + 1,
                index: index + 1,
                'flex-direction': 'column',
              },
              {
                layout: 'inline',
                center: { x: rect.right, y: rect.top + rect.height / 2 },
                size: rect.height,
                direction: 1,
                indexAll: indexAll + 1,
                index: index + 1,
                'flex-direction': 'row',
              },
            ]
          : []
      for (const line of [...beforeLines, ...afterLines]) {
        insertAreas.push({ parent, slot: slotName, ...line })
      }
      return
    }

    const repeatPrefix = `${id}(`
    const repeatSiblings = parentChildren.filter((child) =>
      child.getAttribute('data-id')?.startsWith(repeatPrefix),
    )
    const lastRepeatElement = repeatSiblings.at(-1) ?? element
    const lastRect = lastRepeatElement.getBoundingClientRect()

    const nextSibling = siblingsAll[indexAll + 1] as Element | undefined
    const prevRepeatPrefix = prevId ? `${prevId}(` : ''
    const prevLastElement = prevRepeatPrefix
      ? (parentChildren
          .filter((c) =>
            c.getAttribute('data-id')?.startsWith(prevRepeatPrefix),
          )
          .at(-1) ?? prevElement)
      : prevElement
    const nextRect = nextSibling?.getBoundingClientRect()
    const prevRect = prevLastElement?.getBoundingClientRect()
    const childrenToInspect =
      siblingsAll.length > 1 ? siblingsAll : parentChildren
    const isBlockLayout =
      childrenToInspect.length > 1
        ? childrenToInspect
            .map((c) => c.getBoundingClientRect())
            .every(
              (r, i, rects) =>
                i === 0 ||
                r.width + r.height === 0 ||
                rects[i - 1].bottom <= r.top,
            )
        : isBlockDisplay(parentDisplay)
    if (isBlockLayout) {
      const showBeforeLine = prevRect
        ? prevRect.bottom <= rect.top && !prevAfterCoversGap
        : true
      if (showBeforeLine) {
        insertAreas.push({
          layout: 'block',
          parent,
          indexAll,
          index,
          slot: slotName,
          center: {
            x: rect.left + rect.width / 2,
            y: rect.top,
          },
          size: rect.width,
          direction: -1,
        })
      }

      if (!defaultSlotContent || index !== 0) {
        const afterCenter =
          nextRect && nextRect.top > lastRect.bottom
            ? {
                x: lastRect.left + lastRect.width / 2,
                y: (lastRect.bottom + nextRect.top) / 2,
              }
            : { x: lastRect.left + lastRect.width / 2, y: lastRect.bottom }
        insertAreas.push({
          layout: 'block',
          parent,
          indexAll: indexAll + 1,
          index: index + 1,
          slot: slotName,
          center: afterCenter,
          size: lastRect.width,
          direction: 1,
        })
      }
    } else {
      const showBeforeLine = prevRect
        ? prevRect.right <= rect.left && !prevAfterCoversGap
        : true
      if (showBeforeLine) {
        insertAreas.push({
          layout: 'inline',
          parent,
          indexAll,
          index,
          slot: slotName,
          center: {
            x: rect.left,
            y: rect.top + rect.height / 2,
          },
          size: rect.height,
          direction: -1,
        })
      }

      if (!defaultSlotContent || index !== 0) {
        const afterCenter =
          nextRect && nextRect.left > lastRect.right
            ? {
                x: (lastRect.right + nextRect.left) / 2,
                y: nextRect.top + nextRect.height / 2,
              }
            : { x: lastRect.right, y: lastRect.top + lastRect.height / 2 }
        insertAreas.push({
          layout: 'inline',
          parent,
          indexAll: indexAll + 1,
          index: index + 1,
          slot: slotName,
          center: afterCenter,
          size: lastRect.height,
          direction: 1,
        })
      }
    }
  })

  return offsetDropLines(dedupeOverlappingLines(insertAreas))
}

const SAME_SLOT_MERGE_PX = 8
/**
 * Deduplicates overlapping insert areas by merging lines that are close together
 * within the same slot and layout. Ensures that only one line remains for each
 * overlapping region, giving preference to flex-carrying lines over plain lines.
 */
export function dedupeOverlappingLines(insertAreas: Array<InsertArea>) {
  const result: Array<InsertArea> = []
  const edgeOf = (area: InsertArea): number =>
    area.layout === 'block' ? area.center.y : area.center.x
  const extentOf = (area: InsertArea): [number, number] =>
    area.layout === 'block'
      ? [area.center.x - area.size / 2, area.center.x + area.size / 2]
      : [area.center.y - area.size / 2, area.center.y + area.size / 2]

  for (const area of insertAreas) {
    if (area.bounds) {
      result.push(area)
      continue
    }
    const edge = edgeOf(area)
    const duplicateIndex = result.findIndex((kept) => {
      if (kept.bounds || kept.layout !== area.layout) {
        return false
      }
      if ((kept.slot ?? '') !== (area.slot ?? '')) {
        return false
      }
      if (kept.parent === area.parent && kept.index === area.index) {
        return Math.abs(edgeOf(kept) - edge) <= SAME_SLOT_MERGE_PX
      }
      if (kept.parent !== area.parent) {
        if (
          kept['flex-direction'] === undefined &&
          area['flex-direction'] === undefined
        ) {
          return false
        }
      }
      if (kept.slot !== undefined || area.slot !== undefined) {
        return false
      }
      if (Math.round(edgeOf(kept)) !== Math.round(edge)) {
        return false
      }
      const [start, end] = extentOf(area)
      const [keptStart, keptEnd] = extentOf(kept)
      return start <= keptEnd && keptStart <= end
    })
    if (duplicateIndex === -1) {
      result.push(area)
      continue
    }
    // A flex-carrying (single-child) level wins over the plain lines
    // stacked on the same edge; otherwise the first (midpoint) line wins.
    const duplicate = result[duplicateIndex]
    if (
      duplicate['flex-direction'] === undefined &&
      area['flex-direction'] !== undefined
    ) {
      result[duplicateIndex] = area
    }
  }
  return result
}

function offsetDropLines(insertAreas: Array<InsertArea>): Array<InsertArea> {
  return insertAreas.map((area) => {
    if (area.bounds) {
      return area
    }
    const edge = area.layout === 'block' ? area.center.y : area.center.x
    const matchingContainers = insertAreas.filter((other) => {
      if (
        other.bounds ||
        other.parent === area.parent ||
        other.layout !== area.layout
      ) {
        return false
      }
      const otherEdge =
        other.layout === 'block' ? other.center.y : other.center.x
      return (
        Math.abs(otherEdge - edge) <= 1 && other.parent.contains(area.parent)
      )
    })
    if (matchingContainers.length === 0) {
      return area
    }
    const offset = matchingContainers.length * 2
    const isBlock = area.layout === 'block'
    return {
      ...area,
      center: {
        x: isBlock ? area.center.x : area.center.x - offset * area.direction,
        y: isBlock ? area.center.y - offset * area.direction : area.center.y,
      },
    }
  })
}
