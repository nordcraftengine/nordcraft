import type { Theme } from './theme'
import { getThemeCss, getThemeEntries, renderThemeValues } from './theme'

describe('renderThemeValues()', () => {
  test('it renders a theme correctly', () => {
    const theme: Theme = {
      themes: {
        'my-theme': {},
      },
      fonts: [],
      propertyDefinitions: {
        '--my-color': {
          syntax: { type: 'primitive', name: 'color' },
          description: 'A custom color',
          inherits: true,
          initialValue: 'red',
          values: {
            'my-theme': 'rebeccapurple',
          },
        },
        '--my-other-color': {
          syntax: { type: 'primitive', name: 'color' },
          description: 'A custom color',
          inherits: true,
          initialValue: 'red',
          values: {},
        },
        '--my-third-prop': {
          syntax: { type: 'primitive', name: 'length-percentage' },
          description: 'A custom length or percentage',
          inherits: true,
          initialValue: null,
          values: {
            'my-theme': 'var(--my-color)',
          },
        },
      },
    }
    expect(
      renderThemeValues(
        '[data-theme="my-theme"]',
        getThemeEntries(theme, 'my-theme'),
      ),
    ).toMatchInlineSnapshot(`
      "[data-theme="my-theme"] {
        --my-color: rebeccapurple;
        --my-third-prop: var(--my-color);
      }"
    `)
  })
})

describe('getThemeCss()', () => {
  test('should render a full v2 theme correctly', () => {
    const theme: Theme = {
      themes: {
        'my-theme': {},
        'super-dark': {},
      },
      default: 'my-theme',
      defaultDark: 'super-dark',
      fonts: [],
      propertyDefinitions: {
        '--my-color': {
          syntax: { type: 'primitive', name: 'color' },
          description: 'A custom color',
          inherits: true,
          initialValue: 'red',
          values: {
            'my-theme': 'rebeccapurple',
            'super-dark': 'black',
          },
        },
        '--my-other-color': {
          syntax: { type: 'primitive', name: 'color' },
          description: 'A custom color',
          inherits: true,
          initialValue: 'var(--my-color)',
          values: {},
        },
        '--my-third-prop': {
          syntax: { type: 'primitive', name: 'length-percentage' },
          description: 'A custom length or percentage',
          inherits: true,
          initialValue: null,
          values: {
            'my-theme': 'var(--my-color)',
          },
        },
      },
    }

    expect(
      getThemeCss(
        { theme },
        { includeResetStyle: false, createFontFaces: false },
      ),
    ).toMatchInlineSnapshot(`
      "
        

        
        @property --my-color {
        syntax: "<color>";
        inherits: true;
        initial-value: red;
      }
      @property --my-other-color {
        syntax: "<color>";
        inherits: true;
        initial-value: red;
      }
      @property --my-third-prop {
        syntax: "<length-percentage>";
        inherits: true;
        initial-value: 0px;
      }

        :host, :root {
        --my-color: rebeccapurple;
        --my-third-prop: var(--my-color);
      }
        @media (prefers-color-scheme: dark) {
            :host, :root {
        --my-color: black;
      }
          }
        
        [data-theme~="my-theme"] {
        --my-color: rebeccapurple;
        --my-third-prop: var(--my-color);
      }
      [data-theme~="super-dark"] {
        --my-color: black;
      }
          


      @layer base {
        
        body, :host {
          /* Color */
          
          /* Fonts */
          

          /* Font size */
          
          /* Font weight */
          
          /* Shadows */
          
          /* Border radius */
          
          /* Spacing */
          
          /* Z-index */
          
        }
        @keyframes animation-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes animation-fade-in {
          from {
            opacity:0;
          }
          to {
            opacity:1;
          }
        }
        @keyframes animation-fade-out {
          from {
            opacity:1;
          }
          to {
            opacity:0;
          }
        }
      }
      "
    `)
  })
})
