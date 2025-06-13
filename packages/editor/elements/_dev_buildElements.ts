import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import type { ValueOperation } from '@nordcraft/core/dist/formula/formula'
import { writeFileSync } from 'fs'
import type { ExportedHtmlElement, ExportedHtmlElementCategory } from '../types'

const init = () => {
  Object.entries(elements).forEach(([element, settings]) => {
    const { aliases, attrs, nodes, categories } = settings
    const output: ExportedHtmlElement = {
      metadata: {
        name: element,
        categories,
        description:
          elementDescriptions[element] ??
          `An HTML element representing the ${element} element.`,
        link: `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${element}`,
        aliases: aliases,
        isVoid: [
          'area',
          'base',
          'br',
          'col',
          'embed',
          'hr',
          'img',
          'input',
          'link',
          'meta',
          'source',
          'track',
          'wbr',
        ].includes(element)
          ? true
          : undefined,
      },
      element: {
        type: 'nodes',
        source: 'catalog',
        nodes: {
          ...(nodes ?? {
            root: {
              tag: element,
              type: 'element',
              attrs: attrs ?? {},
              style: {},
              events: {},
              classes: {},
              children: [],
            },
          }),
        },
      },
    }
    writeFileSync(
      `./html/${element}.json`,
      JSON.stringify(output, null, 2),
      'utf-8',
    )
  })
  Object.entries(svgElements).forEach(([element, settings]) => {
    const { aliases, attrs, nodes, categories } = settings
    const output: ExportedHtmlElement = {
      metadata: {
        name: element,
        categories,
        description:
          svgDescriptions[element] ??
          `An SVG element representing the SVG ${element} element.`,
        link: `https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/${element}`,
        aliases: aliases,
      },
      element: {
        type: 'nodes',
        source: 'catalog',
        nodes: {
          ...(nodes ?? {
            root: {
              tag: element,
              type: 'element',
              attrs: attrs ?? {},
              style: {},
              events: {},
              classes: {},
              children: [],
            },
          }),
        },
      },
    }
    writeFileSync(
      `./svg/${element}.json`,
      JSON.stringify(output, null, 2),
      'utf-8',
    )
  })
}

const defaultTextElement: NodeModel = {
  type: 'text',
  value: {
    type: 'value',
    value: 'Text',
  },
}

const elements: Record<
  string,
  {
    aliases: string[]
    categories: ExportedHtmlElementCategory[]
    attrs?: Record<string, ValueOperation>
    nodes?: Record<string, NodeModel>
  }
