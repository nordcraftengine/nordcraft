import { z } from 'zod'
import type { StyleTokenCategory } from '../../styling/theme'
import type { StyleVariant } from '../../styling/variantSelector'
import type {
  AnimationKeyframe,
  ComponentNodeModel,
  ElementNodeModel,
  NodeModel,
  NodeStyleModel,
  SlotNodeModel,
  TextNodeModel,
} from '../component.types'
import { EventModelSchema } from './event-schema'
import { FormulaSchema } from './formula-schema'
import { SCHEMA_DESCRIPTIONS } from './zod-schemas'

// Style and Animation
const NodeStyleModelSchema: z.ZodType<NodeStyleModel> = z.record(
  z.string(),
  z.string(),
)

const AnimationKeyframeSchema: z.ZodType<AnimationKeyframe> = z.object({
  position: z
    .number()
    .describe(
      "Value between 0 and 1 representing the keyframe's position in the animation",
    ),
  key: z.string().describe('CSS property to be animated'),
  value: z.string().describe('Value of the CSS property at this keyframe'),
})

const StyleTokenCategorySchema: z.ZodType<StyleTokenCategory> = z.enum([
  'spacing',
  'color',
  'font-size',
  'font-weight',
  'z-index',
  'border-radius',
  'shadow',
])

const StyleVariantSchema: z.ZodType<StyleVariant> = z.object({
  style: NodeStyleModelSchema,
  id: z.string().optional().nullable(),
  className: z.string().optional().nullable(),
  hover: z.boolean().optional().nullable(),
  active: z.boolean().optional().nullable(),
  focus: z.boolean().optional().nullable(),
  focusWithin: z.boolean().optional().nullable(),
  disabled: z.boolean().optional().nullable(),
  empty: z.boolean().optional().nullable(),
  firstChild: z.boolean().optional().nullable(),
  lastChild: z.boolean().optional().nullable(),
  evenChild: z.boolean().optional().nullable(),
  startingStyle: z.boolean().optional().nullable(),
  mediaQuery: z
    .object({
      'min-width': z.string().optional().nullable(),
      'max-width': z.string().optional().nullable(),
      'min-height': z.string().optional().nullable(),
      'max-height': z.string().optional().nullable(),
      'prefers-reduced-motion': z.enum(['reduce', 'no-preference']).nullish(),
    })
    .optional()
    .nullable(),
})

// Node Models
const TextNodeModelSchema: z.ZodType<TextNodeModel> = z
  .object({
    type: z.literal('text'),
    value: FormulaSchema.describe('Formula evaluating to the text content.'),
    condition: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.condition('text node')),
    repeat: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.repeat('text node')),
    repeatKey: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.repeatKey('text node')),
    slot: z
      .string()
      .optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.slot('text node')),
  })
  .describe(
    'Schema defining a Text Node Model. A text node represents text content inside of an element.',
  )

const SlotNodeModelSchema: z.ZodType<SlotNodeModel> = z
  .object({
    type: z.literal('slot'),
    children: z
      .array(z.string())
      .describe(
        `${SCHEMA_DESCRIPTIONS.children}. These are the default child nodes for the slot. If no content is passed to the slot when used inside a component, these default child nodes will be rendered.`,
      ),
    name: z
      .string()
      .optional()
      .nullable()
      .describe(
        'Name of the slot. This is the name that must be used when passing content to this slot.',
      ),
    condition: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.condition('slot node')),
    slot: z
      .string()
      .optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.slot('slot node')),
  })
  .describe(
    'Schema defining a Slot Node Model. A slot is a placeholder for child nodes. Slot nodes can only exist inside components.',
  )

