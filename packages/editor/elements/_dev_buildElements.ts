import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import type { ValueOperation } from '@nordcraft/core/dist/formula/formula'
import { writeFileSync } from 'fs'
import type { ExportedHtmlElement, ExportedHtmlElementCategory } from '../types'

const init = () => {
  Object.entries(elements).forEach(([element, settings]) => {
    const { aliases, attrs, nodes, children, categories } = settings
    const output: ExportedHtmlElement = {
      metadata: {
        name: element,
        categories,
        description: `An HTML element representing the ${element} element.`,
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
      `./html/${element}.json`,
      JSON.stringify(output, null, 2),
      'utf-8',
    )
  })
  Object.entries(svgElements).forEach(([element, settings]) => {
    const { aliases, attrs, nodes, children, categories } = settings
    const output: ExportedHtmlElement = {
      metadata: {
        name: element,
        categories,
        description: `An SVG element representing the SVG ${element} element.`,
        link: `https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/${element}`,
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
      `./svg/${element}.json`,
      JSON.stringify(output, null, 2),
      'utf-8',
    )
  })
}

const elements: Record<
  string,
  {
    aliases: string[]
    categories: ExportedHtmlElementCategory[]
    attrs?: Record<string, ValueOperation>
    children?: string[]
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
    },
  },
  base: {
    aliases: ['base-url'],
    categories: ['semantic'],
    attrs: {
      href: { type: 'value', value: '' },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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
      MsVwQCP4yKPh_00L4fAhT: {
        type: 'text',
        value: {
          type: 'value',
          value: 'Text',
        },
      },
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

const svgElements: Record<
  string,
  {
    aliases: string[]
    categories: ExportedHtmlElementCategory[]
    attrs?: Record<string, ValueOperation>
    children?: string[]
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

init()
