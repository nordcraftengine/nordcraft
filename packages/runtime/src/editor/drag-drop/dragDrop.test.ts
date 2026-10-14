import { afterEach, describe, expect, test } from 'bun:test'
import { findNearestLine } from '../findNearestLine'
import {
  applyDropParentStyles,
  cancelHoverInsert,
  centerGhostOnCursor,
  dragInsertEnded,
  dragInsertMove,
  dragInsertStarted,
  dropStyleProps,
  MAX_SNAP_DISTANCE_PX,
} from '../helpers'
import { handleInsertEnded } from '../insert/insertHandlers'
import type { DragInsertState } from '../types'
import {
  handleDragAltToggle,
  handleDragEnded,
  handleDragMouseMove,
  trackHoverTarget,
} from './dragHandlers'
import { DRAG_REORDER_CLASSNAME, dragReorder } from './dragReorder'
import { dedupeOverlappingLines, getInsertAreas } from './getInsertAreas'

// eslint-disable-next-line max-params
const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  x: left,
  y: top,
  toJSON() {},
})

const stubRect = (el: Element | null, r: ReturnType<typeof rect>) => {
  if (el) {
    el.getBoundingClientRect = () => r as unknown as DOMRect
  }
}

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

afterEach(() => {
  document.body.innerHTML = ''
})

describe('single-child drop lines', () => {
  test('flex parent emits above/below (column) and left/right (row) with indices 0/1', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">only</div></div></div>'
    const flexParent = document.querySelector('[data-id="0.1"]') as HTMLElement
    flexParent.style.setProperty('display', 'flex')
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(110, 110, 180, 80),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(4)

    const above = areas.find((a) => a.layout === 'block' && a.direction === -1)!
    const below = areas.find((a) => a.layout === 'block' && a.direction === 1)!
    const left = areas.find((a) => a.layout === 'inline' && a.direction === -1)!
    const right = areas.find((a) => a.layout === 'inline' && a.direction === 1)!

    expect(above['flex-direction']).toBe('column')
    expect(above.index).toBe(0)
    expect(below['flex-direction']).toBe('column')
    expect(below.index).toBe(1)
    expect(left['flex-direction']).toBe('row')
    expect(left.index).toBe(0)
    expect(right['flex-direction']).toBe('row')
    expect(right.index).toBe(1)
  })

  test('non-flex block parent emits plain above/below lines matching insertion', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">only</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(110, 110, 180, 80),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(2)
    expect(areas.every((a) => a.layout === 'block')).toBe(true)
    expect(areas.every((a) => a.bounds === undefined)).toBe(true)
    expect(dropStyleProps(areas[0])).toEqual({})
    expect(dropStyleProps(areas[1])).toEqual({})

    const above = areas.find((a) => a.direction === -1)!
    const below = areas.find((a) => a.direction === 1)!
    expect(above.index).toBe(0)
    expect(above.center).toEqual({ x: 200, y: 110 })
    expect(below.index).toBe(1)
    expect(below.center).toEqual({ x: 200, y: 190 })
  })

  test('repeat containers keep generic lines (no 4-way flex lines)', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.0(0)" data-node-id="2">a</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(110, 110, 180, 80),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas.length).toBeGreaterThan(0)
    expect(areas.every((a) => a['flex-direction'] === undefined)).toBe(true)
  })

  test('drop lines are positioned before the first repeat item and after the last repeat item', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.0(0)" data-node-id="2">a</div><div data-id="0.1.0(1)" data-node-id="2">a</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.1.0(0)"]'),
      rect(100, 150, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.1.0(1)"]'),
      rect(100, 200, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 150),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(2)
    const beforeLine = areas.find((a) => a.direction === -1)!
    expect(beforeLine).toBeDefined()
    expect(beforeLine.center.y).toBe(102)

    const afterLine = areas.find((a) => a.direction === 1)!
    expect(afterLine).toBeDefined()
    expect(afterLine.center.y).toBe(248)
  })

  test('multi-child parents are unaffected (no flex-direction)', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.1" data-node-id="3">b</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(100, 200, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 200),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas.length).toBeGreaterThan(0)
    expect(areas.some((a) => a['flex-direction'] !== undefined)).toBe(false)
  })
})

describe('dragging one of two siblings (insert mode)', () => {
  test('remaining sibling in a flex parent offers all four sides with flex-direction', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.1" data-node-id="3">b</div></div></div>'
    const flexParent = document.querySelector('[data-id="0.1"]') as HTMLElement
    flexParent.style.setProperty('display', 'flex')
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(50, 50, 300, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(60, 180, 280, 80),
    )
    stubRect(document.querySelector('[data-id="0.1"]'), rect(50, 50, 300, 220))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 100 },
      repeatedNodes: [],
      asCopy: false,
    })!
    // CMD-style: only the dragged element excluded, like the metaKey flow
    state.lastCursorPosition = { x: 200, y: 190 }
    dragInsertMove('drag', state, [state.element])

    // Detached first, so areas reflect the post-removal layout
    expect(state.element.parentElement).toBe(document.body)
    const parent = document.querySelector('[data-id="0.1"]')!
    const around = state.insertAreas!.filter((a) => a.parent === parent)
    expect(around).toHaveLength(4)
    expect(around.every((a) => a['flex-direction'] !== undefined)).toBe(true)
    expect(
      around.filter(
        (a) => a.layout === 'block' && a['flex-direction'] === 'column',
      ),
    ).toHaveLength(2)
    expect(
      around.filter(
        (a) => a.layout === 'inline' && a['flex-direction'] === 'row',
      ),
    ).toHaveLength(2)
    // No body-parented areas leak through
    expect(state.insertAreas!.some((a) => a.parent === document.body)).toBe(
      false,
    )
    state.destroying = true
  })
})

describe('sole child auto-insert', () => {
  const loneSetup = () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">lone</div></div></div>'
    const flexParent = document.querySelector('[data-id="0.1"]') as HTMLElement
    flexParent.style.setProperty('display', 'flex')
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(50, 50, 300, 100),
    )
    stubRect(document.querySelector('[data-id="0.1"]'), rect(50, 50, 300, 100))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))
  }

  test('lone drag is flagged sole, multi and duplicate drags are not', () => {
    loneSetup()
    const lone = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 100 },
      repeatedNodes: [],
      asCopy: false,
    })!
    expect(lone.isSoleChildDrag).toBe(true)
    lone.destroying = true

    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.1" data-node-id="3">b</div></div></div>'
    const multi = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 100 },
      repeatedNodes: [],
      asCopy: false,
    })!
    expect(multi.isSoleChildDrag).toBe(false)
    multi.destroying = true

    loneSetup()
    const duplicate = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 100 },
      repeatedNodes: [],
      asCopy: true,
    })!
    // The copy counts: two children, so reorder (move mode)
    expect(duplicate.isSoleChildDrag).toBe(false)
    duplicate.destroying = true
  })

  test('lone drag inside the container enters insert mode with 9 spots', () => {
    loneSetup()
    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 100 },
      repeatedNodes: [],
      asCopy: false,
    })!
    expect(state.mode).toBe('reorder')
    handleDragMouseMove({ x: 200, y: 100 }, state, false)
    expect(state.mode).toBe('insert')
    expect(state.element.parentElement).toBe(document.body)
    const parent = document.querySelector('[data-id="0.1"]')!
    const cells = state.insertAreas!.filter((a) => a.parent === parent)
    expect(cells).toHaveLength(9)
    expect(cells.every((a) => a.bounds !== undefined)).toBe(true)
    state.destroying = true
  })

  test('lone drag in a non-flex container offers a single container-sized area', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">lone</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(50, 50, 300, 100),
    )
    stubRect(document.querySelector('[data-id="0.1"]'), rect(50, 50, 300, 100))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))
    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 100 },
      repeatedNodes: [],
      asCopy: false,
    })!
    handleDragMouseMove({ x: 200, y: 100 }, state, false)
    expect(state.mode).toBe('insert')
    const parent = document.querySelector('[data-id="0.1"]')!
    const into = state.insertAreas!.filter((a) => a.parent === parent)
    expect(into).toHaveLength(1)
    expect(into[0].bounds).toEqual({ x: 50, y: 50, width: 300, height: 100 })
    expect(into[0].index).toBe(0)
    expect(dropStyleProps(into[0])).toEqual({})
    expect(state.insertAreas![state.selectedInsertAreaIndex ?? -1].parent).toBe(
      parent,
    )
    state.destroying = true
  })

  test('duplicate drag of a lone child stays in reorder mode', () => {
    loneSetup()
    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 100 },
      repeatedNodes: [],
      asCopy: true,
    })!
    handleDragMouseMove({ x: 200, y: 100 }, state, false)
    expect(state.mode).toBe('reorder')
    expect(state.element.parentElement!.getAttribute('data-id')).toBe('0.1')
    state.destroying = true
  })

  test('dropping the lone child posts placement props', async () => {
    loneSetup()
    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      const state = dragInsertStarted({
        action: 'drag',
        element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
        lastCursorPosition: { x: 200, y: 60 },
        repeatedNodes: [],
        asCopy: false,
      })!
      handleDragMouseMove({ x: 200, y: 60 }, state, false)
      await handleDragEnded({}, state, null)
      const moved = posted.find((m) => m.type === 'nodeMoved')
      expect(moved.parent).toBe('0.1')
      expect(moved.index).toBe(0)
      expect(moved['justify-content']).toBe('center')
      expect(moved['align-items']).toBe('flex-start')
      expect(moved['flex-direction']).toBe('row')
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })
})

