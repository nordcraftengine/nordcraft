import { StylePropertyStyleSheet } from './StylePropertyStyleSheet'

describe('StylePropertyStyleSheet', () => {
  test('it creates a new stylesheet', () => {
    const instance = new StylePropertyStyleSheet()
    expect(instance).toBeInstanceOf(StylePropertyStyleSheet)
    expect(instance.getStyleSheet().cssRules).toHaveLength(0)
  })

  test('it adds a property definition', () => {
    const instance = new StylePropertyStyleSheet()
    instance.registerStyleProperty('.my-class', 'my-property')
    expect(instance.getStyleSheet().cssRules.length).toBe(1)
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe('.my-class {  }')
  })

  test('it puts different selectors in different rules', () => {
    const instance = new StylePropertyStyleSheet()
    instance.registerStyleProperty('.my-class', 'my-property')('256px')
    instance.registerStyleProperty('.my-other-class', 'my-property')('256px')
    expect(instance.getStyleSheet().cssRules.length).toBe(2)
    expect(instance.getStyleSheet().cssRules[0].cssText).toBe(
      '.my-class { --my-property: 256px; }',
    )
    expect(instance.getStyleSheet().cssRules[1].cssText).toBe(
      '.my-other-class { --my-property: 256px; }',
    )
  })

  test('it can update properties', () => {
    const instance = new StylePropertyStyleSheet()
    const setter = instance.registerStyleProperty('.my-class', 'my-property')
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
})
