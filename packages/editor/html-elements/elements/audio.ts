import type { ExportedHtmlElement } from '../../types'

const audio: ExportedHtmlElement = {
  metadata: {
    aliases: ['sound', 'music'],
    description: 'An audio element for embedding sound content',
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio',
  },
  element: {
    type: 'nodes',
    source: 'catalog',
    nodes: {
      root: {
        tag: 'audio',
        type: 'element',
        attrs: {
          src: {
            type: 'value',
            value:
              'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/52/a5/d2/52a5d2f1-2501-9f3a-e5c1-420c17c3e244/mzaf_11020025762956009770.plus.aac.p.m4a',
          },
          loop: {
            type: 'value',
            value: false,
          },
          preload: {
            type: 'value',
            value: false,
          },
          autoplay: {
            type: 'value',
            value: false,
          },
          controls: {
            type: 'value',
            value: true,
          },
        },
        style: {},
        events: {},
        classes: {},
        children: [],
      },
    },
  },
}
export default audio
