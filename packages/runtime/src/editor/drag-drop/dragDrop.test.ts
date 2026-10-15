import { afterEach, describe, expect, test } from 'bun:test'
import '../../happydom'
import {
  dragInsertEnded,
  dragInsertMove,
  dragInsertStarted,
  dropStyleProps,
} from '../helpers'
import { handleInsertEnded } from '../insert/insertHandlers'
import type { DragInsertState } from '../types'
import {
  handleDragAltToggle,
  handleDragEnded,
  handleDragMouseMove,
  trackHoverTarget,
} from './dragHandlers'
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

const stub = (sel: string | Element, r: ReturnType<typeof rect>) => {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel
  if (el) {
    el.getBoundingClientRect = () => r as unknown as DOMRect
  }
}
const $ = (id: string) => document.querySelector(`[data-id="${id}"]`)!
const childIds = (id: string) =>
  Array.from($(id).children).map((c) => c.getAttribute('data-id'))
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** Runs `fn` while capturing messages posted to the parent window. */
const capturePosts = async (fn: () => Promise<unknown>) => {
  const win = window as any
  const prevParent = win.parent
  const posted: any[] = []
  Object.defineProperty(win, 'parent', { value: win, configurable: true })
  win.postMessage = (msg: any) => {
    posted.push(msg)
  }
  try {
    await fn()
  } finally {
    Object.defineProperty(win, 'parent', {
      value: prevParent,
      configurable: true,
    })
  }
  return posted
}

const startDrag = (
  id: string,
  cursor: { x: number; y: number },
  asCopy = false,
) =>
  dragInsertStarted({
    action: 'drag',
    element: $(id) as HTMLElement,
    lastCursorPosition: cursor,
    repeatedNodes: [],
    asCopy,
  })!

const makeInsertState = (
  element: HTMLElement,
  cursor: { x: number; y: number },
  overrides: Partial<DragInsertState> = {},
): DragInsertState => ({
  mode: 'insert',
  action: 'insert',
  elementType: 'element',
  element,
  repeatedNodes: [],
  offset: { x: 0, y: 0 },
  lastCursorPosition: cursor,
  initialContainer: document.getElementById('App') as HTMLElement,
  initialNextSibling: null,
  initialRect: { width: 50, height: 20 } as unknown as DOMRect,
  reorderPermutations: [],
  flipAnimations: [],
  isSoleChildDrag: false,
  destroying: false,
  ...overrides,
})

/** Rests on the current target and resolves with the replacement state. */
const rest = async (state: DragInsertState, opts: object = {}) => {
  let replaced: DragInsertState | null | undefined
  trackHoverTarget(state, (n) => (replaced = n), {
    stillMs: 5,
    blinkMs: 10,
    ...opts,
  })
  await wait(150)
  return replaced
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('drop lines', () => {
  test('single child: block parent → 2 plain lines, flex parent → 4 lines with flex-direction', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">only</div></div></div>'
    stub('[data-id="0.1.0"]', rect(110, 110, 180, 80))
    stub('[data-id="0.1"]', rect(100, 100, 200, 100))
    stub('#App', rect(0, 0, 800, 600))
    const parent = $('0.1') as HTMLElement
    const areasOf = () => getInsertAreas().filter((a) => a.parent === parent)

    let areas = areasOf()
    expect(areas).toHaveLength(2)
    expect(areas.every((a) => a.bounds === undefined)).toBe(true)
    expect(dropStyleProps(areas[0])).toEqual({})
    expect(areas.find((a) => a.direction === -1)).toMatchObject({
      index: 0,
      center: { x: 200, y: 110 },
    })
    expect(areas.find((a) => a.direction === 1)).toMatchObject({
      index: 1,
      center: { x: 200, y: 190 },
    })

    parent.style.setProperty('display', 'flex')
    areas = areasOf()
    expect(areas).toHaveLength(4)
    const col = areas.filter((a) => a['flex-direction'] === 'column')
    const row = areas.filter((a) => a['flex-direction'] === 'row')
    expect(col.every((a) => a.layout === 'block')).toBe(true)
    expect(row.every((a) => a.layout === 'inline')).toBe(true)
    expect([col.length, row.length]).toEqual([2, 2])
  })

  test('coincident lines: gapless pair collapses, small gap merges to midpoint, slot mirrors survive', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">a</div><div data-id="0.1.1" data-node-id="3">b</div></div></div>'
    stub('[data-id="0.1.0"]', rect(50, 50, 300, 100))
    stub('[data-id="0.1.1"]', rect(50, 150, 300, 100))
    stub('[data-id="0.1"]', rect(50, 50, 300, 200))
    stub('#App', rect(0, 0, 800, 600))
    const between = () =>
      getInsertAreas().filter(
        (a) => a.parent === $('0.1') && a.center.y > 100 && a.center.y < 200,
      )

    expect(between()).toHaveLength(1)
    expect(between()[0]).toMatchObject({ index: 1, center: { y: 150 } })

    stub('[data-id="0.1.1"]', rect(50, 154, 300, 100))
    expect(between()).toHaveLength(1)
    expect(between()[0].center.y).toBe(152)

    const parent = document.createElement('div')
    const mirror = document.createElement('div')
    document.body.append(parent, mirror)
    const line = (slot: string, p: Element = parent): any => ({
      layout: 'block',
      parent: p,
      indexAll: 0,
      index: 0,
      slot,
      center: { x: 200, y: 150 },
      size: 300,
      direction: 1,
    })
    expect(dedupeOverlappingLines([line('a'), line('a', mirror)])).toHaveLength(
      2,
    )
    expect(dedupeOverlappingLines([line('a'), line('a')])).toHaveLength(1)
  })
})

