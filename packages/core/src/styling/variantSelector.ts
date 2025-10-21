import type {
  CustomProperty,
  CustomPropertyName,
  NodeStyleModel,
} from '../component/component.types'

export type Shadow = {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  inset: boolean
}

export type Filter =
  | {
      name: 'Blur'
      radius: number
    }
  | {
      name: 'Opacity'
      percent: number
    }

type MediaQuery = {
  'min-width'?: string
  'max-width'?: string
  'min-height'?: string
  'max-height'?: string
}

export interface StyleVariant {
  'even-child'?: boolean
  'first-child'?: boolean
  'first-of-type'?: boolean
  'focus-visible'?: boolean
  'focus-within'?: boolean
  'last-child'?: boolean
  'last-of-type'?: boolean
  'nth-child(even)'?: boolean
  'popover-open'?: boolean
  active?: boolean
  autofill?: boolean
  breakpoint?: 'small' | 'medium' | 'large' | null
  checked?: boolean
  class?: string
  className?: string
  customProperties?: Record<CustomPropertyName, CustomProperty>
  disabled?: boolean
  empty?: boolean
  evenChild?: boolean
  firstChild?: boolean
  focus?: boolean
  focusWithin?: boolean
  hover?: boolean
  id?: string
  invalid?: boolean
  lastChild?: boolean
  link?: boolean
  mediaQuery?: MediaQuery
  pseudoElement?: string
  startingStyle?: boolean
  style: NodeStyleModel
  visited?: boolean
}

export const variantSelector = (variant: StyleVariant) =>
  [
    (variant.className ?? variant['class']) && `.${variant.className}`,
    (variant.evenChild ??
      variant['even-child'] ??
      variant['nth-child(even)']) &&
      ':nth-child(even)',
    (variant.firstChild ?? variant['first-child']) && ':first-child',
    (variant.focusWithin ?? variant['focus-within']) && ':focus-within',
    (variant.lastChild ?? variant['last-child']) && ':last-child',
    variant.active && ':active',
    variant.autofill && ':is(:-webkit-autofill, :autofill)',
    variant.checked && ':checked',
    variant.disabled && ':disabled',
    variant.empty && ':empty',
    variant.focus && ':focus',
    variant.hover && ':hover',
    variant.invalid && ':invalid',
    variant.link && ':link',
    variant.visited && ':visited',
    variant['first-of-type'] && ':first-of-type',
    variant['focus-visible'] && ':focus-visible',
    variant['last-of-type'] && ':last-of-type',
    variant['popover-open'] && ':popover-open',
    variant.pseudoElement && `::${variant.pseudoElement}`,
  ]
    .filter(Boolean)
    .join('')
