import { describe, expect, test } from 'bun:test'
import { transformRelativePaths } from './media'

describe('transformRelativePaths()', () => {
  const transformer = transformRelativePaths('https://toddle.dev')

  test('it transforms relative src attributes to be absolute', () => {
    expect(
      transformer({
        nodes: {
          '1': {
            type: 'element',
            attrs: {
              src: {
                type: 'value',
                value: '/foo/img.png',
              },
            },
          },
          '2': {
            type: 'element',
            attrs: {
              src: {
                type: 'value',
                value: 'picture.webp',
              },
            },
          },
          '3': {
            type: 'element',
            attrs: {
              src: {
                type: 'value',
                value: './img.png',
              },
            },
          },
        },
      } as any),
    ).toEqual({
      nodes: {
        '1': {
          type: 'element',
          attrs: {
            src: {
              type: 'value',
              value: 'https://toddle.dev/foo/img.png',
            },
          },
        },
        '2': {
          type: 'element',
          attrs: {
            src: {
              type: 'value',
              value: 'https://toddle.dev/picture.webp',
            },
          },
        },
        '3': {
          type: 'element',
          attrs: {
            src: {
              type: 'value',
              value: 'https://toddle.dev/img.png',
            },
          },
        },
      },
    } as any)
  })
  test('it keeps absolute urls', () => {
    expect(
      transformer({
        nodes: {
          '1': {
            type: 'element',
            attrs: {
              src: {
                type: 'value',
                value: 'https://picsum.photos/200/300',
              },
            },
          },
        },
      } as any),
    ).toEqual({
      nodes: {
        '1': {
          type: 'element',
          attrs: {
            src: {
              type: 'value',
              value: 'https://picsum.photos/200/300',
            },
          },
        },
      },
    } as any)
  })
  test('it does not transform non-src attributes', () => {
    expect(
      transformer({
        nodes: {
          '1': {
            type: 'element',
            attrs: {
              href: {
                type: 'value',
                value: '/foo',
              },
            },
          },
        },
      } as any),
    ).toEqual({
      nodes: {
        '1': {
          type: 'element',
          attrs: {
            href: {
              type: 'value',
              value: '/foo',
            },
          },
        },
      },
    } as any)
  })
})