> = {
  a: {
    aliases: ['link', 'anchor'],
    categories: ['semantic'],
    attrs: {
      href: { type: 'value', value: '/' },
      'data-prerender': { type: 'value', value: 'moderate' },
    },
    nodes: {
      root: {
        tag: 'a',
        type: 'element',
        attrs: {
          href: {
            type: 'value',
            value: '/',
          },
          'data-prerender': {
            type: 'value',
            value: 'moderate',
          },
        },
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Link',
        },
      },
    },
  },
  abbr: {
    aliases: ['abbreviation'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'abbr',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  address: { aliases: ['contact-info'], categories: ['semantic'] },
  area: {
    aliases: ['imagemap-area'],
    categories: ['media'],
    attrs: {
      alt: { type: 'value', value: '' },
      coords: { type: 'value', value: '' },
      shape: { type: 'value', value: 'rect' },
    },
  },
  article: {
    aliases: ['blog-post', 'news-article'],
    categories: ['semantic'],
  },
  aside: { aliases: ['sidebar'], categories: ['semantic'] },
  audio: { aliases: ['sound', 'music'], categories: ['media'] },
  b: {
    aliases: ['bold'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'b',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  bdi: {
    aliases: ['bidirectional-isolation'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'bdi',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  bdo: {
    aliases: ['bidirectional-override'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'categories',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
    attrs: {
      dir: { type: 'value', value: 'ltr' },
    },
  },
  blockquote: {
    aliases: ['quote', 'quotation'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'categories',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
    attrs: {
      cite: { type: 'value', value: '' },
    },
  },
  br: {
    aliases: ['line-break'],
    categories: ['typography'],
  },
  button: {
    aliases: ['form-button', 'action-button', 'submit-button'],
    categories: ['form'],
    attrs: {
      type: { type: 'value', value: 'button' },
    },
  },
  canvas: {
    aliases: ['drawing', 'graphics'],
    categories: ['media'],
  },
  caption: { aliases: ['table-caption'], categories: ['semantic'] },
  cite: {
    aliases: ['citation', 'reference'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'cite',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  code: {
    aliases: ['inline-code', 'source-code'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'code',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  col: {
    aliases: ['table-column'],
    categories: ['semantic'],
  },
  colgroup: { aliases: ['table-column-group'], categories: ['semantic'] },
  data: {
    aliases: ['machine-readable'],
    categories: ['semantic'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  datalist: { aliases: ['input-suggestions'], categories: ['form'] },
  dd: { aliases: ['description-details'], categories: ['semantic'] },
  del: {
    aliases: ['deleted-text', 'remove'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'categories',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  details: {
    aliases: ['disclosure', 'expandable'],
    categories: ['semantic'],
  },
  dfn: {
    aliases: ['definition'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'dfn',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  dialog: { aliases: ['modal', 'popup'], categories: ['semantic'] },
  div: { aliases: ['container', 'division'], categories: ['semantic'] },
  dl: { aliases: ['description-list'], categories: ['semantic'] },
  dt: { aliases: ['description-term'], categories: ['semantic'] },
  em: {
    aliases: ['emphasis', 'italic'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'em',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  embed: {
    aliases: ['external-content', 'plugin'],
    categories: ['media'],
    attrs: {
      src: { type: 'value', value: '' },
      type: { type: 'value', value: '' },
    },
  },
  fieldset: { aliases: ['form-group'], categories: ['form'] },
  figcaption: { aliases: ['figure-caption'], categories: ['media'] },
  figure: { aliases: ['illustration', 'media'], categories: ['media'] },
  footer: {
    aliases: ['page-footer', 'section-footer'],
    categories: ['semantic'],
  },
  form: {
    aliases: ['input-form', 'user-input'],
    categories: ['form'],
    attrs: {
      action: { type: 'value', value: '' },
    },
  },
  h1: {
    aliases: ['heading-1', 'main-heading'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'h1',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  h2: {
    aliases: ['heading-2', 'heading', 'sub-heading'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'h2',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  h3: {
    aliases: ['heading-3', 'heading', 'sub-heading'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'h3',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  h4: {
    aliases: ['heading-4', 'heading', 'sub-heading'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'h4',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  h5: {
    aliases: ['heading-5', 'heading', 'sub-heading'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'h5',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  h6: {
    aliases: ['heading-6', 'heading', 'sub-heading'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'h6',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  header: {
    aliases: ['page-header', 'section-header'],
    categories: ['semantic'],
  },
  hgroup: {
    aliases: ['heading-group'],
    categories: ['typography'],
  },
  hr: {
    aliases: ['horizontal-rule', 'divider'],
    categories: ['typography'],
  },
  i: {
    aliases: ['italic', 'alternate-voice'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'i',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  iframe: {
    aliases: ['inline-frame', 'embed-page', 'frame'],
    categories: ['media'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  img: {
    aliases: ['image', 'picture'],
    categories: ['media'],
    attrs: {
      src: { type: 'value', value: '' },
      alt: { type: 'value', value: '' },
    },
  },
  input: {
    aliases: ['form-input', 'user-input'],
    categories: ['form'],
    attrs: {
      type: { type: 'value', value: 'text' },
      value: { type: 'value', value: '' },
      placeholder: { type: 'value', value: '' },
    },
  },
  ins: {
    aliases: ['inserted-text', 'addition'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'categories',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  kbd: {
    aliases: ['keyboard-input'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'kbd',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  label: {
    aliases: ['form-label'],
    categories: ['form'],
    attrs: {
      for: { type: 'value', value: '' },
    },
  },
  legend: { aliases: ['fieldset-caption'], categories: ['form'] },
  li: {
    aliases: ['list-item'],
    categories: ['semantic'],
  },
  link: {
    aliases: ['stylesheet-link', 'external-resource'],
    categories: ['semantic'],
    attrs: {
      rel: { type: 'value', value: '' },
      href: { type: 'value', value: '' },
    },
  },
  main: { aliases: ['main-content'], categories: ['semantic'] },
  map: {
    aliases: ['imagemap'],
    categories: ['media'],
    attrs: {
      name: { type: 'value', value: '' },
    },
  },
  mark: {
    aliases: ['highlight'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'mark',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  menu: {
    aliases: ['context-menu', 'list-menu'],
    categories: ['semantic'],
  },
  meta: {
    aliases: ['metadata'],
    categories: ['semantic'],
  },
  meter: {
    aliases: ['gauge', 'measurement'],
    categories: ['form'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  nav: { aliases: ['navigation', 'menu'], categories: ['semantic'] },
  noscript: { aliases: ['no-javascript'], categories: ['semantic'] },
  object: {
    aliases: ['embedded-object', 'plugin'],
    categories: ['media'],
    attrs: {
      data: { type: 'value', value: '' },
      type: { type: 'value', value: '' },
    },
  },
  ol: {
    aliases: ['ordered-list', 'numbered-list', 'list'],
    categories: ['semantic'],
  },
  optgroup: {
    aliases: ['option-group'],
    categories: ['form'],
    attrs: {
      label: { type: 'value', value: '' },
    },
  },
  option: {
    aliases: ['select-option'],
    categories: ['form'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  output: {
    aliases: ['calculation-result'],
    categories: ['form'],
  },
  p: {
    aliases: ['paragraph', 'text-block', 'text'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'categories',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  picture: { aliases: ['responsive-image', 'image'], categories: ['media'] },
  pre: {
    aliases: ['preformatted', 'code-block'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'pre',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  progress: {
    aliases: ['progress-bar', 'loading'],
    categories: ['form'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  q: {
    aliases: ['inline-quote'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'categories',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
    attrs: {
      cite: { type: 'value', value: '' },
    },
  },
  rp: {
    aliases: ['ruby-parenthesis'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'rp',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  rt: {
    aliases: ['ruby-text'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'rt',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  ruby: {
    aliases: ['ruby-annotation'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'ruby',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  s: {
    aliases: ['strikethrough', 'deleted'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 's',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  samp: {
    aliases: ['sample-output'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'samp',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  script: {
    aliases: ['javascript', 'client-script'],
    categories: ['semantic'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  search: { aliases: ['search-region'], categories: ['form'] },
  section: { aliases: ['content-section'], categories: ['semantic'] },
  select: {
    aliases: ['dropdown', 'select-box'],
    categories: ['form'],
    attrs: {
      name: { type: 'value', value: '' },
    },
  },
  small: {
    aliases: ['fine-print'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'small',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  source: {
    aliases: ['media-source'],
    categories: ['media'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  span: { aliases: ['inline-container'], categories: ['semantic'] },
  strong: {
    aliases: ['bold', 'importance'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'strong',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  style: {
    aliases: ['css', 'stylesheet'],
    categories: ['semantic', 'svg'],
  },
  sub: {
    aliases: ['subscript'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'sub',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  summary: { aliases: ['details-summary'], categories: ['semantic'] },
  sup: {
    aliases: ['superscript'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'sup',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  table: { aliases: ['data-table'], categories: ['semantic'] },
  tbody: { aliases: ['table-body'], categories: ['semantic'] },
  td: { aliases: ['table-cell'], categories: ['semantic'] },
  template: { aliases: ['html-template'], categories: ['semantic'] },
  textarea: {
    aliases: ['multiline-input'],
    categories: ['form'],
    attrs: {
      name: { type: 'value', value: '' },
    },
  },
  tfoot: { aliases: ['table-footer'], categories: ['semantic'] },
  th: { aliases: ['table-header-cell'], categories: ['semantic'] },
  thead: { aliases: ['table-header'], categories: ['semantic'] },
  time: {
    aliases: ['datetime', 'timestamp'],
    categories: ['semantic'],
    attrs: {
      datetime: { type: 'value', value: '' },
    },
  },
  tr: { aliases: ['table-row'], categories: ['semantic'] },
  track: {
    aliases: ['media-track', 'subtitles'],
    categories: ['media'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  u: {
    aliases: ['underline'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'u',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  ul: {
    aliases: ['unordered-list', 'bulleted-list', 'list'],
    categories: ['semantic'],
  },
  var: {
    aliases: ['variable'],
    categories: ['typography'],
    nodes: {
      root: {
        tag: 'var',
        type: 'element',
        attrs: {},
        style: {},
        events: {},
        classes: {},
        children: ['MsVwQCP4yKPh_00L4fAhT'],
        'style-variables': [],
      },
      MsVwQCP4yKPh_00L4fAhT: defaultTextElement,
    },
  },
  video: {
    aliases: ['movie', 'media', 'film'],
    categories: ['media'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  wbr: {
    aliases: ['word-break'],
    categories: ['typography'],
  },
}

const elementDescriptions = {
  a: 'Defines a hyperlink to link to another page or resource',
  abbr: 'Represents an abbreviation or acronym, with an optional title for expansion',
  address: 'Provides contact information for a person, organization, or author',
  area: 'Defines a clickable area inside an image map',
  article: 'Represents a self-contained, independent piece of content',
  aside:
    'Contains content tangentially related to the main content, like a sidebar',
  audio: 'Embeds sound content such as music or audio streams',
  b: 'Renders text in bold for emphasis without conveying extra importance',
  bdi: 'Isolates a span of text that might have a different text direction',
  bdo: 'Overrides the current text direction for its children',
  blockquote: 'Indicates a section quoted from another source',
  br: 'Produces a single line break in text',
  button: 'Creates a clickable button for user interaction',
  canvas: 'Provides an area for drawing graphics via scripting',
  caption: 'Specifies the caption or title for a table',
  cite: 'Cites the title of a creative work',
  code: 'Displays a fragment of computer code',
  col: 'Specifies column properties for each column within a colgroup in a table',
  colgroup: 'Groups one or more columns in a table for formatting',
  data: 'Associates a machine-readable value with its human-readable content',
  datalist: 'Contains a set of option elements for input suggestions',
  dd: 'Provides the description or value for a term in a description list',
  del: 'Represents deleted or removed text',
  details: 'Creates a disclosure widget for additional information',
  dfn: 'Indicates the defining instance of a term',
  dialog: 'Represents a dialog box or other interactive component',
  div: 'Generic container for content, used for layout and styling',
  dl: 'Represents a description list of terms and their descriptions',
  dt: 'Specifies a term or name in a description list',
  em: 'Stresses emphasis of its contents, typically rendered in italics',
  embed: 'Embeds external content, like a plugin or interactive resource',
  fieldset: 'Groups related elements in a form',
  figcaption: 'Provides a caption or legend for a figure element',
  figure: 'Represents self-contained content, like images or diagrams',
  footer: 'Defines a footer for a section or page',
  form: 'Collects user input via interactive controls',
  h1: 'Represents a top-level heading',
  h2: 'Represents a second-level heading',
  h3: 'Represents a third-level heading',
  h4: 'Represents a fourth-level heading',
  h5: 'Represents a fifth-level heading',
  h6: 'Represents a sixth-level heading',
  header: 'Specifies introductory content or navigational links',
  hgroup: 'Groups a set of heading elements',
  hr: 'Creates a thematic break with a horizontal rule',
  i: 'Renders text in italic for alternate voice or mood',
  iframe: 'Embeds another HTML page within the current page',
  img: 'Embeds an image into the document',
  input: 'Accepts user input in a form',
  ins: 'Indicates inserted or added text',
  kbd: 'Represents user input, typically keyboard input',
  label: 'Defines a label for a form input',
  legend: 'Provides a caption for a fieldset',
  li: 'Represents an item in a list',
  link: 'Specifies relationships between the current document and external resources',
  main: 'Represents the main content of a document',
  map: 'Defines an image map with clickable areas',
  mark: 'Highlights text for reference or relevance',
  menu: 'Represents a list of commands or menu options',
  meta: 'Provides metadata about the HTML document',
  meter: 'Displays a scalar measurement within a known range',
  nav: 'Defines navigation links for the site or section',
  noscript: 'Provides alternate content for users without JavaScript',
  object: 'Embeds external resources like images, audio, or plugins',
  ol: 'Represents an ordered list of items',
  optgroup: 'Groups related options in a dropdown list',
  option: 'Defines an option in a select, datalist, or optgroup',
  output: 'Displays the result of a calculation or user action',
  p: 'Represents a paragraph of text',
  picture: 'Provides multiple sources for responsive images',
  pre: 'Displays preformatted text, preserving whitespace and line breaks',
  progress: 'Shows the progress of a task or operation',
  q: 'Indicates a short inline quotation',
  rp: 'Provides fallback text for browsers that do not support ruby annotations',
  rt: 'Specifies the pronunciation of characters in ruby annotations',
  ruby: 'Represents ruby annotation for East Asian typography',
  s: 'Renders text with a strikethrough, indicating inaccuracy or removal',
  samp: 'Represents sample output from a computer program',
  script: 'Embeds or references executable JavaScript code',
  search: 'Represents a search section within a document',
  section: 'Defines a standalone section of content',
  select: 'Creates a dropdown list for selecting options',
  small: 'Renders text in a smaller font size for side comments or fine print',
  source: 'Specifies multiple media resources for media elements',
  span: 'Generic inline container for text or other elements',
  strong: 'Indicates strong importance, typically rendered in bold',
  style: 'Embeds CSS styles within the document',
  sub: 'Renders text as subscript',
  summary: 'Provides a summary or heading for a details element',
  sup: 'Renders text as superscript',
  table: 'Represents tabular data in rows and columns',
  tbody: 'Groups the body content in a table',
  td: 'Defines a cell in a table row',
  template:
    'Holds client-side content that is not rendered when the page loads',
  textarea: 'Allows multi-line text input in a form',
  tfoot: 'Groups the footer content in a table',
  th: 'Defines a header cell in a table',
  thead: 'Groups the header content in a table',
  time: 'Represents a specific time or date',
  tr: 'Defines a row in a table',
  track: 'Provides text tracks for media elements like video or audio',
  u: 'Renders text with an underline',
  ul: 'Represents an unordered list of items',
  var: 'Represents a variable in a mathematical expression or programming context',
  video: 'Embeds a video player for video playback',
  wbr: 'Suggests a line break opportunity within text',
}

const svgElements: Record<
  string,
  {
    aliases: string[]
    categories: ExportedHtmlElementCategory[]
    attrs?: Record<string, ValueOperation>
    nodes?: Record<string, NodeModel>
  }
> = {
  svg: {
    aliases: ['vector', 'graphic', 'svg-root'],
    categories: ['semantic', 'svg'],
  },
  animate: { aliases: ['animation', 'svg-animate'], categories: ['svg'] },
  animateMotion: {
    aliases: ['motion-animation', 'svg-motion'],
    categories: ['svg'],
  },
  animateTransform: {
    aliases: ['transform-animation', 'svg-transform'],
    categories: ['svg'],
  },
  circle: { aliases: ['ellipse', 'svg-circle', 'round'], categories: ['svg'] },
  clipPath: {
    aliases: ['clipping', 'svg-clip', 'masking'],
    categories: ['svg'],
  },
  defs: { aliases: ['definitions', 'svg-defs'], categories: ['svg'] },
  desc: { aliases: ['description', 'svg-desc'], categories: ['svg'] },
  ellipse: { aliases: ['oval', 'svg-ellipse'], categories: ['svg'] },
  feBlend: { aliases: ['blend-filter', 'svg-blend'], categories: ['svg'] },
  feColorMatrix: {
    aliases: ['color-matrix', 'svg-color'],
    categories: ['svg'],
  },
  feComponentTransfer: {
    aliases: ['component-transfer', 'svg-component'],
    categories: ['svg'],
  },
  feComposite: {
    aliases: ['composite-filter', 'svg-composite'],
    categories: ['svg'],
  },
  feConvolveMatrix: {
    aliases: ['convolve-matrix', 'svg-convolve'],
    categories: ['svg'],
  },
  feDiffuseLighting: {
    aliases: ['diffuse-light', 'svg-lighting'],
    categories: ['svg'],
  },
  feDisplacementMap: {
    aliases: ['displacement-map', 'svg-displacement'],
    categories: ['svg'],
  },
  feDistantLight: {
    aliases: ['distant-light', 'svg-light'],
    categories: ['svg'],
  },
  feDropShadow: { aliases: ['drop-shadow', 'svg-shadow'], categories: ['svg'] },
  feFlood: { aliases: ['flood-filter', 'svg-flood'], categories: ['svg'] },
  feFuncA: { aliases: ['function-a', 'svg-func-a'], categories: ['svg'] },
  feFuncB: { aliases: ['function-b', 'svg-func-b'], categories: ['svg'] },
  feFuncG: { aliases: ['function-g', 'svg-func-g'], categories: ['svg'] },
  feFuncR: { aliases: ['function-r', 'svg-func-r'], categories: ['svg'] },
  feGaussianBlur: {
    aliases: ['gaussian-blur', 'svg-blur'],
    categories: ['svg'],
  },
  feImage: { aliases: ['image-filter', 'svg-image'], categories: ['svg'] },
  feMerge: { aliases: ['merge-filter', 'svg-merge'], categories: ['svg'] },
  feMergeNode: {
    aliases: ['merge-node', 'svg-merge-node'],
    categories: ['svg'],
  },
  feMorphology: {
    aliases: ['morphology-filter', 'svg-morphology'],
    categories: ['svg'],
  },
  feOffset: { aliases: ['offset-filter', 'svg-offset'], categories: ['svg'] },
  fePointLight: { aliases: ['point-light', 'svg-point'], categories: ['svg'] },
  feSpecularLighting: {
    aliases: ['specular-light', 'svg-specular'],
    categories: ['svg'],
  },
  feSpotLight: { aliases: ['spot-light', 'svg-spot'], categories: ['svg'] },
  feTile: { aliases: ['tile-filter', 'svg-tile'], categories: ['svg'] },
  feTurbulence: {
    aliases: ['turbulence-filter', 'svg-turbulence'],
    categories: ['svg'],
  },
  filter: { aliases: ['svg-filter', 'effect'], categories: ['svg'] },
  foreignObject: {
    aliases: ['foreign-object', 'svg-foreign'],
    categories: ['svg'],
  },
  g: { aliases: ['group', 'svg-group'], categories: ['svg'] },
  image: { aliases: ['svg-image', 'bitmap'], categories: ['svg'] },
  line: { aliases: ['svg-line', 'segment'], categories: ['svg'] },
  linearGradient: {
    aliases: ['linear-gradient', 'svg-gradient', 'gradient'],
    categories: ['svg'],
  },
  marker: { aliases: ['svg-marker', 'arrowhead'], categories: ['svg'] },
  mask: { aliases: ['svg-mask', 'masking'], categories: ['svg'] },
  metadata: { aliases: ['svg-metadata', 'meta'], categories: ['svg'] },
  mpath: { aliases: ['motion-path', 'svg-mpath'], categories: ['svg'] },
  path: { aliases: ['svg-path', 'bezier'], categories: ['svg'] },
  pattern: { aliases: ['svg-pattern', 'fill-pattern'], categories: ['svg'] },
  polygon: { aliases: ['svg-polygon', 'shape'], categories: ['svg'] },
  polyline: { aliases: ['svg-polyline', 'line-sequence'], categories: ['svg'] },
  radialGradient: {
    aliases: ['radial-gradient', 'svg-gradient', 'gradient'],
    categories: ['svg'],
  },
  rect: { aliases: ['rectangle', 'svg-rect', 'box'], categories: ['svg'] },
  script: {
    aliases: ['svg-script', 'js'],
    categories: ['svg'],
    attrs: {
      href: { type: 'value', value: '/' },
    },
  },
  set: { aliases: ['svg-set', 'attribute-set'], categories: ['svg'] },
  stop: {
    aliases: ['gradient-stop', 'svg-stop', 'gradient'],
    categories: ['svg'],
  },
  switch: { aliases: ['svg-switch', 'conditional'], categories: ['svg'] },
  symbol: { aliases: ['svg-symbol', 'icon'], categories: ['svg'] },
  text: { aliases: ['svg-text', 'label'], categories: ['svg'] },
  textPath: { aliases: ['text-path', 'svg-textpath'], categories: ['svg'] },
  title: { aliases: ['svg-title', 'caption'], categories: ['svg'] },
  tspan: { aliases: ['text-span', 'svg-tspan'], categories: ['svg'] },
  use: { aliases: ['svg-use', 'reference'], categories: ['svg'] },
  view: { aliases: ['svg-view', 'viewport'], categories: ['svg'] },
}

const svgDescriptions = {
  animate: 'Animates an attribute of an SVG element over time',
  animateMotion: 'Animates an element along a motion path',
  animateTransform:
    'Animates transformations such as scale, rotate, or translate on an element',
  circle: 'Draws a circle based on a center point and radius',
  clipPath:
    'Defines a clipping path to restrict the visible region of elements',
  defs: 'Container for elements that can be referenced later, such as gradients or filters',
  desc: 'Provides a description of the SVG content for accessibility',
  ellipse: 'Draws an ellipse based on a center point and radii',
  feBlend: 'Blends two images together using a specified blending mode',
  feColorMatrix:
    'Applies a matrix transformation to the colors of the input image, enabling effects like grayscale or sepia',
  feComponentTransfer:
    'Allows per-channel color manipulation using component transfer functions',
  feComposite: 'Combines images using arithmetic or compositing operations',
  feConvolveMatrix:
    'Applies a matrix convolution filter for effects like edge detection or blurring',
  feDiffuseLighting: 'Simulates diffuse lighting on an image for a 3D effect',
  feDisplacementMap:
    'Distorts an image using another image as a displacement map',
  feDistantLight: 'Defines a distant light source for lighting effects',
  feDropShadow:
    'Applies a drop shadow effect to the input image, allowing control over color, blur, and offset',
  feFlood: 'Fills the filter region with a solid color',
  feFuncA:
    'Defines the transfer function for the alpha (opacity) channel in feComponentTransfer',
  feFuncB:
    'Defines the transfer function for the blue channel in feComponentTransfer',
  feFuncG:
    'Defines the transfer function for the green channel in feComponentTransfer',
  feFuncR:
    'Defines the transfer function for the red channel in feComponentTransfer',
  feGaussianBlur: 'Applies a Gaussian blur effect to the input image',
  feImage: 'Uses an external image as input for a filter effect',
  feMerge: 'Combines multiple filter effects into a single output',
  feMergeNode: 'Specifies an input image to be merged in a feMerge filter',
  feMorphology: 'Applies erosion or dilation to the input image',
  feOffset: 'Offsets the input image by a specified amount',
  fePointLight: 'Defines a point light source for lighting effects',
  feSpecularLighting:
    'Simulates specular lighting on an image for shiny highlights',
  feSpotLight: 'Defines a spotlight source for lighting effects',
  feTile: 'Repeats the input image to fill the filter region',
  feTurbulence: 'Generates a noise or turbulence pattern for texture effects',
  filter:
    'Defines graphical effects like blurring or color shifting to be applied to elements',
  foreignObject:
    'Allows inclusion of non-SVG content, such as HTML, within an SVG',
  g: 'Groups SVG shapes together so they can be transformed or styled as a unit',
  image: 'Embeds an external image within the SVG',
  line: 'Draws a straight line between two points',
  linearGradient: 'Defines a linear color gradient for filling shapes',
  marker:
    'Defines shapes to be drawn at the start, middle, or end of lines or paths',
  mask: 'Defines a mask to control the visibility of parts of an element',
  metadata:
    'Embeds metadata within the SVG, such as licensing or author information',
  mpath: 'Defines a motion path for animateMotion',
  path: 'Draws complex shapes using a series of commands and coordinates',
  pattern: 'Defines a repeating graphic pattern for filling shapes',
  polygon: 'Draws a closed shape defined by a series of points',
  polyline: 'Draws a series of connected straight lines',
  radialGradient: 'Defines a radial color gradient for filling shapes',
  rect: 'Draws a rectangle, optionally with rounded corners',
  script: 'Embeds or references scripting code, such as JavaScript',
  set: 'Sets an attribute to a value for a specified duration',
  stop: 'Specifies a color and position in a gradient',
  svg: 'Container element for SVG graphics, defining the coordinate system and viewport',
  switch: 'Renders the first child element that matches certain conditions',
  symbol: 'Defines reusable graphical objects that are not rendered directly',
  text: 'Renders text within the SVG canvas',
  textPath: 'Renders text along the shape of a path',
  title: 'Provides a title for the SVG content, often shown as a tooltip',
  tspan:
    'Allows for styling or positioning parts of text within a text element',
  use: 'References and reuses an existing SVG element defined elsewhere',
  view: 'Defines a view for the SVG, specifying a viewport and transformation',
}

init()
