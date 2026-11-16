/* eslint-disable max-params */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import '../../happydom'
import type { SnapTargetsMessage } from './snapTargets'
import {
  createSnapTargetsController,
  DEFAULT_MAX_SNAP_TARGETS,
  getSnapTargetsData,
} from './snapTargets'

const makeRect = (
  left: number,
  top: number,
  width: number,
  height: number,
) => ({
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

const stubRect = (sel: string | Element, r: ReturnType<typeof makeRect>) => {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel
  if (el) {
    el.getBoundingClientRect = () => r as DOMRect
  }
}

describe('snapTargets', () => {
  const origInnerWidth = window.innerWidth
  const origInnerHeight = window.innerHeight

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(window, 'scrollX', {
      value: 0,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('data-viewport-height')
    Object.defineProperty(window, 'innerWidth', {
      value: origInnerWidth,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: origInnerHeight,
      configurable: true,
      writable: true,
    })
  })

  test('excludes dragged element and its descendants, ordering siblings and ancestors first then nearest others', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0" style="position: relative">
          <div data-id="0.0" style="position: relative">
            <div data-id="0.0.0">Sibling before</div>
            <div data-id="0.0.1" style="position: absolute">
              <div data-id="0.0.1.0">Dragged child</div>
            </div>
            <div data-id="0.0.2">Sibling after</div>
          </div>
          <div data-id="0.1" style="position: relative">
            <div data-id="0.1.0">Far element</div>
            <div data-id="0.1.1">Near element</div>
          </div>
        </div>
      </div>
    `
    stubRect('[data-id="0"]', makeRect(0, 0, 1000, 700))
    stubRect('[data-id="0.0"]', makeRect(20, 20, 400, 300))
    stubRect('[data-id="0.0.0"]', makeRect(30, 30, 100, 40))
    stubRect('[data-id="0.0.1"]', makeRect(150, 30, 100, 40))
    stubRect('[data-id="0.0.1.0"]', makeRect(160, 35, 50, 20))
    stubRect('[data-id="0.0.2"]', makeRect(270, 30, 100, 40))
    stubRect('[data-id="0.1"]', makeRect(500, 20, 400, 300))
    stubRect('[data-id="0.1.0"]', makeRect(800, 500, 80, 40))
    stubRect('[data-id="0.1.1"]', makeRect(260, 80, 80, 40))

    const result = getSnapTargetsData({ nodeId: '0.0.1' })

    expect(result).toEqual({
      type: 'snapTargets',
      nodeId: '0.0.1',
      containingBlock: {
        nodeId: '0.0',
        rect: { top: 20, left: 20, width: 400, height: 300 },
        paddingRect: { top: 20, left: 20, width: 400, height: 300 },
        border: ['0px', '0px', '0px', '0px'],
        padding: ['0px', '0px', '0px', '0px'],
        scroll: { top: 0, left: 0 },
        hasTransform: false,
      },
      viewport: { top: 0, left: 0, width: 1024, height: 768 },
      targets: [
        {
          nodeId: '0.0.0',
          rect: { top: 30, left: 30, width: 100, height: 40 },
          isSibling: true,
          isAncestor: false,
        },
        {
          nodeId: '0.0.2',
          rect: { top: 30, left: 270, width: 100, height: 40 },
          isSibling: true,
          isAncestor: false,
        },
        {
          nodeId: '0.0',
          rect: { top: 20, left: 20, width: 400, height: 300 },
          isSibling: false,
          isAncestor: true,
        },
        {
          nodeId: '0',
          rect: { top: 0, left: 0, width: 1000, height: 700 },
          isSibling: false,
          isAncestor: true,
        },
        {
          nodeId: '0.1.1',
          rect: { top: 80, left: 260, width: 80, height: 40 },
          isSibling: false,
          isAncestor: false,
        },
        {
          nodeId: '0.1',
          rect: { top: 20, left: 500, width: 400, height: 300 },
          isSibling: false,
          isAncestor: false,
        },
        {
          nodeId: '0.1.0',
          rect: { top: 500, left: 800, width: 80, height: 40 },
          isSibling: false,
          isAncestor: false,
        },
      ],
      equalSpacing: {
        x: [
          {
            gap: 140,
            start: 130,
            end: 270,
            fromNodeId: '0.0.0',
            toNodeId: '0.0.2',
          },
        ],
        y: [],
      },
    } satisfies SnapTargetsMessage)
  })

  test('excludes hidden elements with display:none, visibility:hidden, or zero size', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0" style="position: relative">
          <div data-id="0.0" style="position: absolute">Dragged</div>
          <div data-id="0.1" style="display: none">
            <div data-id="0.1.0">Inside display none</div>
          </div>
          <div data-id="0.2" style="visibility: hidden">Visibility hidden</div>
          <div data-id="0.3">Zero width</div>
          <div data-id="0.4">Zero height</div>
          <div data-id="0.5">Visible sibling</div>
        </div>
      </div>
    `
    stubRect('[data-id="0"]', makeRect(0, 0, 500, 400))
    stubRect('[data-id="0.0"]', makeRect(10, 10, 50, 50))
    stubRect('[data-id="0.1"]', makeRect(70, 10, 50, 50))
    stubRect('[data-id="0.1.0"]', makeRect(70, 10, 50, 50))
    stubRect('[data-id="0.2"]', makeRect(130, 10, 50, 50))
    stubRect('[data-id="0.3"]', makeRect(190, 10, 0, 50))
    stubRect('[data-id="0.4"]', makeRect(250, 10, 50, 0))
    stubRect('[data-id="0.5"]', makeRect(310, 10, 60, 40))

    const result = getSnapTargetsData({ nodeId: '0.0' })

    expect(result).toEqual({
      type: 'snapTargets',
      nodeId: '0.0',
      containingBlock: {
        nodeId: '0',
        rect: { top: 0, left: 0, width: 500, height: 400 },
        paddingRect: { top: 0, left: 0, width: 500, height: 400 },
        border: ['0px', '0px', '0px', '0px'],
        padding: ['0px', '0px', '0px', '0px'],
        scroll: { top: 0, left: 0 },
        hasTransform: false,
      },
      viewport: { top: 0, left: 0, width: 1024, height: 768 },
      targets: [
        {
          nodeId: '0.5',
          rect: { top: 10, left: 310, width: 60, height: 40 },
          isSibling: true,
          isAncestor: false,
        },
        {
          nodeId: '0',
          rect: { top: 0, left: 0, width: 500, height: 400 },
          isSibling: false,
          isAncestor: true,
        },
      ],
      equalSpacing: {
        x: [],
        y: [],
      },
    } satisfies SnapTargetsMessage)
  })

  test('limits targets to maxTargets while preserving siblings and ancestors first', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0" style="position: relative">
          <div data-id="0.0" style="position: static">
            <div data-id="0.0.0" style="position: absolute">Dragged</div>
            <div data-id="0.0.1">Far sibling</div>
          </div>
          <div data-id="0.1">
            <div data-id="0.1.0">Other far</div>
            <div data-id="0.1.1">Other closest</div>
          </div>
        </div>
      </div>
    `
    stubRect('[data-id="0"]', makeRect(0, 0, 1000, 800))
    stubRect('[data-id="0.0"]', makeRect(0, 0, 500, 400))
    stubRect('[data-id="0.0.0"]', makeRect(20, 20, 40, 40))
    stubRect('[data-id="0.0.1"]', makeRect(400, 300, 40, 40))
    stubRect('[data-id="0.1"]', makeRect(500, 0, 500, 400))
    stubRect('[data-id="0.1.0"]', makeRect(900, 700, 40, 40))
    stubRect('[data-id="0.1.1"]', makeRect(70, 20, 40, 40))

    const result = getSnapTargetsData({ nodeId: '0.0.0', maxTargets: 4 })

    expect(result).toEqual({
      type: 'snapTargets',
      nodeId: '0.0.0',
      containingBlock: {
        nodeId: '0',
        rect: { top: 0, left: 0, width: 1000, height: 800 },
        paddingRect: { top: 0, left: 0, width: 1000, height: 800 },
        border: ['0px', '0px', '0px', '0px'],
        padding: ['0px', '0px', '0px', '0px'],
        scroll: { top: 0, left: 0 },
        hasTransform: false,
      },
      viewport: { top: 0, left: 0, width: 1024, height: 768 },
      targets: [
        {
          nodeId: '0.0.1',
          rect: { top: 300, left: 400, width: 40, height: 40 },
          isSibling: true,
          isAncestor: false,
        },
        {
          nodeId: '0.0',
          rect: { top: 0, left: 0, width: 500, height: 400 },
          isSibling: false,
          isAncestor: true,
        },
        {
          nodeId: '0',
          rect: { top: 0, left: 0, width: 1000, height: 800 },
          isSibling: false,
          isAncestor: true,
        },
        {
          nodeId: '0.1.1',
          rect: { top: 20, left: 70, width: 40, height: 40 },
          isSibling: false,
          isAncestor: false,
        },
      ],
      equalSpacing: {
        x: [],
        y: [],
      },
    } satisfies SnapTargetsMessage)
  })

  test('computes containingBlock inner paddingRect, border, padding, scroll, and hasTransform', () => {
    document.body.innerHTML = `
      <div id="App">
        <div
          data-id="0"
          style="
            position: relative;
            border-top-width: 2px;
            border-right-width: 4px;
            border-bottom-width: 6px;
            border-left-width: 8px;
            padding-top: 10px;
            padding-right: 12px;
            padding-bottom: 14px;
            padding-left: 16px;
            transform: rotate(15deg);
          "
        >
          <div data-id="0.0" style="position: static">
            <div data-id="0.0.0" style="position: absolute">Dragged</div>
          </div>
        </div>
      </div>
    `
    const cb = document.querySelector('[data-id="0"]') as HTMLElement
    Object.defineProperty(cb, 'scrollTop', { value: 25, configurable: true })
    Object.defineProperty(cb, 'scrollLeft', { value: 15, configurable: true })

    stubRect('[data-id="0"]', makeRect(50, 100, 300, 200))
    stubRect('[data-id="0.0"]', makeRect(70, 120, 200, 100))
    stubRect('[data-id="0.0.0"]', makeRect(80, 130, 60, 40))

    const result = getSnapTargetsData({ nodeId: '0.0.0' })

    expect(result).toEqual({
      type: 'snapTargets',
      nodeId: '0.0.0',
      containingBlock: {
        nodeId: '0',
        rect: { top: 100, left: 50, width: 300, height: 200 },
        paddingRect: { top: 102, left: 58, width: 288, height: 192 },
        border: ['2px', '4px', '6px', '8px'],
        padding: ['10px', '12px', '14px', '16px'],
        scroll: { top: 25, left: 15 },
        hasTransform: true,
      },
      viewport: { top: 0, left: 0, width: 1024, height: 768 },
      targets: [
        {
          nodeId: '0.0',
          rect: { top: 120, left: 70, width: 200, height: 100 },
          isSibling: false,
          isAncestor: true,
        },
        {
          nodeId: '0',
          rect: { top: 100, left: 50, width: 300, height: 200 },
          isSibling: false,
          isAncestor: true,
        },
      ],
      equalSpacing: {
        x: [],
        y: [],
      },
    } satisfies SnapTargetsMessage)
  })

  test('uses viewport as containingBlock for position:fixed unless an ancestor has a transform', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0" style="position: relative">
          <div data-id="0.0" style="position: fixed">Fixed dragged</div>
        </div>
      </div>
    `
    stubRect('[data-id="0"]', makeRect(0, 0, 800, 600))
    stubRect('[data-id="0.0"]', makeRect(100, 100, 80, 40))

    const fixedViewportResult = getSnapTargetsData({ nodeId: '0.0' })

    const rootEl = document.querySelector('[data-id="0"]') as HTMLElement
    rootEl.style.transform = 'scale(1)'
    const fixedTransformedResult = getSnapTargetsData({ nodeId: '0.0' })

    expect({ fixedViewportResult, fixedTransformedResult }).toEqual({
      fixedViewportResult: {
        type: 'snapTargets',
        nodeId: '0.0',
        containingBlock: {
          nodeId: null,
          rect: { top: 0, left: 0, width: 1024, height: 768 },
          paddingRect: { top: 0, left: 0, width: 1024, height: 768 },
          border: ['0px', '0px', '0px', '0px'],
          padding: ['0px', '0px', '0px', '0px'],
          scroll: { top: 0, left: 0 },
          hasTransform: false,
        },
        viewport: { top: 0, left: 0, width: 1024, height: 768 },
        targets: [
          {
            nodeId: '0',
            rect: { top: 0, left: 0, width: 800, height: 600 },
            isSibling: false,
            isAncestor: true,
          },
        ],
        equalSpacing: {
          x: [],
          y: [],
        },
      },
      fixedTransformedResult: {
        type: 'snapTargets',
        nodeId: '0.0',
        containingBlock: {
          nodeId: '0',
          rect: { top: 0, left: 0, width: 800, height: 600 },
          paddingRect: { top: 0, left: 0, width: 800, height: 600 },
          border: ['0px', '0px', '0px', '0px'],
          padding: ['0px', '0px', '0px', '0px'],
          scroll: { top: 0, left: 0 },
          hasTransform: true,
        },
        viewport: { top: 0, left: 0, width: 1024, height: 768 },
        targets: [
          {
            nodeId: '0',
            rect: { top: 0, left: 0, width: 800, height: 600 },
            isSibling: false,
            isAncestor: true,
          },
        ],
        equalSpacing: {
          x: [],
          y: [],
        },
      },
    })
  })

  test('reports root element nodeId for components and repeated items', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0" data-is-root-component="true" style="position: relative">
          <div data-id="0.0" data-is-root-component="true" style="position: absolute">Dragged</div>
          <div data-id="0.1" data-node-id="root">
            <div data-id="0.1.0" data-node-id="inner" data-component="CardComponent">
              <span data-id="0.1.0.0" data-node-id="title" data-component="CardComponent">Card title</span>
            </div>
          </div>
          <div data-id="0.2" data-is-root-component="true">
            <span data-id="0.2.0" data-is-root-component="true">Repeat 0 child</span>
          </div>
          <div data-id="0.2(1)" data-is-root-component="true">
            <span data-id="0.2(1).0" data-is-root-component="true">Repeat 1 child</span>
          </div>
        </div>
      </div>
    `
    stubRect('[data-id="0"]', makeRect(0, 0, 800, 600))
    stubRect('[data-id="0.0"]', makeRect(10, 10, 50, 50))
    stubRect('[data-id="0.1"]', makeRect(100, 10, 120, 80))
    stubRect('[data-id="0.1.0"]', makeRect(105, 15, 110, 70))
    stubRect('[data-id="0.1.0.0"]', makeRect(110, 20, 80, 20))
    stubRect('[data-id="0.2"]', makeRect(100, 120, 120, 40))
    stubRect('[data-id="0.2.0"]', makeRect(105, 125, 80, 20))
    stubRect('[data-id="0.2(1)"]', makeRect(100, 180, 120, 40))
    stubRect('[data-id="0.2(1).0"]', makeRect(105, 185, 80, 20))

    const result = getSnapTargetsData({ nodeId: '0.0' })

    expect(result).toEqual({
      type: 'snapTargets',
      nodeId: '0.0',
      containingBlock: {
        nodeId: '0',
        rect: { top: 0, left: 0, width: 800, height: 600 },
        paddingRect: { top: 0, left: 0, width: 800, height: 600 },
        border: ['0px', '0px', '0px', '0px'],
        padding: ['0px', '0px', '0px', '0px'],
        scroll: { top: 0, left: 0 },
        hasTransform: false,
      },
      viewport: { top: 0, left: 0, width: 1024, height: 768 },
      targets: [
        {
          nodeId: '0.1',
          rect: { top: 10, left: 100, width: 120, height: 80 },
          isSibling: true,
          isAncestor: false,
        },
        {
          nodeId: '0.2',
          rect: { top: 120, left: 100, width: 120, height: 40 },
          isSibling: true,
          isAncestor: false,
        },
        {
          nodeId: '0.2',
          rect: { top: 180, left: 100, width: 120, height: 40 },
          isSibling: true,
          isAncestor: false,
        },
        {
          nodeId: '0',
          rect: { top: 0, left: 0, width: 800, height: 600 },
          isSibling: false,
          isAncestor: true,
        },
      ],
      equalSpacing: {
        x: [],
        y: [
          {
            gap: 30,
            start: 90,
            end: 120,
            fromNodeId: '0.1',
            toNodeId: '0.2',
          },
          {
            gap: 20,
            start: 160,
            end: 180,
            fromNodeId: '0.2',
            toNodeId: '0.2',
          },
        ],
      },
    } satisfies SnapTargetsMessage)
  })

  test('includes text baselines on text elements and equalSpacing hints on both axes', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0" style="position: relative">
          <span
            data-id="0.0"
            data-node-type="text"
            style="font-size: 20px; line-height: 24px"
          >Heading</span>
          <span
            data-id="0.1"
            data-node-type="text"
            style="font-size: 20px; line-height: 24px"
          >Subheading</span>
          <div data-id="0.2">Card</div>
          <div data-id="0.3" style="position: absolute">Dragged</div>
        </div>
      </div>
    `
    stubRect('[data-id="0"]', makeRect(0, 0, 600, 400))
    stubRect('[data-id="0.0"]', makeRect(20, 40, 100, 24))
    stubRect('[data-id="0.1"]', makeRect(150, 40, 120, 24))
    stubRect('[data-id="0.2"]', makeRect(300, 100, 100, 50))
    stubRect('[data-id="0.3"]', makeRect(10, 10, 50, 50))

    const result = getSnapTargetsData({ nodeId: '0.3' })

    expect(result).toEqual({
      type: 'snapTargets',
      nodeId: '0.3',
      containingBlock: {
        nodeId: '0',
        rect: { top: 0, left: 0, width: 600, height: 400 },
        paddingRect: { top: 0, left: 0, width: 600, height: 400 },
        border: ['0px', '0px', '0px', '0px'],
        padding: ['0px', '0px', '0px', '0px'],
        scroll: { top: 0, left: 0 },
        hasTransform: false,
      },
      viewport: { top: 0, left: 0, width: 1024, height: 768 },
      targets: [
        {
          nodeId: '0.0',
          rect: { top: 40, left: 20, width: 100, height: 24 },
          isSibling: true,
          isAncestor: false,
          baseline: 58,
        },
        {
          nodeId: '0.1',
          rect: { top: 40, left: 150, width: 120, height: 24 },
          isSibling: true,
          isAncestor: false,
          baseline: 58,
        },
        {
          nodeId: '0.2',
          rect: { top: 100, left: 300, width: 100, height: 50 },
          isSibling: true,
          isAncestor: false,
        },
        {
          nodeId: '0',
          rect: { top: 0, left: 0, width: 600, height: 400 },
          isSibling: false,
          isAncestor: true,
        },
      ],
      equalSpacing: {
        x: [
          {
            gap: 30,
            start: 120,
            end: 150,
            fromNodeId: '0.0',
            toNodeId: '0.1',
          },
          {
            gap: 30,
            start: 270,
            end: 300,
            fromNodeId: '0.1',
            toNodeId: '0.2',
          },
        ],
        y: [
          {
            gap: 36,
            start: 64,
            end: 100,
            fromNodeId: '0.1',
            toNodeId: '0.2',
          },
        ],
      },
    } satisfies SnapTargetsMessage)
  })

  test('controller measures once on start, throttles scroll/resize to once per animation frame, and stops on stop()', async () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0" style="position: relative">
          <div data-id="0.0" style="position: absolute">Dragged</div>
          <div data-id="0.1">Target</div>
        </div>
      </div>
    `
    stubRect('[data-id="0"]', makeRect(0, 0, 500, 400))
    stubRect('[data-id="0.0"]', makeRect(10, 10, 50, 50))
    stubRect('[data-id="0.1"]', makeRect(100, 100, 80, 40))

    const posted: SnapTargetsMessage[] = []
    const controller = createSnapTargetsController({
      postMessage: (msg) => {
        posted.push(msg)
      },
    })

    controller.start({ nodeId: '0.0' })

    // Simulate scroll changing target position and firing multiple scroll/resize events in one frame
    stubRect('[data-id="0.1"]', makeRect(100, 80, 80, 40))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))

    await new Promise((resolve) => requestAnimationFrame(resolve))

    // Stop controller and verify further scroll/resize events do not trigger measurements
    controller.stop()
    stubRect('[data-id="0.1"]', makeRect(100, 40, 80, 40))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))
    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(posted).toEqual([
      {
        type: 'snapTargets',
        nodeId: '0.0',
        containingBlock: {
          nodeId: '0',
          rect: { top: 0, left: 0, width: 500, height: 400 },
          paddingRect: { top: 0, left: 0, width: 500, height: 400 },
          border: ['0px', '0px', '0px', '0px'],
          padding: ['0px', '0px', '0px', '0px'],
          scroll: { top: 0, left: 0 },
          hasTransform: false,
        },
        viewport: { top: 0, left: 0, width: 1024, height: 768 },
        targets: [
          {
            nodeId: '0.1',
            rect: { top: 100, left: 100, width: 80, height: 40 },
            isSibling: true,
            isAncestor: false,
          },
          {
            nodeId: '0',
            rect: { top: 0, left: 0, width: 500, height: 400 },
            isSibling: false,
            isAncestor: true,
          },
        ],
        equalSpacing: {
          x: [],
          y: [],
        },
      },
      {
        type: 'snapTargets',
        nodeId: '0.0',
        containingBlock: {
          nodeId: '0',
          rect: { top: 0, left: 0, width: 500, height: 400 },
          paddingRect: { top: 0, left: 0, width: 500, height: 400 },
          border: ['0px', '0px', '0px', '0px'],
          padding: ['0px', '0px', '0px', '0px'],
          scroll: { top: 0, left: 0 },
          hasTransform: false,
        },
        viewport: { top: 0, left: 0, width: 1024, height: 768 },
        targets: [
          {
            nodeId: '0.1',
            rect: { top: 80, left: 100, width: 80, height: 40 },
            isSibling: true,
            isAncestor: false,
          },
          {
            nodeId: '0',
            rect: { top: 0, left: 0, width: 500, height: 400 },
            isSibling: false,
            isAncestor: true,
          },
        ],
        equalSpacing: {
          x: [],
          y: [],
        },
      },
    ] satisfies SnapTargetsMessage[])
  })

  test('preserves negative left and top coordinates on containingBlock, targets, baselines, and equalSpacing', () => {
    document.body.innerHTML = `
      <div id="App">
        <div
          data-id="0"
          style="
            position: relative;
            border-top-width: 2px;
            border-left-width: 4px;
          "
        >
          <div data-id="0.0" style="position: absolute; left: -120px; top: -80px">Dragged</div>
          <div data-id="0.1" style="position: absolute; left: -200px; top: -150px">Negative sibling 1</div>
          <span
            data-id="0.2"
            data-node-type="text"
            style="position: absolute; left: -90px; top: -60px; font-size: 20px; line-height: 24px"
          >Negative sibling 2</span>
        </div>
      </div>
    `
    stubRect('[data-id="0"]', makeRect(-50, -40, 500, 400))
    stubRect('[data-id="0.0"]', makeRect(-170, -120, 60, 40))
    stubRect('[data-id="0.1"]', makeRect(-250, -190, 80, 40))
    stubRect('[data-id="0.2"]', makeRect(-140, -100, 90, 24))

    const result = getSnapTargetsData({ nodeId: '0.0' })

    expect(result).toEqual({
      type: 'snapTargets',
      nodeId: '0.0',
      containingBlock: {
        nodeId: '0',
        rect: { top: -40, left: -50, width: 500, height: 400 },
        paddingRect: { top: -38, left: -46, width: 496, height: 398 },
        border: ['2px', '0px', '0px', '4px'],
        padding: ['0px', '0px', '0px', '0px'],
        scroll: { top: 0, left: 0 },
        hasTransform: false,
      },
      viewport: { top: 0, left: 0, width: 1024, height: 768 },
      targets: [
        {
          nodeId: '0.2',
          rect: { top: -100, left: -140, width: 90, height: 24 },
          isSibling: true,
          isAncestor: false,
          baseline: -82,
        },
        {
          nodeId: '0.1',
          rect: { top: -190, left: -250, width: 80, height: 40 },
          isSibling: true,
          isAncestor: false,
        },
        {
          nodeId: '0',
          rect: { top: -40, left: -50, width: 500, height: 400 },
          isSibling: false,
          isAncestor: true,
        },
      ],
      equalSpacing: {
        x: [
          {
            gap: 30,
            start: -170,
            end: -140,
            fromNodeId: '0.1',
            toNodeId: '0.2',
          },
        ],
        y: [
          {
            gap: 50,
            start: -150,
            end: -100,
            fromNodeId: '0.1',
            toNodeId: '0.2',
          },
        ],
      },
    } satisfies SnapTargetsMessage)
  })

  test('defaults maxTargets to 20 and prioritizes visually and hierarchically closest targets', () => {
    const otherNodesHtml = Array.from({ length: 22 }, (_, i) => {
      const idx = i + 2
      return `<div data-id="0.${idx}">Other ${idx}</div>`
    }).join('')

    document.body.innerHTML = `
      <div id="App">
        <div data-id="0" style="position: relative">
          <div data-id="0.0" style="position: relative">
            <div data-id="0.0.0" style="position: absolute">Dragged</div>
            <div data-id="0.0.1">Far sibling</div>
            <div data-id="0.0.2">Close sibling</div>
          </div>
          <div data-id="0.1">
            <div data-id="0.1.0">Deep cousin at same visual distance</div>
          </div>
          ${otherNodesHtml}
        </div>
      </div>
    `
    stubRect('[data-id="0"]', makeRect(0, 0, 2000, 1000))
    stubRect('[data-id="0.0"]', makeRect(0, 0, 500, 400))
    stubRect('[data-id="0.0.0"]', makeRect(50, 50, 40, 40))
    stubRect('[data-id="0.0.1"]', makeRect(300, 50, 40, 40))
    stubRect('[data-id="0.0.2"]', makeRect(100, 50, 40, 40))
    // 0.1 (uncle, 3 hierarchy hops) and 0.1.0 (cousin, 4 hierarchy hops) at the exact same visual distance (10px below dragged)
    stubRect('[data-id="0.1"]', makeRect(50, 100, 40, 40))
    stubRect('[data-id="0.1.0"]', makeRect(50, 100, 40, 40))

    // Place 0.2 .. 0.23 at increasing distances from dragged element (50, 50, 40, 40)
    // Put them in reverse distance order in DOM so DOM order != visual proximity
    for (let i = 0; i < 22; i++) {
      const idx = i + 2
      const distanceOffset = (22 - i) * 50
      stubRect(
        `[data-id="0.${idx}"]`,
        makeRect(50 + distanceOffset, 50, 40, 40),
      )
    }

    const result = getSnapTargetsData({ nodeId: '0.0.0' })

    expect({
      defaultMax: DEFAULT_MAX_SNAP_TARGETS,
      result,
    }).toEqual({
      defaultMax: 20,
      result: {
        type: 'snapTargets',
        nodeId: '0.0.0',
        containingBlock: {
          nodeId: '0.0',
          rect: { top: 0, left: 0, width: 500, height: 400 },
          paddingRect: { top: 0, left: 0, width: 500, height: 400 },
          border: ['0px', '0px', '0px', '0px'],
          padding: ['0px', '0px', '0px', '0px'],
          scroll: { top: 0, left: 0 },
          hasTransform: false,
        },
        viewport: { top: 0, left: 0, width: 1024, height: 768 },
        targets: [
          // Siblings sorted by visual proximity (0.0.2 is 10px away, 0.0.1 is 210px away)
          {
            nodeId: '0.0.2',
            rect: { top: 50, left: 100, width: 40, height: 40 },
            isSibling: true,
            isAncestor: false,
          },
          {
            nodeId: '0.0.1',
            rect: { top: 50, left: 300, width: 40, height: 40 },
            isSibling: true,
            isAncestor: false,
          },
          // Ancestors sorted by hierarchy proximity (0.0 is immediate parent, 0 is grandparent)
          {
            nodeId: '0.0',
            rect: { top: 0, left: 0, width: 500, height: 400 },
            isSibling: false,
            isAncestor: true,
          },
          {
            nodeId: '0',
            rect: { top: 0, left: 0, width: 2000, height: 1000 },
            isSibling: false,
            isAncestor: true,
          },
          // Visually tied at 10px away: uncles 0.1 and 0.23 (3 hops) beat cousin 0.1.0 (4 hops)
          {
            nodeId: '0.1',
            rect: { top: 100, left: 50, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.23',
            rect: { top: 50, left: 100, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.1.0',
            rect: { top: 100, left: 50, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          // Next 13 visually nearest other elements (0.22 down to 0.10), capping total at 20
          {
            nodeId: '0.22',
            rect: { top: 50, left: 150, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.21',
            rect: { top: 50, left: 200, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.20',
            rect: { top: 50, left: 250, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.19',
            rect: { top: 50, left: 300, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.18',
            rect: { top: 50, left: 350, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.17',
            rect: { top: 50, left: 400, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.16',
            rect: { top: 50, left: 450, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.15',
            rect: { top: 50, left: 500, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.14',
            rect: { top: 50, left: 550, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.13',
            rect: { top: 50, left: 600, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.12',
            rect: { top: 50, left: 650, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.11',
            rect: { top: 50, left: 700, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
          {
            nodeId: '0.10',
            rect: { top: 50, left: 750, width: 40, height: 40 },
            isSibling: false,
            isAncestor: false,
          },
        ],
        equalSpacing: {
          x: [
            {
              gap: 160,
              start: 140,
              end: 300,
              fromNodeId: '0.0.2',
              toNodeId: '0.0.1',
            },
          ],
          y: [],
        },
      } satisfies SnapTargetsMessage,
    })
  })
})
