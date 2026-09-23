import * as v from 'valibot'
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
import { record, SCHEMA_DESCRIPTIONS } from './valibot-schemas'

// Style and Animation
const NodeStyleModelSchema: v.GenericSchema<unknown, NodeStyleModel> = record(
  v.string(),
  v.string(),
)

const AnimationKeyframeSchema: v.GenericSchema<unknown, AnimationKeyframe> =
  v.object({
    position: v.pipe(
      v.number(),
      v.description(
        "Value between 0 and 1 representing the keyframe's position in the animation",
      ),
    ),
    key: v.pipe(v.string(), v.description('CSS property to be animated')),
    value: v.pipe(
      v.string(),
      v.description('Value of the CSS property at this keyframe'),
    ),
  })

const StyleTokenCategorySchema: v.GenericSchema<unknown, StyleTokenCategory> =
  v.picklist([
    'spacing',
    'color',
    'font-size',
    'font-weight',
    'z-index',
    'border-radius',
    'shadow',
  ])

const StyleVariantSchema: v.GenericSchema<unknown, StyleVariant> = v.object({
  style: NodeStyleModelSchema,
  id: v.nullish(v.string()),
  className: v.nullish(v.string()),
  hover: v.nullish(v.boolean()),
  active: v.nullish(v.boolean()),
  focus: v.nullish(v.boolean()),
  focusWithin: v.nullish(v.boolean()),
  disabled: v.nullish(v.boolean()),
  empty: v.nullish(v.boolean()),
  firstChild: v.nullish(v.boolean()),
  lastChild: v.nullish(v.boolean()),
  evenChild: v.nullish(v.boolean()),
  startingStyle: v.nullish(v.boolean()),
  mediaQuery: v.nullish(
    v.object({
      'min-width': v.nullish(v.string()),
      'max-width': v.nullish(v.string()),
      'min-height': v.nullish(v.string()),
      'max-height': v.nullish(v.string()),
      'prefers-reduced-motion': v.nullish(
        v.picklist(['reduce', 'no-preference']),
      ),
    }),
  ),
})

// Node Models
const TextNodeModelSchema: v.GenericSchema<unknown, TextNodeModel> = v.pipe(
  v.object({
    type: v.literal('text'),
    value: v.pipe(
      FormulaSchema,
      v.description('Formula evaluating to the text content.'),
    ),
    condition: v.pipe(
      v.nullish(FormulaSchema),
      v.description(SCHEMA_DESCRIPTIONS.condition('text node')),
    ),
    repeat: v.pipe(
      v.nullish(FormulaSchema),
      v.description(SCHEMA_DESCRIPTIONS.repeat('text node')),
    ),
    repeatKey: v.pipe(
      v.nullish(FormulaSchema),
      v.description(SCHEMA_DESCRIPTIONS.repeatKey('text node')),
    ),
    slot: v.pipe(
      v.nullish(v.string()),
      v.description(SCHEMA_DESCRIPTIONS.slot('text node')),
    ),
  }),
  v.description(
    'Schema defining a Text Node Model. A text node represents text content inside of an element.',
  ),
)

const SlotNodeModelSchema: v.GenericSchema<unknown, SlotNodeModel> = v.pipe(
  v.object({
    type: v.literal('slot'),
    children: v.pipe(
      v.array(v.string()),
      v.description(
        `${SCHEMA_DESCRIPTIONS.children}. These are the default child nodes for the slot. If no content is passed to the slot when used inside a component, these default child nodes will be rendered.`,
      ),
    ),
    name: v.pipe(
      v.nullish(v.string()),
      v.description(
        'Name of the slot. This is the name that must be used when passing content to this slot.',
      ),
    ),
    condition: v.pipe(
      v.nullish(FormulaSchema),
      v.description(SCHEMA_DESCRIPTIONS.condition('slot node')),
    ),
    slot: v.pipe(
      v.nullish(v.string()),
      v.description(SCHEMA_DESCRIPTIONS.slot('slot node')),
    ),
  }),
  v.description(
    'Schema defining a Slot Node Model. A slot is a placeholder for child nodes. Slot nodes can only exist inside components.',
  ),
)

