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

// Runtime fallback for unbundled environments (unit tests and SSR etc.) where
// esbuild `define` has not replaced these identifiers. When bundled with esbuild,
// `typeof false === 'undefined'` constant-folds to `false` and is stripped.
if (typeof IS_PREVIEW === 'undefined') {
  globalThis.IS_PREVIEW = true
}
if (typeof IS_CUSTOM_ELEMENT === 'undefined') {
  globalThis.IS_CUSTOM_ELEMENT = true
}

export {}