describe('coincident line dedupe', () => {
  test('gapless after/before pair collapses to a single line', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.1" data-node-id="3">b</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(50, 50, 300, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(50, 150, 300, 100),
    )
    stubRect(document.querySelector('[data-id="0.1"]'), rect(50, 50, 300, 200))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const atEdge = getInsertAreas().filter(
      (a) => a.parent === parent && Math.round(a.center.y) === 150,
    )
    expect(atEdge).toHaveLength(1)
    expect(atEdge[0].index).toBe(1)
  })

  test('small-gap pair merges into the midpoint line', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.1" data-node-id="3">b</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(50, 50, 300, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(50, 154, 300, 100),
    )
    stubRect(document.querySelector('[data-id="0.1"]'), rect(50, 50, 300, 204))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const between = getInsertAreas().filter(
      (a) => a.parent === parent && a.center.y > 100 && a.center.y < 200,
    )
    expect(between).toHaveLength(1)
    // Midpoint of the shared edge gap: perfectly in between
    expect(between[0].center.y).toBe((150 + 154) / 2)
    expect(between[0].index).toBe(1)
  })

  test('gapped pair keeps only the line in between (midpoint)', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.1" data-node-id="3">b</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(50, 50, 300, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(50, 170, 300, 100),
    )
    stubRect(document.querySelector('[data-id="0.1"]'), rect(50, 50, 300, 220))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const between = getInsertAreas().filter(
      (a) => a.parent === parent && a.center.y > 100 && a.center.y < 200,
    )
    expect(between).toHaveLength(1)
    expect(between[0].center.y).toBe(160)
    expect(between[0].index).toBe(1)
  })

  test('nested tight levels collapse to the flex-carrying line', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2"><div data-id="0.1.0.0" data-node-id="3">a</div></div><div data-id="0.1.1" data-node-id="4">b</div></div></div>'
    const flexWrapper = document.querySelector(
      '[data-id="0.1.0"]',
    ) as HTMLElement
    flexWrapper.style.setProperty('display', 'flex')
    stubRect(
      document.querySelector('[data-id="0.1.0.0"]'),
      rect(50, 50, 300, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(50, 50, 300, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(50, 150, 300, 100),
    )
    stubRect(document.querySelector('[data-id="0.1"]'), rect(50, 50, 300, 200))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const atEdge = getInsertAreas().filter(
      (a) =>
        !a.bounds && a.layout === 'block' && Math.round(a.center.y) === 150,
    )
    expect(atEdge).toHaveLength(1)
    expect(atEdge[0]['flex-direction']).toBe('column')
  })

  test('same-edge lines with disjoint extents are kept', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div></div><div data-id="0.2" data-node-id="3"><div data-id="0.2.0" data-node-id="4">b</div></div></div>'
    stubRect(document.querySelector('[data-id="0.1.0"]'), rect(0, 50, 100, 100))
    stubRect(document.querySelector('[data-id="0.1"]'), rect(0, 50, 100, 100))
    stubRect(
      document.querySelector('[data-id="0.2.0"]'),
      rect(300, 50, 100, 100),
    )
    stubRect(document.querySelector('[data-id="0.2"]'), rect(300, 50, 100, 100))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const atEdge = getInsertAreas().filter(
      (a) =>
        !a.bounds && a.layout === 'block' && Math.round(a.center.y) === 150,
    )
    expect(atEdge).toHaveLength(2)
  })
})

describe('dedupe slot exemption', () => {
  test('coincident slot lines are never merged', () => {
    const parent = document.createElement('div')
    const mirror = document.createElement('div')
    document.body.append(parent, mirror)
    const line = (slot: string | undefined): any => ({
      layout: 'block',
      parent,
      indexAll: 0,
      index: 0,
      slot,
      center: { x: 200, y: 150 },
      size: 300,
      direction: 1,
    })
    // Slot mirrors share an edge: both survive (multi-line display by design)
    expect(
      dedupeOverlappingLines([line('a'), { ...line('a'), parent: mirror }]),
    ).toHaveLength(2)
    // Same slot instance collapses like slotless duplicates
    expect(dedupeOverlappingLines([line('a'), line('a')])).toHaveLength(1)
    // Slotless duplicates still collapse
    expect(
      dedupeOverlappingLines([line(undefined), line(undefined)]),
    ).toHaveLength(1)
  })
})

describe('dropStyleProps', () => {
  test('only includes defined props', () => {
    const parent = document.createElement('div')
    const area = (extra: object) => ({
      layout: 'block' as const,
      parent,
      indexAll: 0,
      index: 0,
      center: { x: 0, y: 0 },
      size: 10,
      direction: 1 as const,
      ...extra,
    })
    expect(dropStyleProps(area({}))).toEqual({})
    expect('justify-content' in dropStyleProps(area({}))).toBe(false)
    expect(
      dropStyleProps(
        area({
          bounds: { x: 0, y: 0, width: 10, height: 10 },
          'justify-content': 'center',
          'align-items': 'flex-start',
        }),
      ),
    ).toEqual({ 'justify-content': 'center', 'align-items': 'flex-start' })
    expect(dropStyleProps(area({ 'flex-direction': 'row' as const }))).toEqual({
      'flex-direction': 'row',
    })
  })
})

describe('dropStyleProps flex axis swap', () => {
  const flexParent = (direction: string, justify?: string, align?: string) => {
    const parent = document.createElement('div')
    parent.style.setProperty('display', 'flex')
    parent.style.setProperty('flex-direction', direction)
    if (justify !== undefined) {
      parent.style.setProperty('justify-content', justify)
    }
    if (align !== undefined) {
      parent.style.setProperty('align-items', align)
    }
    document.body.append(parent)
    return parent
  }
  const lineArea = (parent: Element, extra: object = {}) => ({
    layout: 'block' as const,
    parent,
    indexAll: 1,
    index: 1,
    center: { x: 0, y: 0 },
    size: 10,
    direction: 1 as const,
    ...extra,
  })

  test('row to column swaps the parent alignment', () => {
    const parent = flexParent('row', 'center', 'flex-start')
    expect(
      dropStyleProps(lineArea(parent, { 'flex-direction': 'column' as const })),
    ).toEqual({
      'flex-direction': 'column',
      'justify-content': 'flex-start',
      'align-items': 'center',
    })
  })

  test('column to row swaps back (round-trip)', () => {
    const parent = flexParent('column', 'flex-start', 'center')
    expect(
      dropStyleProps(lineArea(parent, { 'flex-direction': 'row' as const })),
    ).toEqual({
      'flex-direction': 'row',
      'justify-content': 'center',
      'align-items': 'flex-start',
    })
  })

  test('same axis keeps only flex-direction', () => {
    const parent = flexParent('row', 'center', 'flex-start')
    expect(
      dropStyleProps(lineArea(parent, { 'flex-direction': 'row' as const })),
    ).toEqual({ 'flex-direction': 'row' })
  })

  test('non-flex parent keeps only flex-direction', () => {
    const parent = document.createElement('div')
    parent.style.setProperty('justify-content', 'center')
    document.body.append(parent)
    expect(
      dropStyleProps(lineArea(parent, { 'flex-direction': 'column' as const })),
    ).toEqual({ 'flex-direction': 'column' })
  })

  test('missing parent alignment emits no swap', () => {
    const parent = flexParent('row')
    expect(
      dropStyleProps(lineArea(parent, { 'flex-direction': 'column' as const })),
    ).toEqual({ 'flex-direction': 'column' })
  })

  test('explicit normal alignment emits no swap', () => {
    const parent = flexParent('row', 'normal', 'normal')
    expect(
      dropStyleProps(lineArea(parent, { 'flex-direction': 'column' as const })),
    ).toEqual({ 'flex-direction': 'column' })
  })

  test('area placement props win over the swap', () => {
    const parent = flexParent('column', 'flex-end', 'center')
    expect(
      dropStyleProps(
        lineArea(parent, {
          bounds: { x: 0, y: 0, width: 10, height: 10 },
          'justify-content': 'center',
          'align-items': 'flex-start',
          'flex-direction': 'row' as const,
        }),
      ),
    ).toEqual({
      'justify-content': 'center',
      'align-items': 'flex-start',
      'flex-direction': 'row',
    })
  })

  test('partial parent alignment swaps only the meaningful side', () => {
    const parent = flexParent('row', 'center')
    const props = dropStyleProps(
      lineArea(parent, { 'flex-direction': 'column' as const }),
    )
    expect(props).toEqual({
      'flex-direction': 'column',
      'align-items': 'center',
    })
    expect('justify-content' in props).toBe(false)
  })

  test('dropping a second element across the axis forwards swapped alignment', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">first</div></div><div data-id="0.9" data-node-id="9"><div data-id="0.9.0" data-node-id="10">dragme</div><div data-id="0.9.1" data-node-id="11">stay</div></div></div>'
    const target = document.querySelector('[data-id="0.1"]') as HTMLElement
    target.style.setProperty('display', 'flex')
    target.style.setProperty('flex-direction', 'row')
    target.style.setProperty('justify-content', 'center')
    target.style.setProperty('align-items', 'flex-start')
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(target, rect(100, 100, 200, 100))
    stubRect(
      document.querySelector('[data-id="0.9.0"]'),
      rect(100, 400, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.1"]'),
      rect(100, 500, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9"]'),
      rect(100, 400, 200, 200),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      const state = dragInsertStarted({
        action: 'drag',
        element: document.querySelector('[data-id="0.9.0"]') as HTMLElement,
        lastCursorPosition: { x: 200, y: 450 },
        repeatedNodes: [],
        asCopy: false,
      })!
      state.lastCursorPosition = { x: 200, y: 210 }
      dragInsertMove('drag', state, [state.element, state.initialContainer])
      await handleDragEnded({}, state, null)
      const moved = posted.find((m) => m.type === 'nodeMoved')
      expect(moved.parent).toBe('0.1')
      expect(moved.index).toBe(1)
      expect(moved['flex-direction']).toBe('column')
      expect(moved['justify-content']).toBe('flex-start')
      expect(moved['align-items']).toBe('center')
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })
})

describe('alt toggle teardown', () => {
  const setup = () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.1" data-node-id="3">b</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(50, 50, 300, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(50, 150, 300, 100),
    )
    stubRect(document.querySelector('[data-id="0.1"]'), rect(50, 50, 300, 200))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))
  }

  const stubViewTransition = (calls: Array<() => void>, hang: boolean) => {
    const doc = document as any
    const prev = doc.startViewTransition
    const prevMatchMedia = window.matchMedia
    doc.startViewTransition = (callback: () => void) => {
      calls.push(callback)
      if (!hang) {
        callback()
      }
      return {
        finished: hang ? new Promise(() => {}) : Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
      }
    }
    if (typeof window.matchMedia !== 'function') {
      ;(window as any).matchMedia = () => ({ matches: false })
    }
    return () => {
      if (prev === undefined) {
        delete doc.startViewTransition
      } else {
        doc.startViewTransition = prev
      }
      if (window.matchMedia !== prevMatchMedia) {
        ;(window as any).matchMedia = prevMatchMedia
      }
    }
  }

  const hasTransitionStyle = () =>
    Array.from(document.head.querySelectorAll('style')).some((style) =>
      style.textContent.includes('view-transition-group'),
    )

  test('toggling duplicate skips the view transition and resolves immediately', async () => {
    setup()
    const calls: Array<() => void> = []
    const restore = stubViewTransition(calls, true)
    try {
      const state = dragInsertStarted({
        action: 'drag',
        element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
        lastCursorPosition: { x: 200, y: 100 },
        repeatedNodes: [],
        asCopy: false,
      })!
      const toggled = await Promise.race([
        handleDragAltToggle(true, state).then((next) => ({
          tag: 'resolved' as const,
          next,
        })),
        new Promise<{ tag: 'timeout' }>((resolve) =>
          setTimeout(() => resolve({ tag: 'timeout' }), 500),
        ),
      ])
      expect(toggled.tag).toBe('resolved')
      if (toggled.tag !== 'resolved') {
        return
      }
      // No transition started (and therefore never awaited)
      expect(calls).toHaveLength(0)
      expect(hasTransitionStyle()).toBe(false)
      // DOM snapped back synchronously: element restored, stale copy gone,
      // no transition names left behind
      const container = document.querySelector('[data-id="0.1"]') as HTMLElement
      expect(state.element.parentElement).toBe(container)
      expect(state.element.style.getPropertyValue('view-transition-name')).toBe(
        '',
      )
      expect(
        Array.from(container.children).filter(
          (child) =>
            child instanceof HTMLElement &&
            child.style.getPropertyValue('opacity') === '0.5',
        ),
      ).toHaveLength(1)
      expect(toggled.next).not.toBeNull()
      // Ghost centered on the cursor right away: element box (50, 50,
      // 300, 100), cursor (200, 100)
      expect(toggled.next!.offset).toEqual({ x: 200, y: 100 })
      expect(toggled.next!.element.style.getPropertyValue('translate')).toBe(
        '0px 0px',
      )
      toggled.next!.destroying = true
    } finally {
      restore()
    }
  })

  test('a real drop still plays the view transition', async () => {
    setup()
    const calls: Array<() => void> = []
    const restore = stubViewTransition(calls, false)
    try {
      const state = dragInsertStarted({
        action: 'drag',
        element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
        lastCursorPosition: { x: 200, y: 100 },
        repeatedNodes: [],
        asCopy: false,
      })!
      handleDragMouseMove({ x: 200, y: 100 }, state, false)
      await dragInsertEnded(state, false)
      expect(calls).toHaveLength(1)
      expect(hasTransitionStyle()).toBe(false)
      expect(state.element.style.getPropertyValue('translate')).toBe('')
      state.destroying = true
    } finally {
      restore()
    }
  })

  test('pressing ALT when element is in insert mode creates duplicate at initial origin', async () => {
    setup()
    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.1.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 100 },
      repeatedNodes: [],
      asCopy: false,
    })!
    // Move outside container into insert mode
    state.lastCursorPosition = { x: 500, y: 400 }
    dragInsertMove('drag', state, [state.element, state.initialContainer])
    expect(state.mode).toBe('insert')
    expect(state.element.parentElement).toBe(document.body)
    // Before ALT: original container 0.1 is excluded from insert areas
    expect(
      state.insertAreas?.some(
        (a) => a.parent.getAttribute('data-id') === '0.1',
      ),
    ).toBe(false)

    // Press ALT: duplicate created at initial origin, and insert areas recalculated to include original container 0.1
    await handleDragAltToggle(true, state)
    expect(state.copy).toBeDefined()
    expect(state.copy?.parentElement?.getAttribute('data-id')).toBe('0.1')
    expect(state.copy?.nextElementSibling?.getAttribute('data-id')).toBe(
      '0.1.1',
    )
    expect(state.element.parentElement).toBe(document.body)
    expect(
      state.insertAreas?.some(
        (a) => a.parent.getAttribute('data-id') === '0.1',
      ),
    ).toBe(true)

    // Release ALT: copy removed and insert areas recalculated to exclude original container 0.1 again
    await handleDragAltToggle(false, state)
    expect(state.copy).toBeUndefined()
    expect(state.element.parentElement).toBe(document.body)
    expect(
      state.insertAreas?.some(
        (a) => a.parent.getAttribute('data-id') === '0.1',
      ),
    ).toBe(false)
    state.destroying = true
  })
})