describe('dropStyleProps', () => {
  const flexParent = (dir: string, justify?: string, align?: string) => {
    const p = document.createElement('div')
    p.style.setProperty('display', 'flex')
    p.style.setProperty('flex-direction', dir)
    if (justify) p.style.setProperty('justify-content', justify)
    if (align) p.style.setProperty('align-items', align)
    document.body.append(p)
    return p
  }
  const area = (parent: Element, extra: object = {}) => ({
    layout: 'block' as const,
    parent,
    indexAll: 1,
    index: 1,
    center: { x: 0, y: 0 },
    size: 10,
    direction: 1 as const,
    ...extra,
  })

  test('crossing the flex axis swaps parent alignment; area props win', () => {
    expect(
      dropStyleProps(
        area(flexParent('row', 'center', 'flex-start'), {
          'flex-direction': 'column' as const,
        }),
      ),
    ).toEqual({
      'flex-direction': 'column',
      'justify-content': 'flex-start',
      'align-items': 'center',
    })
    expect(
      dropStyleProps(
        area(flexParent('column', 'flex-start', 'center'), {
          'flex-direction': 'row' as const,
        }),
      ),
    ).toEqual({
      'flex-direction': 'row',
      'justify-content': 'center',
      'align-items': 'flex-start',
    })
    expect(
      dropStyleProps(
        area(flexParent('column', 'flex-end', 'center'), {
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
})

describe('empty container grid', () => {
  const setup = (size: number) => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"></div></div>'
    ;($('0.1') as HTMLElement).style.setProperty('display', 'flex')
    stub('[data-id="0.1"]', rect(100, 100, size, size))
    stub('#App', rect(0, 0, 800, 600))
    return getInsertAreas().filter((a) => a.parent === $('0.1'))
  }

  test('flex parent ≥58px gets a 9-cell grid carrying alignment + row direction', () => {
    const grid = setup(300)
    expect(grid).toHaveLength(9)
    expect(grid[0]).toMatchObject({
      'justify-content': 'flex-start',
      'align-items': 'flex-start',
    })
    expect(grid[4]).toMatchObject({
      'justify-content': 'center',
      'align-items': 'center',
    })
    expect(grid[8]).toMatchObject({
      'justify-content': 'flex-end',
      'align-items': 'flex-end',
    })
    expect(grid.every((c) => c['flex-direction'] === 'row')).toBe(true)
  })
})

describe('sole child drag', () => {
  const loneSetup = () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">lone</div></div></div>'
    ;($('0.1') as HTMLElement).style.setProperty('display', 'flex')
    stub('[data-id="0.1.0"]', rect(50, 50, 300, 100))
    stub('[data-id="0.1"]', rect(50, 50, 300, 100))
    stub('#App', rect(0, 0, 800, 600))
  }

  test('lone drag enters insert mode with 9 spots; a duplicate drag stays in reorder', () => {
    loneSetup()
    const lone = startDrag('0.1.0', { x: 200, y: 100 })
    expect([lone.isSoleChildDrag, lone.mode]).toEqual([true, 'reorder'])
    handleDragMouseMove({ x: 200, y: 100 }, lone, false)
    expect(lone.mode).toBe('insert')
    expect(lone.insertAreas!.filter((a) => a.parent === $('0.1'))).toHaveLength(
      9,
    )
    lone.destroying = true

    loneSetup()
    const copy = startDrag('0.1.0', { x: 200, y: 100 }, true)
    handleDragMouseMove({ x: 200, y: 100 }, copy, false)
    expect([copy.isSoleChildDrag, copy.mode]).toEqual([false, 'reorder'])
    copy.destroying = true
  })

  test('dropping the lone child posts placement props', async () => {
    loneSetup()
    const posted = await capturePosts(async () => {
      const state = startDrag('0.1.0', { x: 200, y: 60 })
      handleDragMouseMove({ x: 200, y: 60 }, state, false)
      await handleDragEnded({}, state, null)
    })
    expect(posted.find((m) => m.type === 'nodeMoved')).toMatchObject({
      parent: '0.1',
      index: 0,
      'justify-content': 'center',
      'align-items': 'flex-start',
      'flex-direction': 'row',
    })
  })
})

const crossSetup = () => {
  document.body.innerHTML =
    '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">first</div></div><div data-id="0.9" data-node-id="9"><div data-id="0.9.0" data-node-id="10">dragme</div><div data-id="0.9.1" data-node-id="11">stay</div></div></div>'
  stub('[data-id="0.1.0"]', rect(100, 100, 200, 100))
  stub('[data-id="0.1"]', rect(100, 100, 200, 100))
  stub('[data-id="0.9.0"]', rect(100, 400, 200, 100))
  stub('[data-id="0.9.1"]', rect(100, 500, 200, 100))
  stub('[data-id="0.9"]', rect(100, 400, 200, 200))
  stub('#App', rect(0, 0, 800, 600))
}

/** Drag 0.9.0 out of its container and hover just below 0.1.0. */
const startHoverDrag = () => {
  crossSetup()
  const state = startDrag('0.9.0', { x: 200, y: 450 })
  state.lastCursorPosition = { x: 200, y: 210 }
  dragInsertMove('drag', state, [state.element, state.initialContainer])
  const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
  expect([selected?.parent.getAttribute('data-id'), selected?.index]).toEqual([
    '0.1',
    1,
  ])
  return state
}

describe('hover-to-insert', () => {
  test('resting on a target moves the element there and re-measures reorder slots', async () => {
    const state = startHoverDrag()
    const next = (await rest(state))!
    expect(next.mode).toBe('reorder')
    expect(state.destroying).toBe(true)
    expect(childIds('0.1')).toEqual(['0.1.0', '0.9.0'])
    expect(childIds('0.9')).toEqual(['0.9.1'])
    expect(next.trueOrigin?.container.getAttribute('data-id')).toBe('0.9')
    // Both children plus the end slot (stale pre-move probing would give 2)
    expect(next.reorderPermutations).toHaveLength(3)
    next.destroying = true
  })

  test('releasing right after a hover commits the move; ALT then posts copy: true', async () => {
    const next = (await rest(startHoverDrag()))!
    await handleDragAltToggle(true, next)
    const posted = await capturePosts(() => handleDragEnded({}, next, null))
    expect(posted.find((m) => m.type === 'nodeMoved')).toMatchObject({
      parent: '0.1',
      index: 1,
      copy: true,
    })
    next.destroying = true
  })
})

describe('slot outlets', () => {
  test('dropping on a placeholder never auto-moves, and optimistically replaces it', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2" data-node-slot-name="content">ph</div></div><div data-id="0.9" data-node-id="9"><div data-id="0.9.0" data-node-id="10">dragme</div><div data-id="0.9.1" data-node-id="11">stay</div></div></div>'
    stub('[data-id="0.1.0"]', rect(100, 100, 200, 100))
    stub('[data-id="0.1"]', rect(100, 100, 200, 100))
    stub('[data-id="0.9.0"]', rect(100, 400, 200, 100))
    stub('[data-id="0.9.1"]', rect(100, 500, 200, 100))
    stub('[data-id="0.9"]', rect(100, 400, 200, 200))
    stub('#App', rect(0, 0, 800, 600))

    const state = startDrag('0.9.0', { x: 200, y: 450 })
    state.lastCursorPosition = { x: 200, y: 150 }
    dragInsertMove('drag', state, [state.element, state.initialContainer])
    const selected = state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]
    expect(selected).toMatchObject({ slot: 'content', slotPlaceholder: true })
    expect(await rest(state)).toBeUndefined()

    const posted = await capturePosts(() => handleDragEnded({}, state, null))
    expect(posted.find((m) => m.type === 'nodeMoved')).toMatchObject({
      parent: '0.1',
      slot: 'content',
    })
    expect(document.querySelector('[data-id="0.1.0"]')).toBeNull()
    expect($('0.1').contains(state.element)).toBe(true)
    state.destroying = true
  })

  test('same-name slot placeholders light up drop areas on all instances', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.62" data-node-id="root" data-has-slots-elements="true" data-fallback-slot-name="content"><div data-id="0.62.0.0" data-node-id="43" data-node-slot-name="content">a</div><div data-id="0.62.1.0" data-node-id="45" data-node-slot-name="content">b</div></div></div>'
    stub('[data-id="0.62.0.0"]', rect(100, 100, 200, 40))
    stub('[data-id="0.62.1.0"]', rect(100, 200, 200, 40))
    stub('[data-id="0.62"]', rect(100, 100, 200, 140))
    stub('#App', rect(0, 0, 800, 600))

    const newEl = document.createElement('div')
    const state = makeInsertState(newEl, { x: 200, y: 120 })
    dragInsertMove('insert', state, [newEl])
    expect(document.querySelectorAll('.__drop-area-grid')).toHaveLength(2)
    expect(document.querySelectorAll('.__drop-area-line')).toHaveLength(0)
    state.destroying = true
  })

  test('duplicate slot names with provided content show only a single drop line for the hovered slot', () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.9" data-node-id="root" data-has-slots-elements="true" data-fallback-slot-name="default"><div data-id="0.9.0[default]" data-node-id="31">item 1</div><div data-id="0.9.0[default]{1}" data-node-id="32">item 2</div></div></div>'
    stub('[data-id="0.9.0[default]"]', rect(100, 100, 200, 40))
    stub('[data-id="0.9.0[default]{1}"]', rect(100, 200, 200, 40))
    stub('[data-id="0.9"]', rect(100, 100, 200, 200))
    stub('#App', rect(0, 0, 800, 600))

    const newEl = document.createElement('div')
    const insertState = makeInsertState(newEl, { x: 200, y: 95 })
    dragInsertMove('insert', insertState, [newEl])
    const insertLines = document.querySelectorAll('.__drop-area-line')
    expect(insertLines).toHaveLength(1)
    expect(document.querySelectorAll('.__drop-area-grid')).toHaveLength(0)
    expect(
      (insertLines[0] as HTMLElement).style.getPropertyValue('--drop-area-top'),
    ).toBe('100px')
    insertState.destroying = true

    const dragState = makeInsertState(
      newEl,
      { x: 200, y: 245 },
      { action: 'drag' },
    )
    dragInsertMove('drag', dragState, [newEl])
    const dragLines = document.querySelectorAll('.__drop-area-line')
    expect(dragLines).toHaveLength(1)
    expect(document.querySelectorAll('.__drop-area-grid')).toHaveLength(0)
    expect(
      (dragLines[0] as HTMLElement).style.getPropertyValue('--drop-area-top'),
    ).toBe('240px')
    dragState.destroying = true
  })
})

