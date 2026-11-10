import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

type DomToCanvasOptions = { width: number; height: number; timeout: number }
type WaitUntilLoadOptions = { timeout: number }

let calls: Array<
  | {
      fn: 'waitUntilLoad'
      node: Node
      options: WaitUntilLoadOptions
      loading: string[]
    }
  | { fn: 'domToCanvas'; options: DomToCanvasOptions; loading: string[] }
> = []

const imageLoadingStates = () =>
  Array.from(document.querySelectorAll('img')).map((img) => img.loading)

const setDocumentSize = (width: number, height: number) => {
  Object.defineProperty(document.documentElement, 'scrollWidth', {
    configurable: true,
    value: width,
  })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: height,
  })
}

void mock.module('modern-screenshot', () => ({
  waitUntilLoad: (node: Node, options: WaitUntilLoadOptions) => {
    calls.push({
      fn: 'waitUntilLoad',
      node,
      options,
      loading: imageLoadingStates(),
    })
    // Simulate lazy images without intrinsic dimensions growing the page
    // once they load.
    setDocumentSize(1200, 3000)
    return Promise.resolve()
  },
  domToCanvas: (_node: Node, options: DomToCanvasOptions) => {
    calls.push({ fn: 'domToCanvas', options, loading: imageLoadingStates() })
    const canvas = document.createElement('canvas')
    canvas.toDataURL = () => 'data:image/png;base64,'
    return Promise.resolve(canvas)
  },
}))

const { captureScreenshot } = await import('./screenshot')

describe('captureScreenshot', () => {
  beforeEach(() => {
    calls = []
    setDocumentSize(1200, 800)
    document.body.innerHTML = `
      <img src="a.png" loading="lazy">
      <img src="b.png" loading="eager">
      <img src="c.png">
      <img src="d.png" loading="lazy">
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('loads lazy images eagerly and measures the document after they load', async () => {
    await captureScreenshot({ id: 'test' })

    expect(calls).toEqual([
      {
        fn: 'waitUntilLoad',
        node: document.documentElement,
        options: { timeout: 5000 },
        loading: ['eager', 'eager', 'auto', 'eager'],
      },
      {
        fn: 'domToCanvas',
        options: { width: 1200, height: 3000, timeout: 5000 },
        loading: ['eager', 'eager', 'auto', 'eager'],
      },
    ])
  })

  test('restores lazy loading after capturing', async () => {
    await captureScreenshot({ id: 'test' })

    expect(
      Array.from(document.querySelectorAll('img')).map((img) =>
        img.getAttribute('loading'),
      ),
    ).toEqual(['lazy', 'eager', null, 'lazy'])
  })
})
