import { afterEach, describe, expect, test } from 'bun:test'
import '../happydom'
import { Signal } from '../signal/signal'
import { subscribeCustomProperty } from './subscribeCustomProperty'

describe('subscribeCustomProperty - multiple roots', () => {
  afterEach(() => {
    // Note: We can't easily clear the WeakMap, but each test uses new elements
  })

  test('it works with multiple shadow roots independently', () => {
    const div1 = document.createElement('div')
    const shadow1 = div1.attachShadow({ mode: 'open' })
    const div2 = document.createElement('div')
    const shadow2 = div2.attachShadow({ mode: 'open' })

    const signal1 = new Signal('red')
    const signal2 = new Signal('blue')

    subscribeCustomProperty({
      root: shadow1,
      selector: '.test',
      customPropertyName: '--color',
      signal: signal1,
    })

    subscribeCustomProperty({
      root: shadow2,
      selector: '.test',
      customPropertyName: '--color',
      signal: signal2,
    })

    // Check that each shadow root has its own stylesheet
    expect(shadow1.adoptedStyleSheets).toHaveLength(1)
    expect(shadow2.adoptedStyleSheets).toHaveLength(1)
    expect(shadow1.adoptedStyleSheets[0]).not.toBe(
      shadow2.adoptedStyleSheets[0],
    )

    const sheet1 = shadow1.adoptedStyleSheets[0]
    const sheet2 = shadow2.adoptedStyleSheets[0]

    expect(sheet1.cssRules[0].cssText).toContain('--color: red')
    expect(sheet2.cssRules[0].cssText).toContain('--color: blue')

    // Update signal1
    signal1.set('green')
    expect(sheet1.cssRules[0].cssText).toContain('--color: green')
    expect(sheet2.cssRules[0].cssText).toContain('--color: blue') // Should remain blue
  })

  test('it fetches the same stylesheet for the same root', () => {
    const div = document.createElement('div')
    const shadow = div.attachShadow({ mode: 'open' })

    const signal1 = new Signal('red')
    const signal2 = new Signal('blue')

    subscribeCustomProperty({
      root: shadow,
      selector: '.test1',
      customPropertyName: '--color1',
      signal: signal1,
    })

    subscribeCustomProperty({
      root: shadow,
      selector: '.test2',
      customPropertyName: '--color2',
      signal: signal2,
    })

    expect(shadow.adoptedStyleSheets).toHaveLength(1)
    const sheet = shadow.adoptedStyleSheets[0]
    expect(sheet.cssRules).toHaveLength(2)
  })
})
