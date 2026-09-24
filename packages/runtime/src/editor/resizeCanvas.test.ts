import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import '../happydom'
import { CSS_VAR_SCROLL_HEIGHT } from './const'
import { requestResizeCanvas, resizeCanvas } from './resizeCanvas'

describe('resizeCanvas', () => {
  let appElement: HTMLDivElement
  let postedMessages: any[] = []
  const originalPostMessage = window.parent.postMessage

  beforeEach(() => {
    postedMessages = []
    window.parent.postMessage = ((msg: any) => {
      postedMessages.push(msg)
    }) as any

    document.body.innerHTML = '<div id="App" style="height: 500px;"></div>'
    appElement = document.getElementById('App') as HTMLDivElement
  })

  afterEach(() => {
    window.parent.postMessage = originalPostMessage
    document.body.innerHTML = ''
  })

  test('synchronously sets CSS_VAR_SCROLL_HEIGHT and posts documentScrollSize', () => {
    resizeCanvas({ force: true, viewport: { height: 800 } })

    expect(appElement.style.getPropertyValue(CSS_VAR_SCROLL_HEIGHT)).toBe('800')
    expect(appElement.style.maxHeight).toBe('')
    expect(postedMessages).toContainEqual({
      type: 'documentScrollSize',
      scrollHeight: 800,
    })
  })

  test('requestResizeCanvas runs on rAF and calls onDone', async () => {
    const onDone = mock(() => {})
    requestResizeCanvas({ force: true, viewport: { height: 900 } }, onDone)

    expect(onDone).not.toHaveBeenCalled()

    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(onDone).toHaveBeenCalledTimes(1)
    expect(appElement.style.getPropertyValue(CSS_VAR_SCROLL_HEIGHT)).toBe('900')
  })

  test('multiple requestResizeCanvas calls preserve all onDone callbacks', async () => {
    const onDone1 = mock(() => {})
    const onDone2 = mock(() => {})

    requestResizeCanvas({ force: true, viewport: { height: 750 } }, onDone1)
    requestResizeCanvas({ force: true, viewport: { height: 850 } }, onDone2)

    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(onDone1).toHaveBeenCalledTimes(1)
    expect(onDone2).toHaveBeenCalledTimes(1)
    expect(appElement.style.getPropertyValue(CSS_VAR_SCROLL_HEIGHT)).toBe('850')
  })

  test('synchronous resizeCanvas flushes queued callbacks and cancels pending rAF', async () => {
    const onDone = mock(() => {})
    requestResizeCanvas({ force: true, viewport: { height: 700 } }, onDone)

    expect(onDone).not.toHaveBeenCalled()

    // Synchronous resize should flush queued onDone immediately
    resizeCanvas({ force: true, viewport: { height: 950 } })
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(appElement.style.getPropertyValue(CSS_VAR_SCROLL_HEIGHT)).toBe('950')

    // After rAF, onDone should NOT be called again
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  test('enabled=false does not resize but executes queued callbacks', () => {
    const onDone = mock(() => {})
    requestResizeCanvas({ enabled: false }, onDone)

    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
