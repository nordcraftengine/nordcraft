import { getDOMNodeFromNodeId } from '../../editor-preview.main'
import { isVoidElement } from '../helpers'
import type { InsertArea } from '../types'

/**
 * Somewhat convoluted function to calculate all possible drop insertion areas, as lines between elements.
 *
 * Drop locations follows the following rules:
 * - All lines for a single container are either horizontal or vertical (block or inline layout)
 * - If the next sibling of an element follows the expected layout (not wrapped) a line is drawn between the two (taking gap/margin into consideration),
 * - If the next sibling is wrapped, a line is drawn both after and before the next element. Both lines inserts the dragged element at the same index.
 */
export function getInsertAreas() {
  const insertAreas: Array<InsertArea> = []
  Array.from(document.querySelectorAll('[data-id]:not([data-component])'))
    .filter((e) => e.getAttribute('data-id')?.includes(')') === false)
    .map((e) => e.getAttribute('data-id'))
    .forEach((id) => {
      const element = getDOMNodeFromNodeId(id)
      if (!element) {
        // eslint-disable-next-line no-console
        console.warn(`Element with path ${id} not found`)
        return
      }

      const rect = element.getBoundingClientRect()
      const parent = element.parentElement
      if (!parent) {
        return
      }

      const isVoid = isVoidElement(element)

      if (!isVoid && !element.hasChildNodes()) {
        insertAreas.push({
          layout: 'block',
          parent: element,
          index: 0,
          center: {
            x: rect.left + rect.width / 2,
            y: rect.top,
          },
          size: rect.width,
          direction: 1,
        })
      }

      const siblings = Array.from(parent.children).filter(
        (c) =>
          c.hasAttribute('data-node-id') &&
          c.getAttribute('data-node-id')?.endsWith(')') === false,
      )
      const index = siblings.indexOf(element)
      const nextRect = siblings[index + 1]?.getBoundingClientRect()
      const prevRect = siblings[index - 1]?.getBoundingClientRect()
      const isBlockLayout =
        siblings.length > 1 &&
        siblings
          .map((c) => c.getBoundingClientRect())
          .every(
            (r, i, rects) =>
              i === 0 ||
              r.width + r.height === 0 ||
              rects[i - 1].bottom <= r.top,
          )

      if (isBlockLayout) {
        if (prevRect) {
          if (prevRect.bottom >= rect.top) {
            insertAreas.push({
              layout: 'block',
              parent,
              index,
              center: {
                x: rect.left + rect.width / 2,
                y: rect.top,
              },
              size: rect.width,
              direction: -1,
            })
          }
        } else if (siblings.length > 0) {
          insertAreas.push({
            layout: 'block',
            parent,
            index,
            center: {
              x: rect.left + rect.width / 2,
              y: rect.top,
            },
            size: rect.width,
            direction: -1,
          })
        }

        if (nextRect) {
          if (nextRect.top > rect.bottom) {
            insertAreas.push({
              layout: 'block',
              parent,
              index: index + 1,
              center: {
                x: rect.left + rect.width / 2,
                y: (rect.bottom + nextRect.top) / 2,
              },
              size: rect.width,
              direction: 1,
            })
          } else {
            insertAreas.push({
              layout: 'block',
              parent,
              index: index + 1,
              center: {
                x: rect.left + rect.width / 2,
                y: rect.bottom,
              },
              size: rect.width,
              direction: 1,
            })
          }
        } else if (siblings.length > 0) {
          insertAreas.push({
            layout: 'block',
            parent,
            index: index + 1,
            center: {
              x: rect.left + rect.width / 2,
              y: rect.bottom,
            },
            size: rect.width,
            direction: 1,
          })
        }
      } else {
        if (prevRect) {
          if (prevRect.right >= rect.left) {
            insertAreas.push({
              layout: 'inline',
              parent,
              index,
              center: {
                x: rect.left,
                y: rect.top + rect.height / 2,
              },
              size: rect.height,
              direction: -1,
            })
          }
        } else if (siblings.length > 0) {
          insertAreas.push({
            layout: 'inline',
            parent,
            index,
            center: {
              x: rect.left,
              y: rect.top + rect.height / 2,
            },
            size: rect.height,
            direction: -1,
          })
        }

        if (nextRect) {
          if (nextRect.left > rect.right) {
            insertAreas.push({
              layout: 'inline',
              parent,
              index: index + 1,
              center: {
                x: (rect.right + nextRect.left) / 2,
                y: nextRect.top + nextRect.height / 2,
              },
              size: rect.height,
              direction: 1,
            })
          } else {
            insertAreas.push({
              layout: 'inline',
              parent,
              index: index + 1,
              center: {
                x: rect.right,
                y: rect.top + rect.height / 2,
              },
              size: rect.height,
              direction: 1,
            })
          }
        } else if (siblings.length > 0) {
          insertAreas.push({
            layout: 'inline',
            parent,
            index: index + 1,
            center: {
              x: rect.right,
              y: rect.top + rect.height / 2,
            },
            size: rect.height,
            direction: 1,
          })
        }
      }
    })

  return offsetDropLines(insertAreas)
}

/**
 * As a post-effect, lines are moved towards their element if there are multiple overlapping lines.
 * Pointing the cursor slightly outside a container will drop the element after the container, and
 * dropping inside will add as the last child.
 */
function offsetDropLines(insertAreas: Array<InsertArea>) {
  return insertAreas.map((area) => {
    if (area.layout === 'block') {
      return {
        ...area,
        point: {
          ...area.center,
          y:
            area.center.y -
            insertAreas.filter(
              (area2) =>
                area.parent !== area2.parent &&
                area2.layout === 'block' &&
                area2.center.y === area.center.y &&
                area2.parent.contains(area.parent),
            ).length *
              area.direction,
        },
      }
    } else {
      return {
        ...area,
        point: {
          ...area.center,
          x:
            area.center.x -
            insertAreas.filter(
              (area2) =>
                area.parent !== area2.parent &&
                area2.layout === 'inline' &&
                area2.center.x === area.center.x &&
                area2.parent.contains(area.parent),
            ).length *
              area.direction,
        },
      }
    }
  })
}