describe('hover-to-insert', () => {
  const setup = () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">first</div></div><div data-id="0.9" data-node-id="9"><div data-id="0.9.0" data-node-id="10">dragme</div><div data-id="0.9.1" data-node-id="11">stay</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.0"]'),
      rect(100, 400, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.1"]'),
      rect(100, 500, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9"]'),
      rect(100, 400, 200, 200),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))
  }

  const startHoverDrag = () => {
    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.9.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 450 },
      repeatedNodes: [],
      asCopy: false,
    })!
    state.lastCursorPosition = { x: 200, y: 210 }
    dragInsertMove('drag', state, [state.element, state.initialContainer])
    const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
    expect(selected?.parent.getAttribute('data-id')).toBe('0.1')
    expect(selected?.index).toBe(1)
    return state
  }

  const childIds = (dataId: string) =>
    Array.from(document.querySelector(`[data-id="${dataId}"]`)!.children).map(
      (child) => child.getAttribute('data-id'),
    )

  test('resting on a target blinks, then places and moves from there', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 10 },
    )
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(replaced).toBeDefined()
    const next = replaced!
    expect(next.mode).toBe('reorder')
    expect(next.initialContainer.getAttribute('data-id')).toBe('0.1')
    expect(childIds('0.1')).toEqual(['0.1.0', '0.9.0'])
    expect(childIds('0.9')).toEqual(['0.9.1'])
    expect(next.trueOrigin?.container.getAttribute('data-id')).toBe('0.9')
    expect(next.trueOrigin?.nextSibling?.getAttribute('data-id')).toBe('0.9.1')
    expect(state.destroying).toBe(true)
    // Reorder targets re-measured with the element in its new home: both
    // children plus the end slot (stale pre-move probing would give 2)
    expect(next.reorderPermutations).toHaveLength(3)
    expect(next.reorderPermutations.at(-1)?.nextSibling).toBeNull()
    cancelHoverInsert(next)
    next.destroying = true
  })

  test('cancelling after a hover falls back to the original position', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 10 },
    )
    await new Promise((resolve) => setTimeout(resolve, 150))
    const next = replaced!
    await handleDragEnded({ canceled: true }, next, null)
    expect(next.element.parentElement?.getAttribute('data-id')).toBe('0.9')
    expect(childIds('0.9')).toEqual(['0.9.0', '0.9.1'])
    next.destroying = true
  })

  test('pressing ALT after hover-insert creates the duplicate at initial origin, not next to dragged element in new parent', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 10 },
    )
    await new Promise((resolve) => setTimeout(resolve, 150))
    const next = replaced!
    expect(next.element.parentElement?.getAttribute('data-id')).toBe('0.1')
    expect(childIds('0.1')).toEqual(['0.1.0', '0.9.0'])
    expect(childIds('0.9')).toEqual(['0.9.1'])

    // Press ALT during drag while element is in new parent (0.1)
    await handleDragAltToggle(true, next)

    // The dragged element should still be in the new parent (0.1)
    expect(next.element.parentElement?.getAttribute('data-id')).toBe('0.1')
    expect(childIds('0.1')).toEqual(['0.1.0', '0.9.0'])

    // The duplicate item (copy with opacity 0.5) should be created at the initial origin (0.9), before 0.9.1
    expect(next.copy).toBeDefined()
    expect(next.copy?.parentElement?.getAttribute('data-id')).toBe('0.9')
    expect(next.copy?.style.getPropertyValue('opacity')).toBe('0.5')
    expect(next.copy?.nextElementSibling?.getAttribute('data-id')).toBe('0.9.1')
    const originCopies = Array.from(
      document.querySelector('[data-id="0.9"]')!.children,
    ).filter(
      (child) =>
        child instanceof HTMLElement &&
        child.style.getPropertyValue('opacity') === '0.5',
    )
    expect(originCopies).toHaveLength(1)
    const newParentCopies = Array.from(
      document.querySelector('[data-id="0.1"]')!.children,
    ).filter(
      (child) =>
        child instanceof HTMLElement &&
        child.style.getPropertyValue('opacity') === '0.5',
    )
    expect(newParentCopies).toHaveLength(0)

    // Releasing ALT removes the duplicate from initial origin, keeping dragged element in new parent
    await handleDragAltToggle(false, next)
    expect(next.copy).toBeUndefined()
    expect(next.element.parentElement?.getAttribute('data-id')).toBe('0.1')
    expect(childIds('0.1')).toEqual(['0.1.0', '0.9.0'])
    expect(childIds('0.9')).toEqual(['0.9.1'])

    next.destroying = true
  })

  test('dropping after hover-insert with ALT held duplicates element into new parent', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 10 },
    )
    await new Promise((resolve) => setTimeout(resolve, 150))
    const next = replaced!
    await handleDragAltToggle(true, next)

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      await handleDragEnded({}, next, null)
      const moved = posted.find((m) => m.type === 'nodeMoved')
      expect(moved).toBeDefined()
      expect(moved.parent).toBe('0.1')
      expect(moved.copy).toBe(true)
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })

  test('after hover-insert and pressing ALT, original container is eligible for drop', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 10 },
    )
    await new Promise((resolve) => setTimeout(resolve, 150))
    const next = replaced!
    await handleDragAltToggle(true, next)

    // Move cursor back outside container 0.1 towards original container 0.9
    handleDragMouseMove({ x: 200, y: 550 }, next, false)
    expect(next.mode).toBe('insert')
    // Original container 0.9 must have insert areas available
    const originAreas = next.insertAreas?.filter(
      (a) => a.parent.getAttribute('data-id') === '0.9',
    )
    expect(originAreas?.length).toBeGreaterThan(0)

    const selected = next.insertAreas?.[next.selectedInsertAreaIndex ?? -1]
    expect(selected?.parent.getAttribute('data-id')).toBe('0.9')

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      await handleDragEnded({}, next, null)
      const moved = posted.find((m) => m.type === 'nodeMoved')
      expect(moved).toBeDefined()
      expect(moved.parent).toBe('0.9')
      expect(moved.copy).toBe(true)
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })

  test('moving to another target resets the still timer', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    const onReplace = (next: DragInsertState | null) => {
      replaced = next
    }
    trackHoverTarget(state, onReplace, { stillMs: 5, blinkMs: 10 })
    // Retarget above the first child before the first timer fires
    state.lastCursorPosition = { x: 200, y: 90 }
    dragInsertMove('drag', state, [state.element, state.initialContainer])
    trackHoverTarget(state, onReplace, { stillMs: 5, blinkMs: 10000 })
    await new Promise((resolve) => setTimeout(resolve, 120))
    expect(replaced).toBeUndefined()
    // Still floating: never placed
    expect(state.element.parentElement).toBe(document.body)
    expect(childIds('0.1')).toEqual(['0.1.0'])
    cancelHoverInsert(state)
    state.destroying = true
  })

  test('blink phase marks the highlight until cancelled', async () => {
    setup()
    const state = startHoverDrag()
    expect(document.querySelector('.__drop-area-blink')).toBeNull()
    trackHoverTarget(state, () => {}, { stillMs: 5, blinkMs: 60000 })
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(state.hover?.blinking).toBe(true)
    expect(document.querySelector('.__drop-area-blink')).not.toBeNull()
    cancelHoverInsert(state)
    expect(state.hover).toBeUndefined()
    expect(document.querySelector('.__drop-area-blink')).toBeNull()
    state.destroying = true
  })

  test('CMD held prevents blinking and auto-transition to move mode', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 10, metaKey: true },
    )
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(replaced).toBeUndefined()
    expect(state.hover).toBeUndefined()
    expect(document.querySelector('.__drop-area-blink')).toBeNull()
    expect(state.mode).toBe('insert')
    state.destroying = true
  })

  test('pressing CMD cancels active blinking and aborts hover transition', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 50 },
    )
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(state.hover?.blinking).toBe(true)
    state.metaKey = true
    cancelHoverInsert(state)
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(replaced).toBeUndefined()
    expect(state.hover).toBeUndefined()
    expect(state.mode).toBe('insert')
    state.destroying = true
  })

  test('empty containers keep the standard overlay, no auto-insert', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"></div><div data-id="0.9" data-node-id="9"><div data-id="0.9.0" data-node-id="10">dragme</div><div data-id="0.9.1" data-node-id="11">stay</div></div></div>'
    const flexEmpty = document.querySelector('[data-id="0.1"]') as HTMLElement
    flexEmpty.style.setProperty('display', 'flex')
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 300, 300),
    )
    stubRect(
      document.querySelector('[data-id="0.9.0"]'),
      rect(100, 500, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.1"]'),
      rect(100, 600, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9"]'),
      rect(100, 500, 200, 200),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 900, 800))

    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.9.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 550 },
      repeatedNodes: [],
      asCopy: false,
    })!
    state.lastCursorPosition = { x: 250, y: 250 }
    dragInsertMove('drag', state, [state.element, state.initialContainer])
    // Standard overlay: the middle grid cell is selected ...
    const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
    expect(selected?.parent.getAttribute('data-id')).toBe('0.1')
    expect(selected?.bounds).toBeDefined()
    // ... but resting there never auto-inserts
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 10 },
    )
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(replaced).toBeUndefined()
    expect(state.hover).toBeUndefined()
    expect(state.element.parentElement).toBe(document.body)
    expect(childIds('0.1')).toEqual([])
    state.destroying = true
  })

  test('centerGhostOnCursor snaps the ghost onto the cursor', () => {
    const element = document.createElement('div')
    document.body.append(element)
    stubRect(element, rect(50, 50, 300, 100))
    const ghost = {
      element,
      offset: { x: 0, y: 0 },
      lastCursorPosition: { x: 200, y: 60 },
    }
    centerGhostOnCursor(ghost)
    expect(ghost.offset).toEqual({ x: 200, y: 100 })
    expect(element.style.getPropertyValue('translate')).toBe('0px -40px')
  })

  test('placed ghost starts centered on the cursor', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 10 },
    )
    await new Promise((resolve) => setTimeout(resolve, 150))
    const next = replaced!
    // Element rect travels with the node: box center (200, 450), cursor
    // (200, 210) — the equilibrium pair, no moves needed
    expect(next.offset).toEqual({ x: 200, y: 450 })
    expect(next.element.style.getPropertyValue('translate')).toBe('0px -240px')
    cancelHoverInsert(next)
    next.destroying = true
  })

  test('releasing right after a hover commits the move', async () => {
    // Header leaves a real gap: the above-line of the first child is
    // distinct from the outer gap line (which would otherwise win the edge)
    document.body.innerHTML =
      '<div id="App"><div data-id="0.0" data-node-id="8">head</div><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">first</div></div><div data-id="0.9" data-node-id="9"><div data-id="0.9.0" data-node-id="10">dragme</div><div data-id="0.9.1" data-node-id="11">stay</div></div></div>'
    stubRect(document.querySelector('[data-id="0.0"]'), rect(100, 0, 200, 50))
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.0"]'),
      rect(100, 400, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.1"]'),
      rect(100, 500, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9"]'),
      rect(100, 400, 200, 200),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 700))

    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.9.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 450 },
      repeatedNodes: [],
      asCopy: false,
    })!
    // Hover above the first child: element lands first in the new parent
    state.lastCursorPosition = { x: 200, y: 95 }
    dragInsertMove('drag', state, [state.element, state.initialContainer])
    const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
    expect(selected?.parent.getAttribute('data-id')).toBe('0.1')
    expect(selected?.index).toBe(0)

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      let replaced: DragInsertState | null | undefined
      trackHoverTarget(
        state,
        (next) => {
          replaced = next
        },
        { stillMs: 5, blinkMs: 10 },
      )
      await new Promise((resolve) => setTimeout(resolve, 150))
      const next = replaced!
      expect(next.trueOrigin).toBeDefined()
      // Release without any further move: still a real move (new parent)
      await handleDragEnded({}, next, null)
      const moved = posted.find((m) => m.type === 'nodeMoved')
      expect(moved).toBeDefined()
      expect(moved.parent).toBe('0.1')
      expect(moved.index).toBe(0)
      next.destroying = true
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })

  test('releasing unmoved without a hover still cancels', async () => {
    setup()
    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      const state = dragInsertStarted({
        action: 'drag',
        element: document.querySelector('[data-id="0.9.0"]') as HTMLElement,
        lastCursorPosition: { x: 200, y: 450 },
        repeatedNodes: [],
        asCopy: false,
      })!
      await handleDragEnded({}, state, null)
      expect(posted.find((m) => m.type === 'nodeMoved')).toBeUndefined()
      expect(childIds('0.9')).toEqual(['0.9.0', '0.9.1'])
      state.destroying = true
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })

  test('hover then reorder within the new parent commits the new index', async () => {
    setup()
    const state = startHoverDrag()
    let replaced: DragInsertState | null | undefined
    trackHoverTarget(
      state,
      (next) => {
        replaced = next
      },
      { stillMs: 5, blinkMs: 10 },
    )
    await new Promise((resolve) => setTimeout(resolve, 150))
    const next = replaced!
    expect(childIds('0.1')).toEqual(['0.1.0', '0.9.0'])

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      // Move back above the first child inside the new parent
      next.reorderPermutations = [
        {
          nextSibling: document.querySelector('[data-id="0.1.0"]'),
          rect: rect(100, 100, 200, 100) as unknown as DOMRect,
        },
        {
          nextSibling: null,
          rect: rect(100, 210, 200, 100) as unknown as DOMRect,
        },
      ]
      handleDragMouseMove({ x: 200, y: 120 }, next, false)
      expect(childIds('0.1')).toEqual(['0.9.0', '0.1.0'])
      await handleDragEnded({}, next, null)
      const moved = posted.find((m) => m.type === 'nodeMoved')
      expect(moved).toBeDefined()
      expect(moved.parent).toBe('0.1')
      expect(moved.index).toBe(0)
      next.destroying = true
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })

  test('hover into a flex single-child container applies styles and posts flex-direction on drop', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">only</div></div><div data-id="0.9" data-node-id="9"><div data-id="0.9.0" data-node-id="10">dragme</div><div data-id="0.9.1" data-node-id="11">stay</div></div></div>'
    const flexParent = document.querySelector('[data-id="0.1"]') as HTMLElement
    flexParent.style.setProperty('display', 'flex')
    flexParent.style.setProperty('flex-direction', 'row')
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(flexParent, rect(100, 100, 200, 100))
    stubRect(
      document.querySelector('[data-id="0.9.0"]'),
      rect(100, 400, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.1"]'),
      rect(100, 500, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9"]'),
      rect(100, 400, 200, 200),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.9.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 450 },
      repeatedNodes: [],
      asCopy: false,
    })!
    // Hover above the child: target has flex-direction: column
    state.lastCursorPosition = { x: 200, y: 95 }
    dragInsertMove('drag', state, [state.element, state.initialContainer])
    const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
    expect(selected?.parent.getAttribute('data-id')).toBe('0.1')
    expect(selected?.['flex-direction']).toBe('column')

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      let replaced: DragInsertState | null | undefined
      trackHoverTarget(
        state,
        (next) => {
          replaced = next
        },
        { stillMs: 5, blinkMs: 10 },
      )
      await new Promise((resolve) => setTimeout(resolve, 150))
      const next = replaced!
      expect(flexParent.style.getPropertyValue('flex-direction')).toBe('column')
      await handleDragEnded({}, next, null)
      const moved = posted.find((m) => m.type === 'nodeMoved')
      expect(moved).toBeDefined()
      expect(moved.parent).toBe('0.1')
      expect(moved['flex-direction']).toBe('column')
      next.destroying = true
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })

  test('hover then drop at the end of a container correctly resolves index without NaN', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">first</div><div data-id="0.1.1" data-node-id="3">second</div></div><div data-id="0.9" data-node-id="9"><div data-id="0.9.0" data-node-id="10">dragme</div><div data-id="0.9.1" data-node-id="11">stay</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(100, 200, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 200),
    )
    stubRect(
      document.querySelector('[data-id="0.9.0"]'),
      rect(100, 400, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.1"]'),
      rect(100, 500, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9"]'),
      rect(100, 400, 200, 200),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.9.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 450 },
      repeatedNodes: [],
      asCopy: false,
    })!
    // Hover below the second child: after the end of container 0.1
    state.lastCursorPosition = { x: 200, y: 305 }
    dragInsertMove('drag', state, [state.element, state.initialContainer])
    const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
    expect(selected?.parent.getAttribute('data-id')).toBe('0.1')
    expect(selected?.index).toBe(2)

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      let replaced: DragInsertState | null | undefined
      trackHoverTarget(
        state,
        (next) => {
          replaced = next
        },
        { stillMs: 5, blinkMs: 10 },
      )
      await new Promise((resolve) => setTimeout(resolve, 150))
      const next = replaced!
      expect(next.element.nextElementSibling).toBeNull()
      await handleDragEnded({}, next, null)
      const moved = posted.find((m) => m.type === 'nodeMoved')
      expect(moved).toBeDefined()
      expect(moved.parent).toBe('0.1')
      expect(moved.index).toBe(2)
      expect(Number.isNaN(moved.index)).toBe(false)
      next.destroying = true
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })

  test('inner container preserves its before and after drop lines without outer container swallowing them', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2"><div data-id="0.1.0.0" data-node-id="3">c1</div><div data-id="0.1.0.1" data-node-id="4">c2</div></div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0.0"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.0.1"]'),
      rect(100, 200, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 200),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 200),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const inner = document.querySelector('[data-id="0.1.0"]')!
    const areas = getInsertAreas().filter((a) => a.parent === inner)
    expect(areas.length).toBeGreaterThanOrEqual(3)
    const beforeFirst = areas.find((a) => a.index === 0 && a.direction === -1)
    expect(beforeFirst).toBeDefined()
    expect(beforeFirst?.parent).toBe(inner)
  })

  test('slot outlet with placeholder does not auto-enter move mode and optimistically replaces placeholder on drop', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2" data-node-slot-name="content">ph</div></div><div data-id="0.9" data-node-id="9"><div data-id="0.9.0" data-node-id="10">dragme</div><div data-id="0.9.1" data-node-id="11">stay</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.0"]'),
      rect(100, 400, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9.1"]'),
      rect(100, 500, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.9"]'),
      rect(100, 400, 200, 200),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const state = dragInsertStarted({
      action: 'drag',
      element: document.querySelector('[data-id="0.9.0"]') as HTMLElement,
      lastCursorPosition: { x: 200, y: 450 },
      repeatedNodes: [],
      asCopy: false,
    })!
    state.lastCursorPosition = { x: 200, y: 150 }
    dragInsertMove('drag', state, [state.element, state.initialContainer])
    const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
    expect(selected?.parent.getAttribute('data-id')).toBe('0.1')
    expect(selected?.slot).toBe('content')
    expect(selected?.slotPlaceholder).toBe(true)

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }
    try {
      let replaced: DragInsertState | null | undefined
      trackHoverTarget(
        state,
        (next) => {
          replaced = next
        },
        { stillMs: 5, blinkMs: 10 },
      )
      await new Promise((resolve) => setTimeout(resolve, 150))
      expect(replaced).toBeUndefined()
      expect(state.hover).toBeUndefined()

      await handleDragEnded({}, state, null)
      const moved = posted.find((m) => m.type === 'nodeMoved')
      expect(moved).toBeDefined()
      expect(moved.parent).toBe('0.1')
      expect(moved.slot).toBe('content')
      // Placeholder content is optimistically replaced
      expect(document.querySelector('[data-id="0.1.0"]')).toBeNull()
      expect(
        document.querySelector('[data-id="0.1"]')?.contains(state.element),
      ).toBe(true)
      state.destroying = true
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })
})

