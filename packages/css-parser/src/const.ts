export const lengthUnits = [
  'cap',
  'ch',
  'em',
  'ex',
  'ic',
  'lh',
  'rcap',
  'rch',
  'rem',
  'rex',
  'ric',
  'rlh',
  'vh',
  'svh',
  'lvh',
  'dvh',
  'vw',
  'svw',
  'lvw',
  'dvw',
  'vmax',
  'svmax',
  'lvmax',
  'dvmax',
  'vmin',
  'svmin',
  'lvmin',
  'dvmin',
  'vb',
  'svb',
  'lvb',
  'dvb',
  'vi',
  'svi',
  'lvi',
  'dvi',
  'cqw',
  'cqh',
  'cqi',
  'cqb',
  'cqmin',
  'cqmax',
  'px',
  'cm',
  'mm',
  'Q',
  'in',
  'pc',
  'pt',
  '%',
]

export const percentageUnits = ['%']

export const timeUnits = ['s', 'ms']
export const angleUnits = ['deg', 'turn', 'rad', 'grad']
export const resolutionUnits = ['dpi', 'dpcm', 'dppx', 'x']

export const rectangularColorSpace = [
  'srgb',
  'srgb-linear',
  'display-p3',
  'a98-rgb',
  'prophoto-rgb',
  'rec2020',
  'lab',
  'oklab',
  'xyz',
  'xyz-d50',
  'xyz-d65',
]

export const colorFunction = [
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'color-mix',
]

export const polarColorSpace = ['hsl', 'hwb', 'lch', 'oklch']

export const hueInterpolationMethod = [
  'shorter',
  'longer',
  'increasing',
  'decreasing',
  'hue',
]

export const visualBoxBg = ['content-box', 'padding-box', 'border-box']

export const attachmentBg = ['scroll', 'fixed', 'local']

export const repeatStyle = [
  'repeat-x',
  'repeat-y',
  'repeat',
  'space',
  'round',
  'no-repeat',
]

export const positionBg = ['left', 'right', 'center', 'top', 'bottom']

export const sizeBg = ['cover', 'contain', 'auto']

export const imageBg = [
  'url',
  'src',
  'linear-gradient',
  'radial-gradient',
  'repeating-linear-gradient',
  'repeating-radial-gradient',
  'conic-gradient',
]

export const lineStyle = [
  'none',
  'hidden',
  'dotted',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
]

export const outlineStyle = [
  'auto',
  'none',
  'dotted',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
]

export const textDecorationStyleValues = [
  'solid',
  'double',
  'dotted',
  'dashed',
  'wavy',
]

export const textDecorationLine = [
  'none',
  'underline',
  'overline',
  'line-through',
  'blink',
]

export const fontStretchValues = [
  'normal',
  'ultra-condensed',
  'extra-condensed',
  'condensed',
  'semi-condensed',
  'semi-expanded',
  'expanded',
  'extra-expanded',
  'ultra-expanded',
]

export const absoluteSize = [
  'xx-small',
  'x-small',
  'small',
  'medium',
  'large',
  'x-large',
  'xx-large',
  'xxx-large',
]

export const relativeSize = ['smaller', 'larger']

export const genericFonts = [
  'serif',
  'sans-serif',
  'system-ui',
  'cursive',
  'fantasy',
  'math',
  'monospace',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded ',
]

export const timingFunctions = [
  'ease',
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
]

export const globalValues = [
  'inherit',
  'initial',
  'revert',
  'revert-layer',
  'unset',
]

export const radialGradientShape = ['circle', 'ellipse']

export const radialGradientSize = [
  'closest-side',
  'farthest-side',
  'closest-corner',
  'farthest-corner',
]

export enum STYLE_PROPERTIES {
  'padding',
  'margin',
  'inset',
  'transition',
  'box-shadow',
  'text-shadow',
  'border',
  'border-top',
  'border-bottom',
  'border-left',
  'border-right',
  'borderRadius',
  'translate',
  'scale',
  'rotate',
  'perspective',
  'transform',
  'transform-style',
  'transform-box',
  'transform-origin',
  'font',
  'background',
  'outline',
  'flex',
  'row-gap',
  'column-gap',
  'overflow-x',
  'overflow-y',
  'textDecoration',
}
