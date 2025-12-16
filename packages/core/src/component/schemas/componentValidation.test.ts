import type {
  Component,
  HeadTagTypes,
} from '@nordcraft/core/dist/component/component.types'
import { describe, expect, test } from 'bun:test'
import { validateComponent } from './componentValidation'

describe('Component schema', () => {
  test('should validate a simple component', () => {
    const component: Component = {
      attributes: {},
      onLoad: null,
      events: [],
      formulas: {},
      nodes: {},
      variables: {},
      apis: {},
      name: 'standard-component',
    }
    const result = validateComponent(component)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
  test("should validate the editor's 404 page component", () => {
    const component: Component = {
      apis: {},
      name: '404',
      nodes: {
        root: {
          tag: 'div',
          type: 'element',
          attrs: {},
          style: {
            width: '100vw',
            height: '100vh',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'align-items': 'center',
            'padding-top': '32px',
            'padding-left': '32px',
            'padding-right': '32px',
            'padding-bottom': '96px',
            'justify-content': 'center',
            'background-color': '#000',
          },
          events: {},
          classes: {},
          children: ['jYn6y3PDvOKeBym5JSD82', 'V8Pyi1etgQCxryisMVSU6'],
        },
        '3hmVMMxHAYJ-LtdcneGaU': {
          tag: 'h2',
          type: 'element',
          attrs: {},
          style: {
            color: 'var(--grey-200, #E5E5E5)',
            'font-size': '24px',
            'text-align': 'left',
            'font-weight': 'var(--font-weight-light)',
          },
          events: {},
          classes: {},
          children: ['LJMmxnFBBBHWumprAVp_z'],
        },
        '9wDYLqauFDigr_6uLNZ7F': {
          tag: 'path',
          type: 'element',
          attrs: {
            d: {
              type: 'value',
              value: 'M5 12l14 0',
            },
          },
          style: {},
          events: {},
          classes: {},
          children: [],
        },
        COO6oDeFXuo2OQyBm_ujJ: {
          tag: 'svg',
          type: 'element',
          attrs: {
            fill: {
              type: 'value',
              value: 'none',
            },
            width: {
              type: 'value',
              value: 32,
            },
            xmlns: {
              type: 'value',
              value: 'http://www.w3.org/2000/svg',
            },
            height: {
              type: 'value',
              value: 32,
            },
            stroke: {
              type: 'value',
              value: 'currentColor',
            },
            viewBox: {
              type: 'value',
              value: '0 0 24 24',
            },
            'stroke-width': {
              type: 'value',
              value: 1,
            },
            'stroke-linecap': {
              type: 'value',
              value: 'round',
            },
            'stroke-linejoin': {
              type: 'value',
              value: 'round',
            },
          },
          style: {
            display: 'none',
          },
          events: {},
          classes: {},
          children: [
            'YrrLOca3vSXPez833neik',
            '9wDYLqauFDigr_6uLNZ7F',
            'NJwCarX7x0F4fwbjfdHYY',
            'iVe8BFyq-ZnYTOcoWLief',
          ],
          variants: [
            {
              style: {
                display: 'flex',
                'flex-direction': 'column',
              },
              mediaQuery: {
                'min-width': '960px',
              },
            },
          ],
          'style-variables': [],
        },
        'EnAsdl1HAzy5-KEQ070Dz': {
          tag: 'a',
          type: 'element',
          attrs: {
            href: {
              type: 'value',
              value:
                'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404?retiredLocale=nl',
            },
            target: {
              type: 'value',
              value: '_blank',
            },
          },
          style: {
            color: 'var(--grey-200, #E5E5E5)',
            width: 'fit-content',
            'font-size': '16px',
            'text-align': 'left',
            'font-weight': 'var(--font-weight-light)',
          },
          events: {},
          classes: {},
          children: ['noZS8FJGN02YBnu5t8q1w'],
          variants: [
            {
              hover: true,
              style: {
                color: 'var(--yellow-400, #FBBF24)',
                cursor: 'pointer',
              },
            },
          ],
        },
        JEjLjwwrN7bfR3u8gEvzQ: {
          tag: 'div',
          type: 'element',
          attrs: {},
          style: {
            height: '240px',
            'align-items': 'center',
            'border-radius': '14px',
            'justify-content': 'center',
            'background-color': '#000',
          },
          events: {},
          classes: {},
          children: ['O5ldXQxeMZT8jzhDG5o9Q', 'v1_bHaycE2cxReKKZbmux'],
          variants: [
            {
              style: {
                height: '320px',
              },
              mediaQuery: {
                'min-width': '960px',
              },
            },
          ],
        },
        LJMmxnFBBBHWumprAVp_z: {
          type: 'text',
          value: {
            type: 'value',
            value: 'Sorry, this page is no longer here',
          },
        },
        LW_TeRqr9zCgylV8w6joo: {
          type: 'text',
          value: {
            type: 'value',
            value: 'Return to your projects',
          },
        },
        NJwCarX7x0F4fwbjfdHYY: {
          tag: 'path',
          type: 'element',
          attrs: {
            d: {
              type: 'value',
              value: 'M13 18l6 -6',
            },
          },
          style: {},
          events: {},
          classes: {},
          children: [],
        },
        O5ldXQxeMZT8jzhDG5o9Q: {
          tag: 'img',
          type: 'element',
          attrs: {
            alt: {
              type: 'value',
              value: '',
            },
            src: {
              type: 'value',
              value:
                '/cdn-cgi/imagedelivery/ZIty0Vhmkm0nD-fBKJrTZQ/toddle:eagle-greytone.png/public',
            },
          },
          style: {
            width: '100%',
            height: '100%',
            opacity: 0.5,
            position: 'absolute',
            'object-fit': 'cover',
            'border-radius': '14px',
          },
          events: {},
          classes: {},
          children: [],
        },
        'PH4rBNmbtrchoORw-vP8O': {
          tag: 'p',
          type: 'element',
          attrs: {},
          style: {
            color: 'var(--grey-400)',
            'font-size': '16px',
            'text-align': 'left',
            'font-weight': 'var(--font-weight-light)',
          },
          events: {},
          classes: {},
          children: ['bE_4XVOLtVPfCQw1LzJoC'],
        },
        V8Pyi1etgQCxryisMVSU6: {
          name: 'UtilityPageFooter',
          type: 'component',
          attrs: {},
          events: {},
          children: [],
        },
        YrrLOca3vSXPez833neik: {
          tag: 'path',
          type: 'element',
          attrs: {
            d: {
              type: 'value',
              value: 'M0 0h24v24H0z',
            },
            fill: {
              type: 'value',
              value: 'none',
            },
            stroke: {
              type: 'value',
              value: 'none',
            },
          },
          style: {},
          events: {},
          classes: {},
          children: [],
        },
        bE_4XVOLtVPfCQw1LzJoC: {
          type: 'text',
          value: {
            type: 'value',
            value: 'This issue is known as an "HTTP 404 Not Found" error.',
          },
        },
        bWh6EcY4xtJg4tmFw4HyP: {
          tag: 'a',
          type: 'element',
          attrs: {
            href: {
              type: 'value',
              value: 'https://app.nordcraft.com/projects',
            },
            'data-prerender': {
              type: 'value',
              value: 'none',
            },
          },
          style: {
            gap: '24px',
            color: 'var(--grey-200, #E5E5E5)',
            width: '100%',
            cursor: 'pointer',
            height: '80px',
            outline: 'none',
            'flex-wrap': 'wrap',
            'font-size': '20px',
            'align-items': 'center',
            'font-weight': 'var(--font-weight-light)',
            'padding-left': '24px',
            'border-radius': '14px',
            'padding-right': '24px',
            'flex-direction': 'row',
            'justify-content': 'center',
            'background-color': 'var(--grey-800, #262626)',
          },
          events: {},
          classes: {},
          children: ['LW_TeRqr9zCgylV8w6joo', 'COO6oDeFXuo2OQyBm_ujJ'],
          variants: [
            {
              hover: true,
              style: {
                'background-color': 'var(--grey-700, #404040)',
              },
            },
            {
              focus: false,
              style: {
                'outline-color': 'var(--blue-600, #2563EB)',
                'outline-style': 'solid',
                'outline-width': '1px',
              },
              'focus-visible': true,
            },
            {
              style: {
                'align-items': 'center',
                'flex-direction': 'row',
                'justify-content': 'space-between',
              },
              mediaQuery: {
                'min-width': '960px',
              },
            },
          ],
        },
        'iVe8BFyq-ZnYTOcoWLief': {
          tag: 'path',
          type: 'element',
          attrs: {
            d: {
              type: 'value',
              value: 'M13 6l6 6',
            },
          },
          style: {},
          events: {},
          classes: {},
          children: [],
        },
        jYn6y3PDvOKeBym5JSD82: {
          tag: 'div',
          type: 'element',
          attrs: {},
          style: {
            gap: '16px',
            width: '100%',
            'z-index': '1',
            'max-width': '560px',
            'padding-top': '12px',
            'user-select': 'none',
            'padding-left': '12px',
            'border-radius': '26px',
            'padding-right': '12px',
            'padding-bottom': '12px',
            'justify-content': '',
            'background-color': 'var(--grey-900, #171717)',
          },
          events: {},
          classes: {},
          children: [
            'JEjLjwwrN7bfR3u8gEvzQ',
            'n9x6syPNRfSlNFUW_mRbZ',
            'bWh6EcY4xtJg4tmFw4HyP',
          ],
          condition: null,
        },
        n9x6syPNRfSlNFUW_mRbZ: {
          tag: 'div',
          type: 'element',
          attrs: {},
          style: {
            gap: '16px',
            'padding-top': '16px',
            'padding-left': '16px',
            'padding-right': '16px',
            'padding-bottom': '16px',
          },
          events: {},
          classes: {},
          children: [
            '3hmVMMxHAYJ-LtdcneGaU',
            'PH4rBNmbtrchoORw-vP8O',
            'EnAsdl1HAzy5-KEQ070Dz',
          ],
        },
        noZS8FJGN02YBnu5t8q1w: {
          type: 'text',
          value: {
            type: 'value',
            value: 'Read more about 404 errors here.',
          },
        },
        v1_bHaycE2cxReKKZbmux: {
          tag: 'h1',
          type: 'element',
          attrs: {},
          style: {
            color: 'var(--light-blue)',
            width: '100%',
            'font-size': '32px',
            'text-align': 'center',
            'font-family': "'Playfair Display'",
            'font-weight': 'var(--font-weight-regular)',
            'padding-left': '24px',
            'padding-right': '24px',
          },
          events: {},
          classes: {},
          children: ['yKTgUVt_UaDOchk21eo1q'],
          variants: [
            {
              style: {
                'font-size': '48px',
              },
              mediaQuery: {
                'min-width': '960px',
              },
            },
          ],
        },
        yKTgUVt_UaDOchk21eo1q: {
          type: 'text',
          value: {
            type: 'value',
            value: 'This page is gone!',
          },
        },
      },
      route: {
        info: {
          meta: {
            '8A0zRbmjLkF6W9KaFrw16': {
              tag: 'script' as HeadTagTypes,
              attrs: {
                src: {
                  type: 'value',
                  value: 'https://plausible.io/js/script.js',
                },
                async: {
                  type: 'value',
                  value: true,
                },
                'data-domain': {
                  type: 'value',
                  value: 'nordcraft.com',
                },
              },
            },
            KlvExf9_gJRLDSDNzw1kx: {
              tag: 'meta' as HeadTagTypes,
              attrs: {
                content: {
                  type: 'value',
                  value:
                    '/cdn-cgi/imagedelivery/ZIty0Vhmkm0nD-fBKJrTZQ/toddle:ToddleOGImage(1)/full',
                },
                property: {
                  type: 'value',
                  value: 'og:image',
                },
              },
            },
          },
          title: {
            formula: {
              type: 'value',
              value: 'This page is gone',
            },
          },
          description: {
            formula: {
              type: 'value',
              value: 'This page is gone!',
            },
          },
        },
        path: [
          {
            name: '404',
            type: 'static',
          },
        ],
        query: {},
      },
      events: [],
      onLoad: null,
      formulas: {},
      variables: {},
      attributes: {},
    }
    const result = validateComponent(component)
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })
})