describe('applyDropParentStyles', () => {
  const gridArea = (parent: Element, extra: object = {}) => ({
    layout: 'block' as const,
    parent,
    indexAll: 0,
    index: 0,
    center: { x: 0, y: 0 },
    size: 10,
    direction: 1 as const,
    bounds: { x: 0, y: 0, width: 10, height: 10 },
    'justify-content': 'center',
    'align-items': 'flex-start',
    ...extra,
  })

  test('block parent becomes flex with the emitted props', () => {
    const parent = document.createElement('div')
    document.body.append(parent)
    applyDropParentStyles(parent, gridArea(parent))
    expect(parent.style.getPropertyValue('display')).toBe('flex')
    expect(parent.style.getPropertyValue('justify-content')).toBe('center')
    expect(parent.style.getPropertyValue('align-items')).toBe('flex-start')
  })

  test('already-flex parent keeps its display and gains direction', () => {
    const parent = document.createElement('div')
    parent.style.setProperty('display', 'flex')
    document.body.append(parent)
    applyDropParentStyles(
      parent,
      gridArea(parent, { 'flex-direction': 'column' as const }),
    )
    expect(parent.style.getPropertyValue('display')).toBe('flex')
    expect(parent.style.getPropertyValue('flex-direction')).toBe('column')
  })

  test('areas without style props leave the parent untouched', () => {
    const parent = document.createElement('div')
    document.body.append(parent)
    applyDropParentStyles(
      parent,
      gridArea(parent, {
        'justify-content': undefined,
        'align-items': undefined,
      }),
    )
    expect(parent.getAttribute('style')).toBeNull()
  })
})

