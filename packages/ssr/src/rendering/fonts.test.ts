import { describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'
import {
  FONT_LOADER_SCRIPT,
  getFontLoaderScript,
} from '../../dist/rendering/fonts'

const runScriptInWindow = (scriptContent: string, win: Window) => {
  const fn = new Function('document', 'window', 'globalThis', scriptContent)
  fn(win.document, win, win)
}

describe('getFontLoaderScript', () => {
  test('FONT_LOADER_SCRIPT is built with esbuild into a minified IIFE', () => {
    expect(
      FONT_LOADER_SCRIPT.includes('(()=>{') &&
        FONT_LOADER_SCRIPT.includes('__FONT_URLS__'),
    ).toBe(true)
  })

  test('does not re-inject font stylesheet when all fonts are already linked on the page', () => {
    const script = getFontLoaderScript([
      'https://toddle.toddle.site/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400&family=Inter+Tight%3Awght%40600',
    ])

    const win = new Window({ url: 'https://nordcraft.com/' })
    win.document.head.innerHTML =
      '<link href="/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400&family=Inter+Tight%3Awght%40600" rel="stylesheet" />'

    runScriptInWindow(script, win)

    const links = Array.from(
      win.document.head.querySelectorAll('link[rel="stylesheet"]'),
    ).map((link) => link.getAttribute('href'))

    expect(links).toEqual([
      '/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400&family=Inter+Tight%3Awght%40600',
    ])
  })

  test('filters out font families already linked on the page and prepends only missing fonts to head', () => {
    const script = getFontLoaderScript([
      'https://toddle.toddle.site/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400&family=Rock+Salt%3Awght%40400',
    ])

    const win = new Window({ url: 'https://nordcraft.com/' })
    win.document.head.innerHTML =
      '<link href="/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400" rel="stylesheet" />'

    runScriptInWindow(script, win)

    const links = Array.from(
      win.document.head.querySelectorAll('link[rel="stylesheet"]'),
    ).map((link) => link.getAttribute('href'))

    expect(links).toEqual([
      'https://toddle.toddle.site/.toddle/fonts/stylesheet/css2?display=block&family=Rock+Salt%3Awght%40400',
      '/.toddle/fonts/stylesheet/css2?display=block&family=Inter%3Awght%40400',
    ])
  })

  test('filters out font faces already present in document.fonts and requests only missing weights', () => {
    const script = getFontLoaderScript([
      'https://toddle.toddle.site/.toddle/fonts/stylesheet/css2?display=block&family=Inter+Tight%3Awght%40400%3B600&family=Rock+Salt%3Awght%40400',
    ])

    const win = new Window({ url: 'https://nordcraft.com/' })
    Object.defineProperty(win.document, 'fonts', {
      value: [
        { family: '"Inter Tight"', style: 'normal', weight: '400' },
        { family: 'Rock Salt', style: 'normal', weight: '400' },
      ],
      configurable: true,
    })

    runScriptInWindow(script, win)

    const links = Array.from(
      win.document.head.querySelectorAll('link[rel="stylesheet"]'),
    ).map((link) => link.getAttribute('href'))

    expect(links).toEqual([
      'https://toddle.toddle.site/.toddle/fonts/stylesheet/css2?display=block&family=Inter+Tight%3Awght%40600',
    ])
  })
})
