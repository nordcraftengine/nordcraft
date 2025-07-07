import type { CSSProperties } from 'react'
import type {
  AnimationKeyframe,
  EventModel,
  StyleVariable,
  StyleVariableLegacy,
} from '../component/component.types'
import type { Formula } from '../formula/formula'

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

export interface StyleDeclarationBlock extends CSSProperties {
  filters?: Filter[]
  shadows?: Shadow[]
}

type MediaQuery = {
  'min-width'?: string
  'max-width'?: string
  'min-height'?: string
  'max-height'?: string
}

export interface StyleVariant {
  autofill?: boolean
  'nth-child(even)'?: boolean
  'even-child'?: boolean
  'first-child'?: boolean
  'first-of-type'?: boolean
  'focus-visible'?: boolean
  'focus-within'?: boolean
  'last-child'?: boolean
  'last-of-type'?: boolean
  'popover-open'?: boolean
  active?: boolean
  breakpoint: 'small' | 'medium' | 'large'
  checked?: boolean
  class?: string
  className?: string
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
  style: StyleDeclarationBlock
  visited?: boolean
  'style-variables'?: Array<StyleVariable>
}

export interface NodeStyleModel extends StyleDeclarationBlock {
  variants?: StyleVariant[]
  breakpoints?: {
    small?: NodeStyleModel
    medium?: NodeStyleModel
    large?: NodeStyleModel
  }
  mediaQuery?: MediaQuery
}

export type NodeClass = {
  name: string
  formula?: Formula
}

export type NodeModel =
  | ElementNodeModel
  | TextNodeModel
  | ComponentNodeModel
  | SlotNodeModel

export type ElementNodeModel = {
  id: string
  type: 'element'
  condition?: Formula
  repeat?: Formula
  repeatKey?: Formula
  tag: string
  classList: NodeClass[]
  attrs: Record<string, Formula>
  style: NodeStyleModel
  variants?: StyleVariant[]
  animations?: Record<string, Record<string, AnimationKeyframe>>
  children: NodeModel[]
  events: EventModel[]
  'style-variables'?: Array<StyleVariableLegacy | StyleVariable>
}

export type ComponentNodeModel = {
  id: string
  type: 'component'
  path?: string
  name: string
  condition?: Formula
  repeat?: Formula
  repeatKey?: Formula
  style?: NodeStyleModel
  variants?: StyleVariant[]
  animations?: Record<string, Record<string, AnimationKeyframe>>
  attrs: Record<string, Formula>
  children: NodeModel[]
  events: EventModel[]
  'style-variables'?: Array<StyleVariable>
}

export type TextNodeModel = {
  id: string
  type: 'text'
  condition?: Formula
  repeat?: Formula
  repeatKey?: Formula
  value: Formula
  children?: undefined
}

export type SlotNodeModel = {
  id: string
  type: 'slot'
  condition?: Formula
  repeat?: undefined
  repeatKey?: Formula
  children: NodeModel[]
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
