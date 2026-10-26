import type { ValueOperation } from './formula'

/**
 * Helper function to create a value formula operation
 */
export const valueFormula = (
  value: string | number | boolean | null | object | undefined,
): ValueOperation => ({
  type: 'value',
  value,
})
