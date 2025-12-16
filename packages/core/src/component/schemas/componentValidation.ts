import validate from './component.js'

/**
 * Validates a component structure against the pre-compile ajv function in component.js
 * The ajv function is built based on the component.schema.json file generated based on
 * the component types in src/component/component.types.ts
 */
export const validateComponent = (component: unknown) => {
  const valid = validate(component)
  return {
    valid,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    errors: valid ? [] : (((validate as any).errors as any[]) ?? []),
  }
}
