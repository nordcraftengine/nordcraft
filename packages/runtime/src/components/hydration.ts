import { DATA_ATTR_ID } from '@nordcraft/core'

/**
 * State for hydrating (resuming) server-rendered DOM instead of rebuilding it.
 *
 * The hydration contract: SSR and the runtime produce identical `data-id`
 * paths for the initial render (see `packages/core/src/utils/nodePath.ts`).
 * During hydration the runtime claims the existing element with the expected
 * `data-id` and only attaches reactivity (signal subscriptions, event
 * listeners, API wiring) instead of creating a new node.
 *
 * `adopted` contains every SSR element that was claimed plus every element
 * created as a fallback. After the initial pass, any leftover element with a
 * `data-id` that was never adopted is stale (e.g. a conditional that is false
 * on the client) and is removed.
 */
export interface HydrationState {
  adopted: Set<Element>
  /**
   * Set once the initial hydration pass (render + sweep) completes. Later
   * dynamic work (repeat updates, conditional toggles) always builds fresh
   * nodes.
   */
  sealed: boolean
  /** Last parent element queried in `claimHydratedChild`. */
  lastParent?: Element | ShadowRoot
  /** Next child index to inspect in `lastParent.children` for O(1) sequential child claiming. */
  nextIndex: number
}

export const createHydrationState = (): HydrationState => ({
  adopted: new Set(),
  sealed: false,
  nextIndex: 0,
})

// eslint-disable-next-line max-params
function claimInRange(
  children: HTMLCollection,
  from: number,
  to: number,
  parent: Element | ShadowRoot,
  path: string,
  hydration: HydrationState,
  tag?: string,
): Element | null {
  for (let i = from; i < to; i++) {
    const child = children[i]!
    if (
      child.getAttribute(DATA_ATTR_ID) === path &&
      !hydration.adopted.has(child)
    ) {
      if (tag && child.tagName.toLowerCase() !== tag.toLowerCase()) {
        // SSR/CSR unexpected tag at a stable path, drop the stale node.
        child.remove()
        hydration.lastParent = parent
        hydration.nextIndex = i
        return null
      }
      hydration.adopted.add(child)
      hydration.lastParent = parent
      hydration.nextIndex = i + 1
      return child
    }
  }
  return null
}

/**
 * Find a direct child of `parent` with the expected stable path and adopt it.
 * When `tag` is provided, a matching child with a different tag name is
 * removed and `null` is returned so the caller builds a replacement node.
 * Returns `null` when no such child exists (caller creates a fresh node), or
 * once the hydration pass is sealed.
 */
// eslint-disable-next-line max-params
export function claimHydratedChild(
  parent: Element | ShadowRoot,
  path: string,
  hydration: HydrationState,
  tag?: string,
): Element | null {
  if (hydration.sealed) {
    return null
  }
  const children = parent.children
  const len = children.length
  if (len === 0) {
    return null
  }

  // Hydration traverses siblings in DOM order in the common case. When querying
  // the same parent consecutively, start at `nextIndex` (the sibling right after
  // the previously claimed child) so sequential claims resolve in O(1) instead
  // of scanning from index 0 every time. If the forward pass misses (e.g. out-of-order
  // claims or skipped nodes), wrap around and check the earlier siblings [0, start).
  const start =
    hydration.lastParent === parent && hydration.nextIndex < len
      ? hydration.nextIndex
      : 0

  return (
    claimInRange(children, start, len, parent, path, hydration, tag) ??
    claimInRange(children, 0, start, parent, path, hydration, tag)
  )
}

export function sweepUnhydratedNodes(
  root: Element | ShadowRoot,
  hydration: HydrationState,
): void {
  sweepUnhydratedChildren(root, hydration)
  hydration.sealed = true
  // Release DOM references for garbage collection
  hydration.adopted.clear()
  hydration.lastParent = undefined
}

function sweepUnhydratedChildren(
  root: Element | ShadowRoot,
  hydration: HydrationState,
): void {
  const children = root.children
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i]!
    if (!hydration.adopted.has(child)) {
      if (child.hasAttribute(DATA_ATTR_ID)) {
        child.remove()
      }
      continue
    }
    sweepUnhydratedChildren(child, hydration)
  }
}
