import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import type { ValueOperation } from '@nordcraft/core/dist/formula/formula'
import { writeFileSync } from 'fs'
import type { ExportedHtmlElement } from '../types'

const init = () => {
  Object.entries(elements).forEach(([element, settings]) => {
    const { aliases, attrs, nodes, children } = settings
    const output: ExportedHtmlElement = {
      metadata: {
        description: `An HTML element representing the ${element} element.`,
        link: `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${element}`,
        aliases: aliases,
      },
      element: {
        type: 'nodes',
        source: 'catalog',
        nodes: {
          ...(nodes ?? {}),
          root: {
            tag: element,
            type: 'element',
            attrs: attrs ?? {},
            style: {},
            events: {},
            classes: {},
            children: children ?? [],
          },
        },
      },
    }
    writeFileSync(
      `./elements/${element}.json`,
      JSON.stringify(output, null, 2),
      'utf-8',
    )
  })
}

const elements: Record<
  string,
  {
    aliases: string[]
    attrs?: Record<string, ValueOperation>
    children?: string[]
    nodes?: Record<string, NodeModel>
  }
> = {
  a: {
    aliases: ['link', 'anchor'],
    attrs: {
      href: { type: 'value', value: '/' },
      'data-prerender': { type: 'value', value: 'moderate' },
    },
  },
  abbr: { aliases: ['abbreviation'] },
  address: { aliases: ['contact-info'] },
  area: {
    aliases: ['imagemap-area'],
    attrs: {
      alt: { type: 'value', value: '' },
      coords: { type: 'value', value: '' },
      shape: { type: 'value', value: 'rect' },
    },
  },
  article: { aliases: ['blog-post', 'news-article'] },
  aside: { aliases: ['sidebar'] },
  audio: { aliases: ['sound', 'music'] },
  b: { aliases: ['bold'] },
  base: {
    aliases: ['base-url'],
    attrs: {
      href: { type: 'value', value: '' },
    },
  },
  bdi: { aliases: ['bidirectional-isolation'] },
  bdo: {
    aliases: ['bidirectional-override'],
    attrs: {
      dir: { type: 'value', value: 'ltr' },
    },
  },
  blockquote: {
    aliases: ['quote', 'quotation'],
    attrs: {
      cite: { type: 'value', value: '' },
    },
  },
  br: { aliases: ['line-break'] },
  button: {
    aliases: ['form-button', 'action-button', 'submit-button'],
    attrs: {
      type: { type: 'value', value: 'button' },
    },
  },
  canvas: {
    aliases: ['drawing', 'graphics'],
  },
  caption: { aliases: ['table-caption'] },
  cite: { aliases: ['citation', 'reference'] },
  code: { aliases: ['inline-code', 'source-code'] },
  col: {
    aliases: ['table-column'],
  },
  colgroup: { aliases: ['table-column-group'] },
  data: {
    aliases: ['machine-readable'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  datalist: { aliases: ['input-suggestions'] },
  dd: { aliases: ['description-details'] },
  del: {
    aliases: ['deleted-text', 'remove'],
  },
  details: { aliases: ['disclosure', 'expandable'] },
  dfn: { aliases: ['definition'] },
  dialog: { aliases: ['modal', 'popup'] },
  div: { aliases: ['container', 'division'] },
  dl: { aliases: ['description-list'] },
  dt: { aliases: ['description-term'] },
  em: { aliases: ['emphasis', 'italic'] },
  embed: {
    aliases: ['external-content', 'plugin'],
    attrs: {
      src: { type: 'value', value: '' },
      type: { type: 'value', value: '' },
    },
  },
  fieldset: { aliases: ['form-group'] },
  figcaption: { aliases: ['figure-caption'] },
  figure: { aliases: ['illustration', 'media'] },
  footer: { aliases: ['page-footer', 'section-footer'] },
  form: {
    aliases: ['input-form', 'user-input'],
    attrs: {
      action: { type: 'value', value: '' },
    },
  },
  h1: { aliases: ['heading-1', 'main-heading'] },
  header: { aliases: ['page-header', 'section-header'] },
  hgroup: { aliases: ['heading-group'] },
  hr: { aliases: ['horizontal-rule', 'divider'] },
  i: { aliases: ['italic', 'alternate-voice'] },
  iframe: {
    aliases: ['inline-frame', 'embed-page', 'frame'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  img: {
    aliases: ['image', 'picture'],
    attrs: {
      src: { type: 'value', value: '' },
      alt: { type: 'value', value: '' },
    },
  },
  input: {
    aliases: ['form-input', 'user-input'],
    attrs: {
      type: { type: 'value', value: 'text' },
      value: { type: 'value', value: '' },
      placeholder: { type: 'value', value: '' },
    },
  },
  ins: {
    aliases: ['inserted-text', 'addition'],
  },
  kbd: { aliases: ['keyboard-input'] },
  label: {
    aliases: ['form-label'],
    attrs: {
      for: { type: 'value', value: '' },
    },
  },
  legend: { aliases: ['fieldset-caption'] },
  li: {
    aliases: ['list-item'],
  },
  link: {
    aliases: ['stylesheet-link', 'external-resource'],
    attrs: {
      rel: { type: 'value', value: '' },
      href: { type: 'value', value: '' },
    },
  },
  main: { aliases: ['main-content'] },
  map: {
    aliases: ['imagemap'],
    attrs: {
      name: { type: 'value', value: '' },
    },
  },
  mark: { aliases: ['highlight'] },
  menu: { aliases: ['context-menu', 'list-menu'] },
  meta: {
    aliases: ['metadata'],
  },
  meter: {
    aliases: ['gauge', 'measurement'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  nav: { aliases: ['navigation', 'menu'] },
  noscript: { aliases: ['no-javascript'] },
  object: {
    aliases: ['embedded-object', 'plugin'],
    attrs: {
      data: { type: 'value', value: '' },
      type: { type: 'value', value: '' },
    },
  },
  ol: { aliases: ['ordered-list', 'numbered-list', 'list'] },
  optgroup: {
    aliases: ['option-group'],
    attrs: {
      label: { type: 'value', value: '' },
    },
  },
  option: {
    aliases: ['select-option'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  output: {
    aliases: ['calculation-result'],
  },
  p: { aliases: ['paragraph', 'text-block', 'text'] },
  picture: { aliases: ['responsive-image', 'image'] },
  pre: { aliases: ['preformatted', 'code-block'] },
  progress: {
    aliases: ['progress-bar', 'loading'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  q: {
    aliases: ['inline-quote'],
    attrs: {
      cite: { type: 'value', value: '' },
    },
  },
  rp: { aliases: ['ruby-parenthesis'] },
  rt: { aliases: ['ruby-text'] },
  ruby: { aliases: ['ruby-annotation'] },
  s: { aliases: ['strikethrough', 'deleted'] },
  samp: { aliases: ['sample-output'] },
  script: {
    aliases: ['javascript', 'client-script'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  search: { aliases: ['search-region'] },
  section: { aliases: ['content-section'] },
  select: {
    aliases: ['dropdown', 'select-box'],
    attrs: {
      name: { type: 'value', value: '' },
    },
  },
  slot: { aliases: ['web-component-slot'] },
  small: { aliases: ['fine-print'] },
  source: {
    aliases: ['media-source'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  span: { aliases: ['inline-container'] },
  strong: { aliases: ['bold', 'importance'] },
  style: {
    aliases: ['css', 'stylesheet'],
  },
  sub: { aliases: ['subscript'] },
  summary: { aliases: ['details-summary'] },
  sup: { aliases: ['superscript'] },
  table: { aliases: ['data-table'] },
  tbody: { aliases: ['table-body'] },
  td: { aliases: ['table-cell'] },
  template: { aliases: ['html-template'] },
  textarea: {
    aliases: ['multiline-input'],
    attrs: {
      name: { type: 'value', value: '' },
    },
  },
  tfoot: { aliases: ['table-footer'] },
  th: { aliases: ['table-header-cell'] },
  thead: { aliases: ['table-header'] },
  time: {
    aliases: ['datetime', 'timestamp'],
    attrs: {
      datetime: { type: 'value', value: '' },
    },
  },
  tr: { aliases: ['table-row'] },
  track: {
    aliases: ['media-track', 'subtitles'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  u: { aliases: ['underline'] },
  ul: { aliases: ['unordered-list', 'bulleted-list', 'list'] },
  var: { aliases: ['variable'] },
  video: {
    aliases: ['movie', 'media', 'film'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  wbr: { aliases: ['word-break'] },
}

init()