const ElementNodeModelSchema: z.ZodType<ElementNodeModel> = z
  .object({
    type: z.literal('element'),
    tag: z
      .string()
      .describe(
        'The HTML tag of the element node, such as "div", "span", "img", "a", etc.',
      ),
    attrs: z
      .record(z.string(), FormulaSchema)
      .describe(
        'Attributes of the element node such as "src", "alt", "href", or any other attribute that is applicable to the corresponding HTML element.',
      ),
    style: NodeStyleModelSchema.describe(
      SCHEMA_DESCRIPTIONS.style('element node'),
    ),
    children: z.array(z.string()).describe(SCHEMA_DESCRIPTIONS.children),
    events: z
      .record(z.string(), EventModelSchema)
      .describe(
        'Events on the element node such as "click", "hover", or any other event that is applicable to the corresponding HTML element.',
      ),
    classes: z
      .record(
        z.string().describe('The class name'),
        z
          .object({ formula: FormulaSchema.optional().nullable() })
          .describe(
            'Formula that will determine when the class is applied. The class is applied when the formula is truthy.',
          ),
      )
      .describe('Classes applied to this element node.'),
    'style-variables': z
      .array(
        z.object({
          category: StyleTokenCategorySchema.describe(
            'Category of the style token.',
          ),
          name: z.string().describe('Name of the style token.'),
          formula: FormulaSchema.describe(
            'Formula defining the value of the token.',
          ),
          unit: z
            .string()
            .optional()
            .nullable()
            .describe('Unit of the style token, if applicable.'),
        }),
      )
      .optional()
      .nullable()
      .describe(
        'Style variables defined on this element node. Style variables can be used to define design tokens such as colors, spacing, font sizes, and other reusable style values.',
      ),
    condition: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.condition('element node')),
    repeat: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.repeat('element node')),
    repeatKey: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.repeatKey('element node')),
    slot: z
      .string()
      .optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.slot('element node')),
    variants: z
      .array(StyleVariantSchema)
      .optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.variants('element node')),
    animations: z
      .record(
        z.string().describe(SCHEMA_DESCRIPTIONS.animationKey),
        z.record(
          z.string().describe(SCHEMA_DESCRIPTIONS.animationKeyframeKey),
          AnimationKeyframeSchema,
        ),
      )
      .optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.animations('element node')),
  })
  .describe(
    'Schema defining an Element Node Model. An element is a standard HTML element.',
  )

const ComponentNodeModelSchema: z.ZodType<ComponentNodeModel> = z
  .object({
    type: z.literal('component'),
    name: z.string().describe('Name of the component to render.'),
    package: z
      .string()
      .optional()
      .nullable()
      .describe(
        'Name of the package this component comes from. If empty, it is a component defined in the current project.',
      ),
    attrs: z
      .record(
        z.string().describe('The name of the attribute'),
        FormulaSchema.describe(
          'Formula evaluating to the value of the attribute',
        ),
      )
      .describe('Attributes/props passed to the component.'),
    children: z.array(z.string()).describe(SCHEMA_DESCRIPTIONS.children),
    events: z
      .record(z.string(), EventModelSchema)
      .describe(
        'Record of events passed to the component. Only custom events defined by the component can be passed here.',
      ),
    style: NodeStyleModelSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.style('component node')),
    condition: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.condition('component node')),
    repeat: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.repeat('component node')),
    repeatKey: FormulaSchema.optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.repeatKey('component node')),
    slot: z
      .string()
      .optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.slot('component node')),
    variants: z
      .array(StyleVariantSchema)
      .optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.variants('component node')),
    animations: z
      .record(
        z.string().describe(SCHEMA_DESCRIPTIONS.animationKey),
        z.record(
          z.string().describe(SCHEMA_DESCRIPTIONS.animationKeyframeKey),
          AnimationKeyframeSchema,
        ),
      )
      .optional()
      .nullable()
      .describe(SCHEMA_DESCRIPTIONS.animations('component node')),
  })
  .describe('Schema defining a Component Node Model.')

export const NodeModelSchema: z.ZodType<NodeModel> = z.lazy(() =>
  z.union([
    TextNodeModelSchema,
    SlotNodeModelSchema,
    ElementNodeModelSchema,
    ComponentNodeModelSchema,
  ]),
)