describe('slot outlet drop-zone', () => {
  test('placeholder content gets a single zone covering it, not lines', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2" data-node-slot-name="foo">ph</div><div data-id="0.1.1" data-node-id="3">b</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(100, 150, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 150),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    const zoned = areas.filter((a) => a.slot === 'foo')
    expect(zoned).toHaveLength(1)
    expect(zoned[0].bounds).toEqual({ x: 100, y: 100, width: 200, height: 50 })
    expect(zoned[0].index).toBe(0)
    expect(zoned[0].indexAll).toBe(0)
    expect(dropStyleProps(zoned[0])).toEqual({})
  })

  test('zone covers the union of multiple placeholders', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.2" data-node-id="4"><div data-id="0.2.0" data-node-id="5" data-node-slot-name="foo">a</div><div data-id="0.2.1" data-node-id="6" data-node-slot-name="foo">b</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.2.0"]'),
      rect(100, 100, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.2.1"]'),
      rect(100, 150, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.2"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.2"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(1)
    expect(areas[0].bounds).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    })
    expect(areas[0].slot).toBe('foo')
    expect(areas[0].index).toBe(0)
    expect(dropStyleProps(areas[0])).toEqual({})
  })

  test('provided slot content keeps generic lines', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.3" data-node-id="7"><div data-id="0.3.0[foo]" data-node-id="8">real</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.3.0[foo]"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.3"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.3"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(2)
    expect(areas.every((a) => a.bounds === undefined)).toBe(true)
    expect(areas.every((a) => a.slot === 'foo')).toBe(true)
    expect(areas.map((a) => a.index)).toEqual([0, 1])
    expect(dropStyleProps(areas[0])).toEqual({})
    expect(dropStyleProps(areas[1])).toEqual({})
  })

  test('collapsed placeholder keeps a hittable fallback zone', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.4" data-node-id="9"><div data-id="0.4.0" data-node-id="10" data-node-slot-name="foo"></div></div></div>'
    stubRect(document.querySelector('[data-id="0.4.0"]'), rect(100, 100, 0, 0))
    stubRect(document.querySelector('[data-id="0.4"]'), rect(100, 100, 0, 0))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.4"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(1)
    expect(areas[0].bounds).toEqual({ x: 70, y: 70, width: 60, height: 60 })
    expect(areas[0].slot).toBe('foo')
    expect(dropStyleProps(areas[0])).toEqual({})
  })

  test('sole placeholder of a flex parent gets a zone, not flex lines', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.5" data-node-id="11"><div data-id="0.5.0" data-node-id="12" data-node-slot-name="foo">ph</div></div></div>'
    const flexParent = document.querySelector('[data-id="0.5"]') as HTMLElement
    flexParent.style.setProperty('display', 'flex')
    stubRect(
      document.querySelector('[data-id="0.5.0"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.5"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.5"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(1)
    expect(areas[0].bounds).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    })
    expect(areas[0].slot).toBe('foo')
    expect(areas.every((a) => a['flex-direction'] === undefined)).toBe(true)
    expect(dropStyleProps(areas[0])).toEqual({})
  })

  test('component with a placeholder slot gets no whole-component zone', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.6" data-node-id="root" data-has-slots-elements="true" data-fallback-slot-name="default"><div data-id="0.6.0.0" data-node-id="21" data-node-slot-name="foo" data-component="Card">ph</div></div></div>'
    const root = document.querySelector('[data-id="0.6"]')!
    stubRect(
      document.querySelector('[data-id="0.6.0.0"]'),
      rect(100, 100, 200, 50),
    )
    stubRect(root, rect(100, 100, 200, 150))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const areas = getInsertAreas().filter((a) => a.parent === root)
    expect(areas).toHaveLength(1)
    expect(areas[0].slot).toBe('foo')
    expect(areas[0].slotPlaceholder).toBe(true)
    expect(areas[0].bounds).toEqual({ x: 100, y: 100, width: 200, height: 50 })
  })

  test('placeholders nested in a wrapper still get per-slot zones, no whole-component zone', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.61" data-node-id="root" data-has-slots-elements="true" data-fallback-slot-name="default"><div data-id="0.61.0" data-node-id="40" data-component="Card"><div data-id="0.61.0.0.0" data-node-id="41" data-node-slot-name="default" data-component="Card">a</div><div data-id="0.61.0.1.0" data-node-id="42" data-node-slot-name="header" data-component="Card">b</div></div></div></div>'
    const root = document.querySelector('[data-id="0.61"]')!
    const wrap = document.querySelector('[data-id="0.61.0"]')!
    stubRect(
      document.querySelector('[data-id="0.61.0.0.0"]'),
      rect(100, 100, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.61.0.1.0"]'),
      rect(100, 150, 200, 50),
    )
    stubRect(wrap, rect(100, 100, 200, 100))
    stubRect(root, rect(100, 100, 200, 100))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const zones = getInsertAreas().filter(
      (a) => a.bounds !== undefined && a.slotPlaceholder,
    )
    expect(
      zones.map((a) => [(a.parent as Element).getAttribute('data-id'), a.slot]),
    ).toEqual([
      ['0.61.0', 'default'],
      ['0.61.0', 'header'],
    ])
    expect(zones[0].bounds).toEqual({ x: 100, y: 100, width: 200, height: 50 })
    expect(zones[1].bounds).toEqual({ x: 100, y: 150, width: 200, height: 50 })
  })

  test('same-name outlets get one overlay each, all lit on hover', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.62" data-node-id="root" data-has-slots-elements="true" data-fallback-slot-name="content"><div data-id="0.62.0.0" data-node-id="43" data-node-slot-name="content" data-component="C"></div><div data-id="0.62.0.1" data-node-id="44" data-node-slot-name="content" data-component="C"></div><div data-id="0.62.1.0" data-node-id="45" data-node-slot-name="content" data-component="C"></div><div data-id="0.62.1.1" data-node-id="46" data-node-slot-name="content" data-component="C"></div></div></div>'
    const root = document.querySelector('[data-id="0.62"]')!
    stubRect(
      document.querySelector('[data-id="0.62.0.0"]'),
      rect(100, 100, 200, 40),
    )
    stubRect(
      document.querySelector('[data-id="0.62.0.1"]'),
      rect(100, 140, 200, 40),
    )
    stubRect(
      document.querySelector('[data-id="0.62.1.0"]'),
      rect(100, 220, 200, 40),
    )
    stubRect(
      document.querySelector('[data-id="0.62.1.1"]'),
      rect(100, 260, 200, 40),
    )
    stubRect(root, rect(100, 100, 200, 200))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const zones = getInsertAreas().filter(
      (a) => a.parent === root && a.slot === 'content',
    )
    expect(zones).toHaveLength(2)
    expect(zones[0].bounds).toEqual({ x: 100, y: 100, width: 200, height: 80 })
    expect(zones[0].indexAll).toBe(0)
    expect(zones[1].bounds).toEqual({ x: 100, y: 220, width: 200, height: 80 })
    expect(zones[1].indexAll).toBe(2)

    const makeState = (x: number, y: number): DragInsertState => ({
      mode: 'insert',
      action: 'insert',
      elementType: 'element',
      element: document.createElement('div'),
      repeatedNodes: [],
      offset: { x: 0, y: 0 },
      lastCursorPosition: { x, y },
      initialContainer: root as HTMLElement,
      initialNextSibling: null,
      initialRect: { width: 10, height: 10 } as unknown as DOMRect,
      reorderPermutations: [],
      flipAnimations: [],
      isSoleChildDrag: false,
      destroying: false,
    })
    // Hovering an outlet selects its own zone but renders both overlays.
    const overFirst = makeState(200, 120)
    dragInsertMove('insert', overFirst, [overFirst.element])
    expect(
      overFirst.insertAreas?.[overFirst.selectedInsertAreaIndex ?? -1]?.bounds,
    ).toEqual({ x: 100, y: 100, width: 200, height: 80 })
    expect(document.querySelectorAll('.__drop-area-grid')).toHaveLength(2)
    overFirst.destroying = true

    const overSecond = makeState(200, 240)
    dragInsertMove('insert', overSecond, [overSecond.element])
    expect(
      overSecond.insertAreas?.[overSecond.selectedInsertAreaIndex ?? -1]
        ?.bounds,
    ).toEqual({ x: 100, y: 220, width: 200, height: 80 })
    expect(document.querySelectorAll('.__drop-area-grid')).toHaveLength(2)
    overSecond.destroying = true
  })

  test('nested slot zone stays inside the surrounding outer zone', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.63" data-node-id="50"><div data-id="0.63.0.0" data-node-id="51" data-node-slot-name="slot 1">a</div><div data-id="0.63.0.1" data-node-id="52" data-node-slot-name="slot 1">b</div><div data-id="0.63.0.2.0" data-node-id="53" data-node-slot-name="slot 1-1" data-node-slot-ancestors=\'["slot 1"]\'>c</div></div></div>'
    const root = document.querySelector('[data-id="0.63"]')!
    stubRect(
      document.querySelector('[data-id="0.63.0.0"]'),
      rect(100, 100, 200, 40),
    )
    stubRect(
      document.querySelector('[data-id="0.63.0.1"]'),
      rect(100, 140, 200, 40),
    )
    stubRect(
      document.querySelector('[data-id="0.63.0.2.0"]'),
      rect(100, 180, 200, 40),
    )
    stubRect(root, rect(100, 100, 200, 120))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const outer = getInsertAreas().find(
      (a) => a.parent === root && a.slot === 'slot 1',
    )
    expect(outer?.bounds).toEqual({ x: 100, y: 100, width: 200, height: 120 })
    const inner = getInsertAreas().find(
      (a) => a.parent === root && a.slot === 'slot 1-1',
    )
    expect(inner?.bounds).toEqual({ x: 100, y: 180, width: 200, height: 40 })
  })

  test('component without placeholders becomes a whole-component default zone', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.7" data-node-id="root" data-has-slots-elements="true" data-fallback-slot-name="default"></div></div>'
    const root = document.querySelector('[data-id="0.7"]')!
    stubRect(root, rect(100, 100, 200, 100))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const areas = getInsertAreas().filter((a) => a.parent === root)
    expect(areas).toHaveLength(1)
    expect(areas[0].slot).toBe('default')
    expect(areas[0].slotPlaceholder).toBe(true)
    expect(areas[0].bounds).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    })
  })

  test('component without placeholders or default slot targets the first slot', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.8" data-node-id="root" data-has-slots-elements="true" data-fallback-slot-name="header"></div></div>'
    const root = document.querySelector('[data-id="0.8"]')!
    stubRect(root, rect(100, 100, 200, 100))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const areas = getInsertAreas().filter((a) => a.parent === root)
    expect(areas).toHaveLength(1)
    expect(areas[0].slot).toBe('header')
    expect(areas[0].slotPlaceholder).toBe(true)
  })

  test('component with only provided content keeps lines, no whole-component zone', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.9" data-node-id="root" data-has-slots-elements="true" data-fallback-slot-name="default"><div data-id="0.9.0[content]" data-node-id="31">real</div></div></div>'
    const root = document.querySelector('[data-id="0.9"]')!
    stubRect(
      document.querySelector('[data-id="0.9.0[content]"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(root, rect(100, 100, 200, 100))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const areas = getInsertAreas().filter((a) => a.parent === root)
    expect(areas.every((a) => a.bounds === undefined)).toBe(true)
    expect(areas.length).toBeGreaterThan(0)
  })
})

