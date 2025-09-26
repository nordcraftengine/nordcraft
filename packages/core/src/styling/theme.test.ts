import type { Theme } from './theme'
import { renderTheme } from './theme'

describe('renderTheme()', () => {
  test('it renders a theme correctly', () => {
    const theme: Theme = {
      fonts: [],
      propertyDefinitions: {
        '--my-color': {
          syntax: { type: 'primitive', name: 'color' },
          description: 'A custom color',
          inherits: true,
          initialValue: 'red',
          value: 'rebeccapurple',
        },
        '--my-other-color': {
          syntax: { type: 'primitive', name: 'color' },
          description: 'A custom color',
          inherits: true,
          initialValue: 'red',
          value: null,
        },
        '--my-third-prop': {
          syntax: { type: 'primitive', name: 'length-percentage' },
          description: 'A custom length or percentage',
          inherits: true,
          initialValue: null,
          value: 'var(--my-color)',
        },
      },
    }
    expect(renderTheme('[data-theme="my-theme"]', theme))
      .toMatchInlineSnapshot(`
      "[data-theme="my-theme"] {
        --my-color: rebeccapurple;
        --my-third-prop: var(--my-color);
      }"
    `)
  })
})