describe('selection and drop', () => {
  test('dropping after the last repeat item lands after it, ignoring whitespace text nodes', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">r0</div>   <div data-id="0.1.0(0)" data-node-id="2">r1</div><div data-id="0.1.1" data-node-id="3">B</div></div></div>'
    stub('[data-id="0.1.0"]', rect(100, 100, 200, 50))
    stub('[data-id="0.1.0(0)"]', rect(100, 150, 200, 50))
    stub('[data-id="0.1.1"]', rect(100, 210, 200, 50))
    stub('[data-id="0.1"]', rect(100, 100, 200, 160))
    stub('#App', rect(0, 0, 800, 600))
    const newEl = document.createElement('div')
    newEl.setAttribute('data-id', 'new-item')
    stub(newEl, rect(0, 0, 40, 40))

    const state = makeInsertState(newEl, { x: 200, y: 205 })
    dragInsertMove('insert', state, [newEl])
    expect(
      state.insertAreas?.[state.selectedInsertAreaIndex ?? -1]?.direction,
    ).toBe(1)
    await dragInsertEnded(state, false)
    expect(childIds('0.1')).toEqual(['0.1.0', '0.1.0(0)', 'new-item', '0.1.1'])
  })
})

describe('handleInsertEnded', () => {
  test('posts insertNode and selection messages for the new node', async () => {
    document.body.innerHTML =
      '<div id="App"><div data-id="0.1" data-node-id="1"><div data-id="0.1.0" data-node-id="2">child</div></div></div>'
    const parent = $('0.1') as HTMLElement
    const state = makeInsertState(
      document.createElement('div'),
      { x: 100, y: 100 },
      {
        initialContainer: parent,
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
      },
    )

    const posted = await capturePosts(() => handleInsertEnded({}, state))
    expect(posted.find((m) => m.type === 'insertNode')).toMatchObject({
      parent: '0.1',
      index: 1,
      slot: 'content',
    })
    expect(posted.find((m) => m.type === 'selection').selectedNodeId).toBe(
      '0.1.1[content]',
    )
  })
})