describe('empty element grid', () => {
  test('flex parent emits 9 cells carrying justify-content/align-items', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"></div></div>'
    const flexParent = document.querySelector('[data-id="0.1"]') as HTMLElement
    flexParent.style.setProperty('display', 'flex')
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 300, 300),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const grid = getInsertAreas().filter((a) => a.parent === parent)
    expect(grid).toHaveLength(9)
    expect(grid[0]['justify-content']).toBe('flex-start')
    expect(grid[0]['align-items']).toBe('flex-start')
    expect(grid[4]['justify-content']).toBe('center')
    expect(grid[4]['align-items']).toBe('center')
    expect(grid[8]['justify-content']).toBe('flex-end')
    expect(grid[8]['align-items']).toBe('flex-end')
    // Row-oriented mapping: every cell carries the direction the
    // optimistic preview assumes, so the event persists it
    expect(grid.every((cell) => cell['flex-direction'] === 'row')).toBe(true)
  })

  test('non-flex empty parent emits a single container-sized area', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 300, 300),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(1)
    expect(areas[0].bounds).toEqual({ x: 100, y: 100, width: 300, height: 300 })
    expect(areas[0].index).toBe(0)
    expect(dropStyleProps(areas[0])).toEqual({})
  })

  test('empty App always emits a single full-size area, never the grid', () => {
    document.body.innerHTML = '<div id="App"></div>'
    const app = document.getElementById('App') as HTMLElement
    // App is always flex, but not an editable target: no 3x3 grid
    app.style.setProperty('display', 'flex')
    stubRect(app, rect(0, 0, 800, 600))

    const areas = getInsertAreas().filter((a) => a.parent === app)
    expect(areas).toHaveLength(1)
    expect(areas[0].bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 })
    expect(areas[0].index).toBe(0)
    expect(dropStyleProps(areas[0])).toEqual({})
  })

  test('flex parent smaller than 58px gets a single area instead of the grid', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"></div></div>'
    const flexParent = document.querySelector('[data-id="0.1"]') as HTMLElement
    flexParent.style.setProperty('display', 'flex')
    stubRect(document.querySelector('[data-id="0.1"]'), rect(100, 100, 200, 20))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(1)
    // Maximum the box: no 60px inflation overflow
    expect(areas[0].bounds).toEqual({ x: 100, y: 100, width: 200, height: 20 })
    expect(areas[0].index).toBe(0)
    expect(dropStyleProps(areas[0])).toEqual({})
  })

  test('58px flex parent still gets the 9-cell grid, 57px does not', () => {
    const setup = (size: number) => {
      document.body.innerHTML =
        '<div id="App"><div data-id="0.1" data-node-id="1"></div></div>'
      const flexParent = document.querySelector(
        '[data-id="0.1"]',
      ) as HTMLElement
      flexParent.style.setProperty('display', 'flex')
      stubRect(
        document.querySelector('[data-id="0.1"]'),
        rect(100, 100, size, size),
      )
      stubRect(document.getElementById('App'), rect(0, 0, 800, 600))
      return document.querySelector('[data-id="0.1"]')!
    }

    const parent58 = setup(58)
    const grid58 = getInsertAreas().filter((a) => a.parent === parent58)
    expect(grid58).toHaveLength(9)
    // Cells never overflow the box
    expect(
      grid58.every(
        (cell) =>
          cell.bounds!.x >= 100 &&
          cell.bounds!.y >= 100 &&
          cell.bounds!.x + cell.bounds!.width <= 158 &&
          cell.bounds!.y + cell.bounds!.height <= 158,
      ),
    ).toBe(true)
    const parent57 = setup(57)
    const small = getInsertAreas().filter((a) => a.parent === parent57)
    expect(small).toHaveLength(1)
    expect(small[0].bounds).toEqual({ x: 100, y: 100, width: 57, height: 57 })
    expect(dropStyleProps(small[0])).toEqual({})
  })

  test('collapsed empty keeps a hittable fallback area', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"></div></div>'
    const flexParent = document.querySelector('[data-id="0.1"]') as HTMLElement
    flexParent.style.setProperty('display', 'flex')
    stubRect(document.querySelector('[data-id="0.1"]'), rect(100, 100, 0, 0))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const parent = document.querySelector('[data-id="0.1"]')!
    const areas = getInsertAreas().filter((a) => a.parent === parent)
    expect(areas).toHaveLength(1)
    expect(areas[0].bounds).toEqual({ x: 70, y: 70, width: 60, height: 60 })
    expect(areas[0].index).toBe(0)
    expect(dropStyleProps(areas[0])).toEqual({})
  })
})

