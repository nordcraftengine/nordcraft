import { z } from 'zod'

export const SCHEMA_DESCRIPTIONS = {
  animations: (type: string) => `Animations defined on this ${type}`,
  animationKey: `Unique key identifying the animation. This should be globally unique. Prefix with the name of the file to ensure uniqueness. Fx "myComponent-fadeIn"`,
  animationKeyframeKey: `Unique key identifying the keyframe`,
  apis: (type: string) =>
    `All APIs defined in the ${type}. APIs are used to fetch data from external services or backend systems. They can be called via actions and their data can be used in formulas.`,
  children: `A list of child node IDs. Every ID must correspond to a node defined in the "nodes" object of the component/page that includes this component node.`,
  condition: (type: string) =>
    `Formula evaluating to whether this ${type} is rendered or not. If false, undefined or null the ${type} is not rendered. Any other value means the ${type} is rendered.`,
  formulas: (type: string) =>
    `All formulas defined in the ${type}. Formulas are used to compute dynamic values based on variables, inputs, or other data.`,
  metadata: (type: string) =>
    `Metadata associated with this ${type}. This can include comments and other information useful for understanding the ${type}.`,
  onAttributeChange: (type: string) =>
    `Lifecycle event that is triggered when any of the ${type} attributes change. Declared actions will be executed in response to attribute changes, allowing the ${type} to react dynamically to different configurations.`,
  onLoad: (type: string) =>
    `Lifecycle event that is triggered when the ${type} is loaded. Declared actions will be executed when the ${type} loads, such as initializing variables or fetching data.`,
  repeat: (type: string) =>
    `Formula evaluating to an array of items to repeat this ${type} for.`,
  repeatKey: (type: string) =>
    `A Formula evaluating to a unique key for each repeated item. This is important for ensuring that the ${type} instances are correctly identified and managed during re-renders. This is rarely needed for simple arrays but is critical when rendering complex objects or when the array items can change dynamically.`,
  slot: (type: string) =>
    `Slot name for when this ${type} is rendered inside a component. Slot name must match the slot defined in the parent component. The default slot name is: "default".`,
  style: (type: string) => `This is the default style for this ${type}.`,
  testData: (type: string) =>
    `Test value for the ${type}. Test data is only used while building in the Nordcraft editor.`,
  variables: (type: string) =>
    `All variables defined in the ${type}. Variables hold dynamic data that can be used throughout the ${type} via formulas. They can be updated via actions.`,
  variants: (type: string) =>
    `Style variants defined on this ${type}. This could be a variant for hover, active, focus, media queries, or other state-based styles. Or even based on a class.`,
  workflows: (type: string) =>
    `All workflows defined in the ${type}. Workflows are sequences of actions that can be triggered by events or other workflows. They define the behavior of the ${type}.`,
}

// Base metadata schema used throughout
export const MetadataSchema = z
  .object({
    comments: z
      .record(
        z.string(),
        z.object({
          index: z.number(),
          text: z.string(),
        }),
      )
      .nullable(),
  })
  .nullable()