const ElementNodeModelSchema: v.GenericSchema<unknown, ElementNodeModel> =
  v.pipe(
    v.object({
      type: v.literal('element'),
      tag: v.pipe(
        v.string(),
        v.description(
          'The HTML tag of the element node, such as "div", "span", "img", "a", etc.',
        ),
      ),
      attrs: v.pipe(
        record(v.string(), FormulaSchema),
        v.description(
          'Attributes of the element node such as "src", "alt", "href", or any other attribute that is applicable to the corresponding HTML element.',
        ),
      ),
      style: v.pipe(
        NodeStyleModelSchema,
        v.description(SCHEMA_DESCRIPTIONS.style('element node')),
      ),
      children: v.pipe(
        v.array(v.string()),
        v.description(SCHEMA_DESCRIPTIONS.children),
      ),
      events: v.pipe(
        record(v.string(), EventModelSchema),
        v.description(
          'Events on the element node such as "click", "hover", or any other event that is applicable to the corresponding HTML element.',
        ),
      ),
      classes: v.pipe(
        record(
          v.pipe(v.string(), v.description('The class name')),
          v.object({
            formula: v.pipe(
              v.nullish(FormulaSchema),
              v.description(
                'Formula that will determine when the class is applied. The class is applied when the formula is truthy.',
              ),
            ),
          }),
        ),
        v.description('Classes applied to this element node.'),
      ),
      'style-variables': v.pipe(
        v.nullish(
          v.array(
            v.object({
              category: v.pipe(
                StyleTokenCategorySchema,
                v.description('Category of the style token.'),
              ),
              name: v.pipe(
                v.string(),
                v.description('Name of the style token.'),
              ),
              formula: v.pipe(
                FormulaSchema,
                v.description('Formula defining the value of the token.'),
              ),
              unit: v.pipe(
                v.nullish(v.string()),
                v.description('Unit of the style token, if applicable.'),
              ),
            }),
          ),
        ),
        v.description(
          'Style variables defined on this element node. Style variables can be used to define design tokens such as colors, spacing, font sizes, and other reusable style values.',
        ),
      ),
      condition: v.pipe(
        v.nullish(FormulaSchema),
        v.description(SCHEMA_DESCRIPTIONS.condition('element node')),
      ),
      repeat: v.pipe(
        v.nullish(FormulaSchema),
        v.description(SCHEMA_DESCRIPTIONS.repeat('element node')),
      ),
      repeatKey: v.pipe(
        v.nullish(FormulaSchema),
        v.description(SCHEMA_DESCRIPTIONS.repeatKey('element node')),
      ),
      slot: v.pipe(
        v.nullish(v.string()),
        v.description(SCHEMA_DESCRIPTIONS.slot('element node')),
      ),
      variants: v.pipe(
        v.nullish(v.array(StyleVariantSchema)),
        v.description(SCHEMA_DESCRIPTIONS.variants('element node')),
      ),
      animations: v.pipe(
        v.nullish(
          record(
            v.pipe(v.string(), v.description(SCHEMA_DESCRIPTIONS.animationKey)),
            record(
              v.pipe(
                v.string(),
                v.description(SCHEMA_DESCRIPTIONS.animationKeyframeKey),
              ),
              AnimationKeyframeSchema,
            ),
          ),
        ),
        v.description(SCHEMA_DESCRIPTIONS.animations('element node')),
      ),
    }),
    v.description(
      'Schema defining an Element Node Model. An element is a standard HTML element.',
    ),
  )

const ComponentNodeModelSchema: v.GenericSchema<unknown, ComponentNodeModel> =
  v.pipe(
    v.object({
      type: v.literal('component'),
      name: v.pipe(
        v.string(),
        v.description('Name of the component to render.'),
      ),
      package: v.pipe(
        v.nullish(v.string()),
        v.description(
          'Name of the package this component comes from. If empty, it is a component defined in the current project.',
        ),
      ),
      attrs: v.pipe(
        record(
          v.pipe(v.string(), v.description('The name of the attribute')),
          v.pipe(
            FormulaSchema,
            v.description('Formula evaluating to the value of the attribute'),
          ),
        ),
        v.description('Attributes/props passed to the component.'),
      ),
      children: v.pipe(
        v.array(v.string()),
        v.description(SCHEMA_DESCRIPTIONS.children),
      ),
      events: v.pipe(
        record(v.string(), EventModelSchema),
        v.description(
          'Record of events passed to the component. Only custom events defined by the component can be passed here.',
        ),
      ),
      style: v.pipe(
        v.nullish(NodeStyleModelSchema),
        v.description(SCHEMA_DESCRIPTIONS.style('component node')),
      ),
      condition: v.pipe(
        v.nullish(FormulaSchema),
        v.description(SCHEMA_DESCRIPTIONS.condition('component node')),
      ),
      repeat: v.pipe(
        v.nullish(FormulaSchema),
        v.description(SCHEMA_DESCRIPTIONS.repeat('component node')),
      ),
      repeatKey: v.pipe(
        v.nullish(FormulaSchema),
        v.description(SCHEMA_DESCRIPTIONS.repeatKey('component node')),
      ),
      slot: v.pipe(
        v.nullish(v.string()),
        v.description(SCHEMA_DESCRIPTIONS.slot('component node')),
      ),
      variants: v.pipe(
        v.nullish(v.array(StyleVariantSchema)),
        v.description(SCHEMA_DESCRIPTIONS.variants('component node')),
      ),
      animations: v.pipe(
        v.nullish(
          record(
            v.pipe(v.string(), v.description(SCHEMA_DESCRIPTIONS.animationKey)),
            record(
              v.pipe(
                v.string(),
                v.description(SCHEMA_DESCRIPTIONS.animationKeyframeKey),
              ),
              AnimationKeyframeSchema,
            ),
          ),
        ),
        v.description(SCHEMA_DESCRIPTIONS.animations('component node')),
      ),
    }),
    v.description('Schema defining a Component Node Model.'),
  )

export const NodeModelSchema: v.GenericSchema<unknown, NodeModel> = v.lazy(() =>
  v.union([
    TextNodeModelSchema,
    SlotNodeModelSchema,
    ElementNodeModelSchema,
    ComponentNodeModelSchema,
  ]),
)
