import type { PathOperation } from './formula'

/**
 * Helper function to create a path formula operation
 */
export const pathFormula = (path: string[]): PathOperation => ({
  type: 'path',
  path,
})
