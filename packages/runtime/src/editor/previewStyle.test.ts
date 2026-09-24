import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import '../happydom'
import { CSS_VAR_SCROLL_HEIGHT } from './const'
import { applyPreviewStyle } from './previewStyle'

describe('applyPreviewStyle', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="App" style="height: 400px;">
        <div data-id="test-node" style="margin-top: 10px;">Test Node</div>
      </div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.head.querySelector('[data-id="selected-node-styles"]')?.remove()
  })

  test('applies preview style, resizes canvas synchronously and syncs overlay rects in same turn', () => {
    const executionOrder: string[] = []
    const syncOverlayRects = mock(() => {
      executionOrder.push('syncOverlayRects')
      // At this point, the style tag should already be applied and App's CSS var updated
      const styleTag = document.head.querySelector(
        '[data-id="selected-node-styles"]',
      )
      expect(styleTag).not.toBeNull()
      expect(styleTag?.textContent).toContain('margin-top: 25px !important;')
      expect(
        document
          .getElementById('App')!
          .style.getPropertyValue(CSS_VAR_SCROLL_HEIGHT),
      ).toBe('740')
    })

    applyPreviewStyle({
      data: { styles: { 'margin-top': '25px' } },
      selectedNodeId: 'test-node',
      component: null,
      styleVariantSelection: null,
      resizeCanvasOptions: { enabled: true, viewport: { height: 740 } },
      syncOverlayRects,
    })

    expect(syncOverlayRects).toHaveBeenCalledTimes(1)
    expect(executionOrder).toEqual(['syncOverlayRects'])
  })

  test('cleans up style and resizes canvas synchronously when styles are null', () => {
    // First apply style
    applyPreviewStyle({
      data: { styles: { 'margin-top': '20px' } },
      selectedNodeId: 'test-node',
      component: null,
      styleVariantSelection: null,
      resizeCanvasOptions: { enabled: true, viewport: { height: 740 } },
      syncOverlayRects: () => {},
    })

    expect(
      document.head.querySelector('[data-id="selected-node-styles"]'),
    ).not.toBeNull()

    const syncOverlayRects = mock(() => {
      expect(
        document.head.querySelector('[data-id="selected-node-styles"]'),
      ).toBeNull()
    })

    applyPreviewStyle({
      data: { styles: null },
      selectedNodeId: 'test-node',
      component: null,
      styleVariantSelection: null,
      resizeCanvasOptions: { enabled: true, viewport: { height: 740 } },
      syncOverlayRects,
    })

    expect(syncOverlayRects).toHaveBeenCalledTimes(1)
  })

  test('cleans up style and resizes canvas synchronously when styles are empty object', () => {
    // First apply style
    applyPreviewStyle({
      data: { styles: { 'margin-top': '20px' } },
      selectedNodeId: 'test-node',
      component: null,
      styleVariantSelection: null,
      resizeCanvasOptions: { enabled: true, viewport: { height: 740 } },
      syncOverlayRects: () => {},
    })

    expect(
      document.head.querySelector('[data-id="selected-node-styles"]'),
    ).not.toBeNull()

    const syncOverlayRects = mock(() => {
      expect(
        document.head.querySelector('[data-id="selected-node-styles"]'),
      ).toBeNull()
    })

    applyPreviewStyle({
      data: { styles: {} },
      selectedNodeId: 'test-node',
      component: null,
      styleVariantSelection: null,
      resizeCanvasOptions: { enabled: true, viewport: { height: 740 } },
      syncOverlayRects,
    })

    expect(syncOverlayRects).toHaveBeenCalledTimes(1)
  })
})
