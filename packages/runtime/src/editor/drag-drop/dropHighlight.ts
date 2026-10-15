import type { InsertArea } from '../types'

/** Minimum drop-area size for rendering the slot-name label. */
const SLOT_LABEL_MIN_HEIGHT_PX = 16
const SLOT_LABEL_CHAR_WIDTH_PX = 9.6

let highlight: HTMLElement | null = null

let highlights: HTMLElement[] = []

export function setDropHighlight(
  element: HTMLElement | null | undefined,
  targetContainer: HTMLElement | null | undefined,
  color: string,
) {
  highlight?.remove()
  if (!element || !targetContainer) {
    return
  }

  highlight = document.createElement('div')
  highlight.classList.add('__drop-area')
  const { top, left } = targetContainer.getBoundingClientRect()
  highlight.style.setProperty(
    '--drop-area-left',
    `${element.offsetLeft + left}px`,
  )
  highlight.style.setProperty('--drop-area-top', `${element.offsetTop + top}px`)
  highlight.style.setProperty('--drop-area-width', `${element.offsetWidth}px`)
  highlight.style.setProperty('--drop-area-height', `${element.offsetHeight}px`)
  highlight.style.setProperty('--drop-area-outline-color', `#${color}`)
  highlight.style.setProperty(
    '--drop-area-border-radius',
    window.getComputedStyle(element).borderRadius,
  )
  highlight.style.setProperty(
    '--dashed-line-color',
    `color-mix(in srgb, #${color} 33%, transparent)`,
  )
  document.body.append(highlight)
}

let lastHighlightKey: string | null = null

function highlightKey({
  insertAreas,
  color,
  projectionPoint,
}: {
  insertAreas: InsertArea[]
  color: string
  projectionPoint: number
}): string {
  let hasLine = false
  const areas = insertAreas
    .filter((area) => {
      if (area.bounds) {
        return true
      }
      if (hasLine) {
        return false
      }
      hasLine = true
      return true
    })
    .map((area) => {
      const at = area.center
      const bounds = area.bounds
      return [
        area.parent.getAttribute('data-id'),
        area.index,
        area.direction,
        area.layout,
        area.slot ?? '',
        Math.round(at.x * 10) / 10,
        Math.round(at.y * 10) / 10,
        bounds
          ? `${bounds.x},${bounds.y},${bounds.width},${bounds.height}`
          : '',
      ].join('|')
    })
    .sort()
    .join(';')
  return `${areas}#${color}#${Math.round(projectionPoint * 100)}`
}

/**
 * Visual representation of where a dragged node will be dropped outside of its own container.
 */
export function setExternalDropHighlight(args: {
  insertAreas: InsertArea[]
  color: string
  projectionPoint: number
}) {
  const key = highlightKey(args)
  if (key === lastHighlightKey) {
    return
  }
  lastHighlightKey = key
  renderExternalDropHighlight(args)
}

function renderExternalDropHighlight({
  insertAreas,
  color,
  projectionPoint,
}: {
  insertAreas: InsertArea[]
  color: string
  projectionPoint: number
}) {
  highlight?.remove()
  highlights.forEach((h) => h.remove())
  highlights = []

  let hasLine = false
  insertAreas.forEach((insertArea) => {
    let el: HTMLElement
    if (insertArea.bounds) {
      const { x, y, width, height } = insertArea.bounds
      el = document.createElement('div')
      el.classList.add('__drop-area-grid')
      el.style.setProperty('--drop-area-outline-color', `#${color}`)
      el.style.setProperty(
        '--dashed-line-color',
        `color-mix(in srgb, #${color} 33%, transparent)`,
      )
      el.style.setProperty('left', `${x}px`)
      el.style.setProperty('top', `${y}px`)
      el.style.setProperty('width', `${width}px`)
      el.style.setProperty('height', `${height}px`)
      // Name non-default slots in the middle of the drop-area, but only
      // when the area is large enough to contain the label.
      const slotLabel = insertArea.slot
      if (
        slotLabel &&
        slotLabel !== 'default' &&
        height >= SLOT_LABEL_MIN_HEIGHT_PX &&
        width >= slotLabel.length * SLOT_LABEL_CHAR_WIDTH_PX
      ) {
        const label = document.createElement('span')
        label.classList.add('__drop-area-slot-label')
        label.textContent = slotLabel
        label.style.setProperty('background', `#${color}`)
        el.appendChild(label)
      }
    } else {
      if (hasLine) {
        return
      }
      hasLine = true
      const { layout, center } = insertArea
      const length = insertArea.size > 0 ? insertArea.size : 6
      el = document.createElement('div')
      el.classList.add('__drop-area-line')
      el.style.setProperty('--drop-area-left', `${center.x}px`)
      el.style.setProperty('--drop-area-top', `${center.y}px`)
      if (layout === 'block') {
        el.style.setProperty('--drop-area-width', `${length}px`)
        el.style.setProperty('--drop-area-height', '4px')
        el.style.setProperty('--drop-area-translate', '-50% -2px')
      } else {
        el.style.setProperty('--drop-area-width', '4px')
        el.style.setProperty('--drop-area-height', `${length}px`)
        el.style.setProperty('--drop-area-translate', '-2px -50%')
      }
      const gradient = `radial-gradient(circle at ${projectionPoint * 100}% ${
        projectionPoint * 100
      }%, #${color} 0%, #${color}55 max(100%, 75px))`
      el.style.setProperty('--drop-area-background', gradient)
    }
    document.body.appendChild(el)
    highlights.push(el)
  })
}

export function removeDropHighlight() {
  lastHighlightKey = null
  highlight?.remove()
  highlight = null
  highlights.forEach((h) => h.remove())
  highlights = []
}

export const HIGHLIGHT_BLINK_CLASSNAME = '__drop-area-blink'

/**
 * Blinks the current drop highlight during hover-to-insert: marks the nodes
 * so the phase is styleable, and dims them while `hidden`. Always restores
 * inline opacity when switching off.
 */
export function setHighlightBlink(active: boolean, hidden: boolean) {
  const nodes = document.querySelectorAll(
    '.__drop-area-line, .__drop-area-grid',
  )
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return
    }
    node.classList.toggle(HIGHLIGHT_BLINK_CLASSNAME, active)
    if (active && hidden) {
      node.style.setProperty('opacity', '0.15')
    } else {
      node.style.removeProperty('opacity')
    }
  })
}
