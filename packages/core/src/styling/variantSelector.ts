import type {
  CustomProperty,
  CustomPropertyName,
  MediaQuery,
  NodeStyleModel,
} from '../component/component.types'
import type { Nullable } from '../types'

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

export interface StyleVariant {
  'even-child'?: Nullable<boolean>
  'first-child'?: Nullable<boolean>
  'first-of-type'?: Nullable<boolean>
  'focus-visible'?: Nullable<boolean>
  'focus-within'?: Nullable<boolean>
  'last-child'?: Nullable<boolean>
  'last-of-type'?: Nullable<boolean>
  'nth-child(even)'?: Nullable<boolean>
  'popover-open'?: Nullable<boolean>
  active?: Nullable<boolean>
  autofill?: Nullable<boolean>
  breakpoint?: Nullable<'small' | 'medium' | 'large'>
  checked?: Nullable<boolean>
  class?: Nullable<string>
  className?: Nullable<string>
  customProperties?: Nullable<Record<CustomPropertyName, CustomProperty>>
  disabled?: Nullable<boolean>
  empty?: Nullable<boolean>
  evenChild?: Nullable<boolean>
  firstChild?: Nullable<boolean>
  focus?: Nullable<boolean>
  focusWithin?: Nullable<boolean>
  hover?: Nullable<boolean>
  id?: Nullable<string>
  invalid?: Nullable<boolean>
  lastChild?: Nullable<boolean>
  link?: Nullable<boolean>
  mediaQuery?: Nullable<MediaQuery>
  pseudoElement?: Nullable<string>
  startingStyle?: Nullable<boolean>
  style: NodeStyleModel
  visited?: Nullable<boolean>
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
