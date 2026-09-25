import { getFontCssUrl } from './fonts'
import type { FontFamily } from './theme'

const font = (
  family: string,
  variants: Array<{ weight: string; italic: boolean }>,
): FontFamily => ({
  name: family.toLowerCase(),
  family,
  provider: 'google',
  type: 'sans-serif',
  variants: variants.map(({ weight, italic }) => ({
    name: `${family} ${weight}${italic ? ' italic' : ''}`,
    weight: weight as never,
    italic,
    url: `https://fonts.gstatic.com/s/${family.toLowerCase()}/v1/${weight}${
      italic ? 'i' : ''
    }.woff2`,
  })),
})

describe('getFontCssUrl()', () => {
  test('returns undefined for an empty list of fonts', () => {
    expect(getFontCssUrl({ fonts: [] })).toBeUndefined()
  })

  test('builds a url from family and weight', () => {
    expect(
      getFontCssUrl({
        fonts: [font('Lora', [{ weight: '400', italic: false }])],
      }),
    ).toMatchInlineSnapshot(`
        {
          "swap": "/.toddle/fonts/stylesheet/css2?display=swap&family=Lora%3Awght%40400",
        }
      `)
  })

  test('sorts weights numerically', () => {
    expect(
      getFontCssUrl({
        fonts: [
          font('Inter', [
            { weight: '700', italic: false },
            { weight: '100', italic: false },
            { weight: '400', italic: false },
          ]),
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "swap": "/.toddle/fonts/stylesheet/css2?display=swap&family=Inter%3Awght%40100%3B400%3B700",
      }
    `)
  })

  test('uses the ital,wght axes when the font has italic variants, with upright weights first', () => {
    expect(
      getFontCssUrl({
        fonts: [
          font('Inter', [
            { weight: '700', italic: true },
            { weight: '400', italic: false },
            { weight: '400', italic: true },
            { weight: '700', italic: false },
          ]),
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "swap": "/.toddle/fonts/stylesheet/css2?display=swap&family=Inter%3Aital%2Cwght%400%2C400%3B0%2C700%3B1%2C400%3B1%2C700",
      }
    `)
  })

  test('appends one family parameter per font', () => {
    expect(
      getFontCssUrl({
        fonts: [
          font('Lora', [{ weight: '400', italic: false }]),
          font('Inter', [{ weight: '600', italic: true }]),
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "swap": "/.toddle/fonts/stylesheet/css2?display=swap&family=Lora%3Awght%40400&family=Inter%3Aital%2Cwght%401%2C600",
      }
    `)
  })

  test('skips fonts without usable weights', () => {
    expect(
      getFontCssUrl({
        fonts: [
          { ...font('Lora', []), variants: undefined },
          font('Inter', [{ weight: '400', italic: false }]),
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "swap": "/.toddle/fonts/stylesheet/css2?display=swap&family=Inter%3Awght%40400",
      }
    `)
  })

  test('respects a custom basePath', () => {
    expect(
      getFontCssUrl({
        fonts: [font('Lora', [{ weight: '400', italic: false }])],
        basePath: '/custom/css2',
      }),
    ).toMatchInlineSnapshot(`
      {
        "swap": "/custom/css2?display=swap&family=Lora%3Awght%40400",
      }
    `)
  })

  test('returns an absolute url when baseForAbsoluteUrls is given', () => {
    expect(
      getFontCssUrl({
        fonts: [font('Lora', [{ weight: '400', italic: false }])],
        baseForAbsoluteUrls: 'https://my-app.nordcraft.com',
      }),
    ).toMatchInlineSnapshot(`
      {
        "swap": "https://my-app.nordcraft.com/.toddle/fonts/stylesheet/css2?display=swap&family=Lora%3Awght%40400",
      }
    `)
  })
})
