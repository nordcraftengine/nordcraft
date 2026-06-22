import { findNearestLine } from '../../utils/findNearestLine'
import { stripNodeIdRepeatIndices } from '../../utils/nodes'
import type { DragState } from '../types'
import { DRAG_REORDER_CLASSNAME } from './dragReorder'
import { removeDropHighlight, setExternalDropHighlight } from './dropHighlight'
import { getInsertAreas } from './getInsertAreas'

export const DRAG_MOVE_CLASSNAME = '__drag-mode--move'

export function dragMove(dragState: DragState | null, exclude: HTMLElement[]) {
  if (!dragState) {
    return
  }

  // If the drag operation was a reorder operation, we need to switch to insert mode and perform some one-time preparation
  if (dragState.mode === 'reorder') {
    dragState.mode = 'insert'
    dragState.element.style.setProperty('display', 'none')
    // We only calculate insert locations when dragging outside the container to avoid unnecessary calculations
    dragState.insertAreas ??= getInsertAreas().filter(
      (x) =>
        exclude.every((e) => !e?.contains(x.parent) && e !== x.parent) &&
        x.parent !== document.body,
    )
    dragState.element.style.removeProperty('display')
    const translate = dragState.element.style.getPropertyValue('translate')
    dragState.element.style.setProperty('translate', '0')
    const rect = dragState.element.getBoundingClientRect()
    document.body.appendChild(dragState.element)
    dragState.element.classList.add(DRAG_MOVE_CLASSNAME)
    dragState.element.classList.remove(DRAG_REORDER_CLASSNAME)
    dragState.element.style.setProperty(
      '--drag-mode--move-left',
      `${rect.left}px`,
    )
    dragState.element.style.setProperty(
      '--drag-mode--move-top',
      `${rect.top}px`,
    )
    dragState.element.style.setProperty(
      '--drag-mode--move-width',
      `${dragState.initialRect.width}px`,
    )
    dragState.element.style.setProperty('translate', translate)
  }
  dragState.repeatedNodes.forEach((node, i) => {
    node.style.setProperty('--drag-repeat-node-opacity', i < 3 ? '0.2' : '0')
  })

  const lines = dragState.insertAreas?.map((line) => {
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
    dragState.lastCursorPosition,
  )
  if (!nearestLine || !dragState.insertAreas || !lines) {
    return
  }

  const insertArea = dragState.insertAreas.at(lines.indexOf(nearestLine))
  if (insertArea) {
    dragState.selectedInsertAreaIndex =
      dragState.insertAreas?.indexOf(insertArea)
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
      color: dragState.elementType === 'component' ? 'D946EF' : '2563EB',
      projectionPoint,
    })
  } else {
    removeDropHighlight()
  }
}
