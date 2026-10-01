/* eslint-disable @typescript-eslint/no-unnecessary-condition */

/**
 * Compile-time build flags for dead-code elimination (DCE).
 *
 * Example usage:
 * ```ts
 * import './compileTime'
 *
 * if (IS_PREVIEW) {
 *   console.log('Running in preview mode')
 * }
 * ```
 */
declare global {
  var IS_PREVIEW: boolean
  var IS_CUSTOM_ELEMENT: boolean
}

globalThis.IS_PREVIEW ??= true
globalThis.IS_CUSTOM_ELEMENT ??= true

export {}
