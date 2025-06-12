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
    categories: ['html-element'],
    attrs: {
      href: { type: 'value', value: '/' },
      'data-prerender': { type: 'value', value: 'moderate' },
    },
  },
  abbr: { aliases: ['abbreviation'], categories: ['typography'] },
  address: { aliases: ['contact-info'], categories: ['html-element'] },
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
    categories: ['html-element'],
  },
  aside: { aliases: ['sidebar'], categories: ['html-element'] },
  audio: { aliases: ['sound', 'music'], categories: ['media'] },
  b: { aliases: ['bold'], categories: ['typography'] },
  base: {
    aliases: ['base-url'],
    categories: ['html-element'],
    attrs: {
      href: { type: 'value', value: '' },
    },
  },
  bdi: { aliases: ['bidirectional-isolation'], categories: ['typography'] },
  bdo: {
    aliases: ['bidirectional-override'],
    categories: ['typography'],
    attrs: {
      dir: { type: 'value', value: 'ltr' },
    },
  },
  blockquote: {
    aliases: ['quote', 'quotation'],
    categories: ['typography'],
    attrs: {
      cite: { type: 'value', value: '' },
    },
  },
  br: { aliases: ['line-break'], categories: ['typography'] },
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
  caption: { aliases: ['table-caption'], categories: ['html-element'] },
  cite: { aliases: ['citation', 'reference'], categories: ['typography'] },
  code: { aliases: ['inline-code', 'source-code'], categories: ['typography'] },
  col: {
    aliases: ['table-column'],
    categories: ['html-element'],
  },
  colgroup: { aliases: ['table-column-group'], categories: ['html-element'] },
  data: {
    aliases: ['machine-readable'],
    categories: ['html-element'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  datalist: { aliases: ['input-suggestions'], categories: ['form'] },
  dd: { aliases: ['description-details'], categories: ['html-element'] },
  del: {
    aliases: ['deleted-text', 'remove'],
    categories: ['typography'],
  },
  details: {
    aliases: ['disclosure', 'expandable'],
    categories: ['html-element'],
  },
  dfn: { aliases: ['definition'], categories: ['typography'] },
  dialog: { aliases: ['modal', 'popup'], categories: ['html-element'] },
  div: { aliases: ['container', 'division'], categories: ['html-element'] },
  dl: { aliases: ['description-list'], categories: ['html-element'] },
  dt: { aliases: ['description-term'], categories: ['html-element'] },
  em: { aliases: ['emphasis', 'italic'], categories: ['typography'] },
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
    categories: ['html-element'],
  },
  form: {
    aliases: ['input-form', 'user-input'],
    categories: ['form'],
    attrs: {
      action: { type: 'value', value: '' },
    },
  },
  h1: { aliases: ['heading-1', 'main-heading'], categories: ['typography'] },
  header: {
    aliases: ['page-header', 'section-header'],
    categories: ['html-element'],
  },
  hgroup: { aliases: ['heading-group'], categories: ['typography'] },
  hr: { aliases: ['horizontal-rule', 'divider'], categories: ['typography'] },
  i: { aliases: ['italic', 'alternate-voice'], categories: ['typography'] },
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
  },
  kbd: { aliases: ['keyboard-input'], categories: ['typography'] },
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
    categories: ['html-element'],
  },
  link: {
    aliases: ['stylesheet-link', 'external-resource'],
    categories: ['html-element'],
    attrs: {
      rel: { type: 'value', value: '' },
      href: { type: 'value', value: '' },
    },
  },
  main: { aliases: ['main-content'], categories: ['html-element'] },
  map: {
    aliases: ['imagemap'],
    categories: ['media'],
    attrs: {
      name: { type: 'value', value: '' },
    },
  },
  mark: { aliases: ['highlight'], categories: ['typography'] },
  menu: {
    aliases: ['context-menu', 'list-menu'],
    categories: ['html-element'],
  },
  meta: {
    aliases: ['metadata'],
    categories: ['html-element'],
  },
  meter: {
    aliases: ['gauge', 'measurement'],
    categories: ['form'],
    attrs: {
      value: { type: 'value', value: '' },
    },
  },
  nav: { aliases: ['navigation', 'menu'], categories: ['html-element'] },
  noscript: { aliases: ['no-javascript'], categories: ['html-element'] },
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
    categories: ['html-element'],
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
  },
  picture: { aliases: ['responsive-image', 'image'], categories: ['media'] },
  pre: { aliases: ['preformatted', 'code-block'], categories: ['typography'] },
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
    attrs: {
      cite: { type: 'value', value: '' },
    },
  },
  rp: { aliases: ['ruby-parenthesis'], categories: ['typography'] },
  rt: { aliases: ['ruby-text'], categories: ['typography'] },
  ruby: { aliases: ['ruby-annotation'], categories: ['typography'] },
  s: { aliases: ['strikethrough', 'deleted'], categories: ['typography'] },
  samp: { aliases: ['sample-output'], categories: ['typography'] },
  script: {
    aliases: ['javascript', 'client-script'],
    categories: ['html-element'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  search: { aliases: ['search-region'], categories: ['html-element'] },
  section: { aliases: ['content-section'], categories: ['html-element'] },
  select: {
    aliases: ['dropdown', 'select-box'],
    categories: ['form'],
    attrs: {
      name: { type: 'value', value: '' },
    },
  },
  small: { aliases: ['fine-print'], categories: ['typography'] },
  source: {
    aliases: ['media-source'],
    categories: ['media'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  span: { aliases: ['inline-container'], categories: ['html-element'] },
  strong: { aliases: ['bold', 'importance'], categories: ['typography'] },
  style: {
    aliases: ['css', 'stylesheet'],
    categories: ['html-element', 'svg'],
  },
  sub: { aliases: ['subscript'], categories: ['typography'] },
  summary: { aliases: ['details-summary'], categories: ['html-element'] },
  sup: { aliases: ['superscript'], categories: ['typography'] },
  table: { aliases: ['data-table'], categories: ['html-element'] },
  tbody: { aliases: ['table-body'], categories: ['html-element'] },
  td: { aliases: ['table-cell'], categories: ['html-element'] },
  template: { aliases: ['html-template'], categories: ['html-element'] },
  textarea: {
    aliases: ['multiline-input'],
    categories: ['form'],
    attrs: {
      name: { type: 'value', value: '' },
    },
  },
  tfoot: { aliases: ['table-footer'], categories: ['html-element'] },
  th: { aliases: ['table-header-cell'], categories: ['html-element'] },
  thead: { aliases: ['table-header'], categories: ['html-element'] },
  time: {
    aliases: ['datetime', 'timestamp'],
    categories: ['html-element'],
    attrs: {
      datetime: { type: 'value', value: '' },
    },
  },
  tr: { aliases: ['table-row'], categories: ['html-element'] },
  track: {
    aliases: ['media-track', 'subtitles'],
    categories: ['media'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  u: { aliases: ['underline'], categories: ['typography'] },
  ul: {
    aliases: ['unordered-list', 'bulleted-list', 'list'],
    categories: ['html-element'],
  },
  var: { aliases: ['variable'], categories: ['typography'] },
  video: {
    aliases: ['movie', 'media', 'film'],
    categories: ['media'],
    attrs: {
      src: { type: 'value', value: '' },
    },
  },
  wbr: { aliases: ['word-break'], categories: ['typography'] },
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
    categories: ['html-element', 'svg'],
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
