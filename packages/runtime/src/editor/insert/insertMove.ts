import { findNearestLine } from '../../utils/findNearestLine'
import { stripNodeIdRepeatIndices } from '../../utils/nodes'
import { DRAG_REORDER_CLASSNAME } from '../drag-drop/dragReorder'
import {
  removeDropHighlight,
  setExternalDropHighlight,
} from '../drag-drop/dropHighlight'
import { getInsertAreas } from '../drag-drop/getInsertAreas'
import type { InsertState } from '../types'

export const INSERT_MOVE_CLASSNAME = '__insert-mode--move'

export function insertMove(
  insertState: InsertState | null,
  exclude: HTMLElement[],
) {
  if (!insertState) {
    return
  }

  insertState.element.style.setProperty('display', 'none')
  // We only calculate insert locations when dragging outside the container to avoid unnecessary calculations
  insertState.insertAreas ??= getInsertAreas().filter(
    (x) =>
      exclude.every((e) => !e?.contains(x.parent) && e !== x.parent) &&
      x.parent !== document.body,
  )
  insertState.element.style.removeProperty('display')
  const translate = insertState.element.style.getPropertyValue('translate')
  insertState.element.style.setProperty('translate', '0')
  const rect = insertState.element.getBoundingClientRect()
  document.body.appendChild(insertState.element)
  insertState.element.classList.add(INSERT_MOVE_CLASSNAME)
  insertState.element.classList.remove(DRAG_REORDER_CLASSNAME)
  insertState.element.style.setProperty(
    '--drag-mode--move-left',
    `${rect.left}px`,
  )
  insertState.element.style.setProperty(
    '--drag-mode--move-top',
    `${rect.top}px`,
  )
  insertState.element.style.setProperty(
    '--drag-mode--move-width',
    `${insertState.initialRect.width}px`,
  )
  insertState.element.style.setProperty('translate', translate)
  ////////////////////
  insertState.repeatedNodes.forEach((node, i) => {
    node.style.setProperty('--drag-repeat-node-opacity', i < 3 ? '0.2' : '0')
  })

  const lines = insertState.insertAreas?.map((line) => {
    if (line.layout === 'block') {
      return {
        x1: line.center.x - line.size / 2,
        y1: line.center.y,
        x2: line.center.x + line.size / 2,
        y2: line.center.y,
      }
    } else {
      return {
        x1: line.center.x,
        y1: line.center.y - line.size / 2,
        x2: line.center.x,
        y2: line.center.y + line.size / 2,
      }
    }
  })
  const { nearestLine, projectionPoint } = findNearestLine(
    lines ?? [],
    insertState.lastCursorPosition,
  )
  if (!nearestLine || !insertState.insertAreas || !lines) {
    return
  }

  const insertArea = insertState.insertAreas.at(lines.indexOf(nearestLine))
  if (insertArea) {
    insertState.selectedInsertAreaIndex =
      insertState.insertAreas.indexOf(insertArea)
    const nodeId = insertArea.parent.getAttribute('data-id')
    window.parent?.postMessage(
      {
        type: 'highlight',
        highlightedNodeId: stripNodeIdRepeatIndices(nodeId),
        exactHighlightedNodeId: nodeId,
      },
      '*',
    )
    setExternalDropHighlight({
      layout: insertArea.layout,
      center: insertArea.center,
      length: insertArea.size,
      color: '2563EB',
      projectionPoint,
    })
  } else {
    removeDropHighlight()
  }
}