describe('viewport overscan', () => {
  test('skips far-offscreen elements', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1">near</div><div data-id="0.2" data-node-id="2">far</div></div>'
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.2"]'),
      rect(5000, 5000, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const areas = getInsertAreas()
    const app = document.getElementById('App')!
    // The far element contributes no areas positioned at itself ...
    expect(
      areas.filter((a) => a.center.x > 4000 || a.center.y > 4000),
    ).toBeEmpty()
    // ... while the near element still yields its App-level before-line
    expect(areas.some((a) => a.parent === app && a.center.y === 100)).toBe(true)
  })
})

describe('snap distance', () => {
  test('a cursor far from every line clears selection and highlight', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">only</div></div></div><div id="drag">d</div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(110, 110, 180, 80),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))
    const dragEl = document.getElementById('drag') as HTMLElement
    expect(MAX_SNAP_DISTANCE_PX).toBeGreaterThan(0)

    const state: DragInsertState = {
      mode: 'insert',
      action: 'insert',
      elementType: 'element',
      element: dragEl,
      repeatedNodes: [],
      offset: { x: 0, y: 0 },
      lastCursorPosition: { x: 700, y: 550 },
      initialContainer: document.getElementById('App') as HTMLElement,
      initialNextSibling: null,
      initialRect: { width: 50, height: 20 } as unknown as DOMRect,
      reorderPermutations: [],
      flipAnimations: [],
      isSoleChildDrag: false,
      destroying: false,
    }
    dragInsertMove('insert', state, [dragEl])
    await nextFrame()
    expect(state.selectedInsertAreaIndex).toBeUndefined()
    expect(document.querySelectorAll('.__drop-area-line')).toBeEmpty()
    expect(document.querySelectorAll('.__drop-area-grid')).toBeEmpty()
    state.destroying = true
  })
})

describe('whitespace-safe drop index', () => {
  test('dropping after the last child lands last despite text nodes', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.9" data-node-id="9">x</div>   <div data-id="0.1" data-node-id="1">a</div></div><div id="drag">d</div>'
    stubRect(
      document.querySelector('[data-id="0.9"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 200, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))
    const dragEl = document.getElementById('drag') as HTMLElement
    stubRect(dragEl, rect(0, 0, 50, 20))

    const state: DragInsertState = {
      mode: 'insert',
      action: 'insert',
      elementType: 'element',
      element: dragEl,
      repeatedNodes: [],
      offset: { x: 0, y: 0 },
      lastCursorPosition: { x: 200, y: 310 },
      initialContainer: document.getElementById('App') as HTMLElement,
      initialNextSibling: null,
      initialRect: { width: 50, height: 20 } as unknown as DOMRect,
      reorderPermutations: [],
      flipAnimations: [],
      isSoleChildDrag: false,
      destroying: false,
    }
    dragInsertMove('insert', state, [dragEl])
    await dragInsertEnded(state, false)
    expect(
      Array.from(document.getElementById('App')!.children).map(
        (e) => e.getAttribute('data-id') ?? 'drag',
      ),
    ).toEqual(['0.9', '0.1', 'drag'])
  })

  test('inserting a new node transitions from cursor position', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1">a</div></div>'
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 100),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))
    const newEl = document.createElement('div')
    stubRect(newEl, rect(0, 0, 40, 40))

    const state: DragInsertState = {
      mode: 'insert',
      action: 'insert',
      elementType: 'element',
      element: newEl,
      repeatedNodes: [],
      offset: { x: 20, y: 20 },
      lastCursorPosition: { x: 200, y: 300 },
      initialContainer: document.getElementById('App') as HTMLElement,
      initialNextSibling: null,
      initialRect: { width: 40, height: 40 } as unknown as DOMRect,
      reorderPermutations: [],
      flipAnimations: [],
      isSoleChildDrag: false,
      destroying: false,
    }
    dragInsertMove('insert', state, [newEl])

    let capturedTranslateBeforeRestore = ''
    const origStart = (document as any).startViewTransition
    ;(document as any).startViewTransition = (cb: () => void) => {
      capturedTranslateBeforeRestore = newEl.style.getPropertyValue('translate')
      cb()
      return { finished: Promise.resolve() }
    }
    try {
      await dragInsertEnded(state, false)
      expect(capturedTranslateBeforeRestore).toBe('180px 280px')
      expect(newEl.style.getPropertyValue('--drag-mode--move-opacity')).toBe('')
    } finally {
      ;(document as any).startViewTransition = origStart
    }
  })

  test('optimistic insert on after-line of repeated items inserts after the last repeat item', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">repeat 0</div><div data-id="0.1.0(0)" data-node-id="2">repeat 1</div><div data-id="0.1.0(1)" data-node-id="2">repeat 2</div><div data-id="0.1.1" data-node-id="3">sibling B</div></div></div>'
    stubRect(
      document.querySelector('[data-id="0.1.0"]'),
      rect(100, 100, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.1.0(0)"]'),
      rect(100, 150, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.1.0(1)"]'),
      rect(100, 200, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.1.1"]'),
      rect(100, 260, 200, 50),
    )
    stubRect(
      document.querySelector('[data-id="0.1"]'),
      rect(100, 100, 200, 210),
    )
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const newEl = document.createElement('div')
    newEl.setAttribute('data-id', 'new-item')
    stubRect(newEl, rect(0, 0, 40, 40))

    const state: DragInsertState = {
      mode: 'insert',
      action: 'insert',
      elementType: 'element',
      element: newEl,
      repeatedNodes: [],
      offset: { x: 20, y: 20 },
      lastCursorPosition: { x: 200, y: 255 },
      initialContainer: document.getElementById('App') as HTMLElement,
      initialNextSibling: null,
      initialRect: { width: 40, height: 40 } as unknown as DOMRect,
      reorderPermutations: [],
      flipAnimations: [],
      isSoleChildDrag: false,
      destroying: false,
    }
    dragInsertMove('insert', state, [newEl])
    const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
    expect(selected).toBeDefined()
    expect(selected?.direction).toBe(1)

    await dragInsertEnded(state, false)
    const container = document.querySelector('[data-id="0.1"]')!
    expect(
      Array.from(container.children).map((e) => e.getAttribute('data-id')),
    ).toEqual(['0.1.0', '0.1.0(0)', '0.1.0(1)', 'new-item', '0.1.1'])
  })
})

describe('coincident line tie-break', () => {
  test('keeps document order on exact ties (outer container wins)', () => {
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    outer.appendChild(inner)
    document.body.appendChild(outer)
    const segment = {
      x1: 0,
      y1: 100,
      x2: 200,
      y2: 100,
      slotName: null,
      index: 0,
      direction: 1 as const,
    }
    const { nearestLines } = findNearestLine(
      [
        { ...segment, parent: outer },
        { ...segment, parent: inner },
      ],
      { x: 50, y: 120 },
    )
    expect(nearestLines).toHaveLength(1)
    expect(nearestLines[0].parent).toBe(outer)
  })
})

