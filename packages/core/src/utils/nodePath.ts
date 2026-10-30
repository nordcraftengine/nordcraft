/**
 * Stable node paths (`data-id`) shared by SSR and the runtime.
 *
 * Path grammar (initial render):
 * - root: `"0"`
 * - child: `<parent>.<childIndex>` (e.g. `"0.1"`)
 * - repeat item: `<base>` for the first item, `<base>(<n>)` for later items
 *   (e.g. `"0"`, `"0(1)"`, `"0(2)"`), where `n` is the item index.
 * - slotted content: `<base>[<slotName>]` with `{<k>}` appended when several
 *   slots share the same name and `(<n>)` appended for repeats inside slots.
 *
 * The runtime keeps paths unique across *updates* with a lifetime counter
 * (see `createNode`), so post-update paths may use higher suffixes than the
 * item index (e.g. a prepended item becomes `0(2)`). SSR only ever renders
 * the initial state, so hydration only relies on the initial-render scheme
 * defined here. Both renderers must produce identical `data-id`s for the
 * initial render.
 */

/** `<parent>.<childIndex>`, e.g. `childPath("0", 1) === "0.1"` */
export function childPath(parentPath: string, childIndex: number): string {
  return `${parentPath}.${childIndex}`
}

/**
 * Repeat-item path for the initial render.
 * `repeatPath("0", 0) === "0"`, `repeatPath("0", 2) === "0(2)"`.
 * Pass `undefined` (or `0`) for the first item.
 */
export function repeatPath(
  basePath: string,
  repeatIndex: number | undefined,
): string {
  if (!repeatIndex) {
    return basePath
  }
  return `${basePath}(${repeatIndex})`
}

/** Parse the trailing `(n)` repeat suffix of a single path segment. */
export function parseRepeatSuffix(segment: string): {
  base: string
  repeatIndex: number | undefined
} {
  const open = segment.indexOf('(')
  if (open === -1 || !segment.endsWith(')')) {
    return { base: segment, repeatIndex: undefined }
  }
  const parsed = parseInt(segment.slice(open + 1, -1))
  if (!Number.isFinite(parsed)) {
    return { base: segment, repeatIndex: undefined }
  }
  return { base: segment.slice(0, open), repeatIndex: parsed }
}

/**
 * Build the slot suffix shared by SSR and runtime.
 * - `{k}` disambiguates several slots with the same name in one component.
 * - `(n)` disambiguates repeated content projected into a slot.
 */
export function buildSlotSuffix(
  slotSuffix?: string,
  slotComponentIndex?: number,
  slotRepeatIndex?: number,
): string {
  let currentSuffix = slotSuffix ?? ''
  if (slotComponentIndex && slotComponentIndex > 0) {
    const compSuffix = `{${slotComponentIndex}}`
    if (!currentSuffix.endsWith(compSuffix)) {
      currentSuffix += compSuffix
    }
  }
  if (slotRepeatIndex && slotRepeatIndex > 0) {
    const repSuffix = `(${slotRepeatIndex})`
    if (!currentSuffix.endsWith(repSuffix)) {
      currentSuffix += repSuffix
    }
  }
  return currentSuffix
}

/** Append a slot suffix to a path unless it is already there. */
export function applySlotSuffix(
  basePath: string,
  suffix: string | undefined,
): string {
  if (suffix && !basePath.endsWith(suffix)) {
    return `${basePath}${suffix}`
  }
  return basePath
}

/** Slotted-child base path, e.g. `slotBasePath("0", 0, "default") === "0.0[default]"` */
export function slotBasePath(
  parentPath: string,
  childIndex: number,
  slotName: string,
): string {
  return `${parentPath}.${childIndex}[${slotName}]`
}
