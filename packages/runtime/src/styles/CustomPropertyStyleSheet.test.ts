import { describe, expect, test } from 'bun:test'
import { CustomPropertyStyleSheet } from './CustomPropertyStyleSheet'

describe('CustomPropertyStyleSheet', () => {
  test('it creates a new stylesheet', () => {
    const instance = new CustomPropertyStyleSheet(document)
    expect(instance).toBeInstanceOf(CustomPropertyStyleSheet)
    expect(instance.getStyleSheet().cssRules).toHaveLength(0)
  })

  test('it adds a property definition', () => {
    const instance = new CustomPropertyStyleSheet(document)
    instance.registerProperty('.my-class', '--my-property')
    expect(instance.getStyleSheet().cssRules.length).toBe(1)
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe('.my-class {  }')
  })

  test('it puts different selectors in different rules', () => {
    const instance = new CustomPropertyStyleSheet(document)
    instance.registerProperty('.my-class', '--my-property')('256px')
    instance.registerProperty('.my-other-class', '--my-property')('256px')
    expect(instance.getStyleSheet().cssRules.length).toBe(2)
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe(
      '.my-class { --my-property: 256px; }',
    )
    expect(instance.getStyleSheet().cssRules[1].cssText).toBe(
      '.my-other-class { --my-property: 256px; }',
    )
  })

  test('it can update properties', () => {
    const instance = new CustomPropertyStyleSheet(document)
    const setter = instance.registerProperty('.my-class', '--my-property')
    setter('256px')
    expect(instance.getStyleSheet().cssRules.length).toBe(1)
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe(
      '.my-class { --my-property: 256px; }',
    )

    setter('inherit')
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe(
      '.my-class { --my-property: inherit; }',
    )
  })

  test('it works with media queries', () => {
    const instance = new CustomPropertyStyleSheet(document)
    instance.registerProperty('.my-class', '--my-property', {
      mediaQuery: { 'max-width': '600px' },
    })('256px')
    expect(instance.getStyleSheet().cssRules.length).toBe(1)
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe(
      '@media (max-width: 600px) { .my-class { --my-property: 256px; } }',
    )
  })

  test('it unregisters a property', () => {
    const instance = new CustomPropertyStyleSheet(document)
    const setter = instance.registerProperty('.my-class', '--my-property')
    setter('256px')
    const setter2 = instance.registerProperty(
      '.my-class',
      '--my-other-property',
    )
    setter2('512px')
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe(
      '.my-class { --my-property: 256px; --my-other-property: 512px; }',
    )

    instance.unregisterProperty('.my-class', '--my-property')
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe(
      '.my-class { --my-other-property: 512px; }',
    )
    instance.unregisterProperty('.my-class', '--my-other-property')
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe('.my-class {  }')
  })

  test('it unregisters a property with media queries', () => {
    const instance = new CustomPropertyStyleSheet(document)
    const setter = instance.registerProperty(
      '.my-class-with-media',
      '--my-property-with-media',
      {
        mediaQuery: { 'max-width': '600px' },
      },
    )
    setter('256px')
    expect(instance.getStyleSheet().cssRules.length).toBe(1)
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe(
      '@media (max-width: 600px) { .my-class-with-media { --my-property-with-media: 256px; } }',
    )

    instance.unregisterProperty(
      '.my-class-with-media',
      '--my-property-with-media',
      {
        mediaQuery: { 'max-width': '600px' },
      },
    )
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe(
      '@media (max-width: 600px) { .my-class-with-media {  } }',
    )
  })
})