describe('interruptible reorder glide', () => {
  const liveStackedRects = (container: HTMLElement) => {
    for (const child of Array.from(container.children)) {
      child.getBoundingClientRect = () =>
        rect(
          100,
          100 + Array.from(container.children).indexOf(child) * 110,
          200,
          100,
        ) as unknown as DOMRect
    }
  }

  const installAnimateSpy = () => {
    const calls: { cancelled: boolean }[] = []
    const proto = Element.prototype as unknown as Record<string, unknown>
    const previous = proto.animate
    proto.animate = function () {
      const record = { cancelled: false }
      calls.push(record)
      return {
        cancel() {
          record.cancelled = true
        },
        finished: Promise.resolve(),
      }
    }
    return {
      calls,
      restore() {
        if (previous === undefined) {
          delete proto.animate
        } else {
          proto.animate = previous
        }
      },
    }
  }

  const slot = (nextSibling: Node | null, top: number) => ({
    nextSibling,
    rect: rect(100, top, 200, 100) as unknown as DOMRect,
  })

  test('a new order applies instantly and cancels the in-flight glide', () => {
    const spy = installAnimateSpy()
    try {
      document.body.innerHTML =
        '<div id="App"><div data-id="0.1" data-node-id="1">a</div><div data-id="0.2" data-node-id="2">b</div><div data-id="0.3" data-node-id="3">c</div></div>'
      const app = document.getElementById('App')!
      liveStackedRects(app)
      const [a, b, c] = Array.from(app.children)
      const state = dragInsertStarted({
        action: 'drag',
        element: a as HTMLElement,
        lastCursorPosition: { x: 200, y: 150 },
        repeatedNodes: [],
        asCopy: false,
      })!
      state.reorderPermutations = [slot(b, 100), slot(c, 210), slot(null, 320)]

      state.lastCursorPosition = { x: 200, y: 340 }
      dragReorder(state)
      expect(Array.from(app.children).map((e) => e.textContent)).toEqual([
        'b',
        'c',
        'a',
      ])
      expect(state.flipAnimations).toHaveLength(2)
      expect(spy.calls).toHaveLength(2)

      // Second order mid-flight: previous glide cancelled, new one stored
      state.lastCursorPosition = { x: 200, y: 110 }
      dragReorder(state)
      expect(Array.from(app.children).map((e) => e.textContent)).toEqual([
        'a',
        'b',
        'c',
      ])
      expect(spy.calls.filter((call) => call.cancelled)).toHaveLength(2)
      expect(state.flipAnimations).toHaveLength(2)

      // Cursor where the element already is: no-op, no new animations
      const created = spy.calls.length
      dragReorder(state)
      expect(spy.calls).toHaveLength(created)
      state.destroying = true
    } finally {
      spy.restore()
    }
  })

  test('dragged element can be moved to another position and back to its origin position', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1">a</div><div data-id="0.2" data-node-id="2">b</div><div data-id="0.3" data-node-id="3">c</div></div>'
    const app = document.getElementById('App')!
    const [a, b, c] = Array.from(app.children) as HTMLElement[]
    const state = dragInsertStarted({
      action: 'drag',
      element: a,
      lastCursorPosition: { x: 200, y: 150 },
      repeatedNodes: [],
      asCopy: false,
    })!
    state.reorderPermutations = [
      slot(a, 100),
      slot(b, 100),
      slot(c, 210),
      slot(null, 320),
    ]

    state.lastCursorPosition = { x: 200, y: 220 }
    dragReorder(state)
    expect(Array.from(app.children).map((e) => e.textContent)).toEqual([
      'b',
      'a',
      'c',
    ])

    state.lastCursorPosition = { x: 200, y: 110 }
    dragReorder(state)
    expect(Array.from(app.children).map((e) => e.textContent)).toEqual([
      'a',
      'b',
      'c',
    ])

    state.destroying = true
  })
})

describe('reorder permutation probing', () => {
  test('measures without disturbing the dragged element', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1">a</div><div data-id="0.2" data-node-id="2">b</div></div>'
    const app = document.getElementById('App')!
    const el = document.querySelector('[data-id="0.1"]') as HTMLElement
    const orderBefore = Array.from(app.children)

    const state = dragInsertStarted({
      action: 'drag',
      element: el,
      lastCursorPosition: { x: 0, y: 0 },
      repeatedNodes: [],
      asCopy: false,
    })!

    expect(state.reorderPermutations.length).toBeGreaterThan(0)
    expect(Array.from(app.children)).toEqual(orderBefore)
    expect(app.children[0]).toBe(el)
    state.destroying = true
  })

  test('restores a pre-existing inline display on the dragged element', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1" style="display: flex;">a</div><div data-id="0.2" data-node-id="2">b</div></div>'
    const el = document.querySelector('[data-id="0.1"]') as HTMLElement
    expect(el.style.getPropertyValue('display')).toBe('flex')
    const state = dragInsertStarted({
      action: 'drag',
      element: el,
      lastCursorPosition: { x: 0, y: 0 },
      repeatedNodes: [],
      asCopy: false,
    })!
    // Probing must leave the element exactly as it found it
    expect(el.style.getPropertyValue('display')).toBe('flex')
    expect(state.reorderPermutations.length).toBeGreaterThan(0)
    state.destroying = true
  })

  test('repeat stack rotation is deterministic', () => {
    const makeNode = () => {
      const node = document.createElement('div')
      stubRect(node, rect(0, 0, 10, 10))
      return node as HTMLElement
    }
    const run = () => {
      document.body.innerHTML =
        '<div id="App"><div data-id="0.1" data-node-id="1">a</div></div>'
      const state = dragInsertStarted({
        action: 'drag',
        element: document.querySelector('[data-id="0.1"]') as HTMLElement,
        lastCursorPosition: { x: 0, y: 0 },
        repeatedNodes: [makeNode(), makeNode(), makeNode()],
        asCopy: false,
      })!
      const rotations = state.repeatedNodes.map((node) =>
        node.style.getPropertyValue('--drag-repeat-node-rotate'),
      )
      state.destroying = true
      return rotations
    }
    expect(run()).toEqual(run())
  })
})

describe('handleInsertEnded', () => {
  test('sends insertNode and selection post messages for newly inserted node', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">child</div></div></div>'
    const parent = document.querySelector('[data-id="0.1"]') as HTMLElement
    const newEl = document.createElement('div')

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }

    try {
      const state: DragInsertState = {
        mode: 'insert',
        action: 'insert',
        elementType: 'element',
        element: newEl,
        repeatedNodes: [],
        offset: { x: 0, y: 0 },
        lastCursorPosition: { x: 100, y: 100 },
        initialContainer: parent,
        initialNextSibling: null,
        initialRect: { width: 50, height: 20 } as unknown as DOMRect,
        reorderPermutations: [],
        flipAnimations: [],
        isSoleChildDrag: false,
        destroying: false,
        selectedInsertAreaIndex: 0,
        insertAreas: [
          {
            layout: 'block',
            parent,
            indexAll: 1,
            index: 1,
            slot: 'content',
            center: { x: 100, y: 100 },
            size: 50,
            direction: 1,
          },
        ],
      }

      await handleInsertEnded({}, state)

      const insertMsg = posted.find((m) => m.type === 'insertNode')
      expect(insertMsg).toBeDefined()
      expect(insertMsg.parent).toBe('0.1')
      expect(insertMsg.index).toBe(1)
      expect(insertMsg.slot).toBe('content')

      const selectMsg = posted.find((m) => m.type === 'selection')
      expect(selectMsg).toBeDefined()
      expect(selectMsg.selectedNodeId).toBe('0.1.1[content]')
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })

  test('cancelling insert cleans up and removes ghost element', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"></div></div>'
    const parent = document.querySelector('[data-id="0.1"]') as HTMLElement
    const newEl = document.createElement('div')
    document.body.appendChild(newEl)

    const state: DragInsertState = {
      mode: 'insert',
      action: 'insert',
      elementType: 'element',
      element: newEl,
      repeatedNodes: [],
      offset: { x: 0, y: 0 },
      lastCursorPosition: { x: 100, y: 100 },
      initialContainer: parent,
      initialNextSibling: null,
      initialRect: { width: 50, height: 20 } as unknown as DOMRect,
      reorderPermutations: [],
      flipAnimations: [],
      isSoleChildDrag: false,
      destroying: false,
      selectedInsertAreaIndex: 0,
    }

    await handleInsertEnded({ canceled: true }, state)
    expect(state.destroying).toBe(true)
    expect(newEl.isConnected).toBe(false)
  })

  test('can insert into small empty div (1x1rem / 16x16px) even near edge', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"></div></div>'
    const smallDiv = document.querySelector('[data-id="0.1"]') as HTMLElement
    stubRect(smallDiv, rect(100, 100, 16, 16))
    stubRect(document.getElementById('App'), rect(0, 0, 800, 600))

    const newEl = document.createElement('div')
    const state: DragInsertState = {
      mode: 'insert',
      action: 'insert',
      elementType: 'element',
      element: newEl,
      repeatedNodes: [],
      offset: { x: 0, y: 0 },
      lastCursorPosition: { x: 104, y: 104 },
      initialContainer: smallDiv,
      initialNextSibling: null,
      initialRect: { width: 16, height: 16 } as unknown as DOMRect,
      reorderPermutations: [],
      flipAnimations: [],
      isSoleChildDrag: false,
      destroying: false,
    }

    dragInsertMove('insert', state, [newEl])

    const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
    expect(selected).toBeDefined()
    expect(selected?.parent).toBe(smallDiv)
    expect(selected?.index).toBe(0)
    expect(state.mode).toBe('insert')

    const win = window as any
    const prevParent = win.parent
    const posted: any[] = []
    Object.defineProperty(win, 'parent', { value: win, configurable: true })
    win.postMessage = (msg: any) => {
      posted.push(msg)
    }

    try {
      await handleInsertEnded({}, state)

      const insertMsg = posted.find((m) => m.type === 'insertNode')
      expect(insertMsg).toBeDefined()
      expect(insertMsg.parent).toBe('0.1')
      expect(insertMsg.index).toBe(0)

      const selectMsg = posted.find((m) => m.type === 'selection')
      expect(selectMsg).toBeDefined()
      expect(selectMsg.selectedNodeId).toBe('0.1.0')
    } finally {
      Object.defineProperty(win, 'parent', {
        value: prevParent,
        configurable: true,
      })
    }
  })

  test('dragInsertStarted with action insert does not add reorder class or reorder drop highlight', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"></div></div>'
    const container = document.querySelector('[data-id="0.1"]') as HTMLElement
    const newEl = document.createElement('div')

    const state = dragInsertStarted({
      action: 'insert',
      element: newEl,
      lastCursorPosition: { x: 100, y: 100 },
      repeatedNodes: [],
      asCopy: false,
      initialContainer: container,
    })

    expect(state.mode).toBe('insert')
    expect(newEl.classList.contains(DRAG_REORDER_CLASSNAME)).toBe(false)
    expect(document.querySelector('.__drop-area')).toBeNull()
    state.destroying = true
  })
})
