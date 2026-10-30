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
  /** Adopted SSR nodes, for miss reporting. */
  claimedCount: number
  /** Stable paths that had to be created fresh (SSR/CSR skew). */
  createdPaths: string[]
  /** Stable paths of stale SSR nodes removed by the sweep. */
  sweptPaths: string[]
  /** Miss counts grouped by category (e.g. `created:div`, `swept:span`, `expected:script`). */
  missesByType: Record<string, number>
  /** Last parent element queried in `claimHydratedChild`. */
  lastParent?: Element | ShadowRoot
  /** Next child index to inspect in `lastParent.children` for O(1) sequential child claiming. */
  nextIndex: number
}

export interface HydrationResult {
  claimedCount: number
  created: number
  swept: number
  missesByType: Record<
    `expected:${string}` | `created:${string}` | `swept:${string}`,
    number
  >
}

export const createHydrationState = (): HydrationState => ({
  adopted: new Set(),
  sealed: false,
  claimedCount: 0,
  createdPaths: [],
  sweptPaths: [],
  missesByType: {},
  nextIndex: 0,
})

/**
 * Find a direct child of `parent` with the expected stable path and adopt it.
 * Returns `null` when no such child exists (caller creates a fresh node), or
 * once the hydration pass is sealed.
 */
export function claimHydratedChild(
  parent: Element | ShadowRoot,
  path: string,
  hydration: HydrationState,
): Element | null {
  if (hydration.sealed) {
    return null
  }
  const children = parent.children
  const len = children.length
  if (len === 0) {
    return null
  }

  const claimInRange = (from: number, to: number): Element | null => {
    for (let i = from; i < to; i++) {
      const child = children[i]!
      if (
        child.getAttribute(DATA_ATTR_ID) === path &&
        !hydration.adopted.has(child)
      ) {
        hydration.adopted.add(child)
        hydration.claimedCount++
        hydration.lastParent = parent
        hydration.nextIndex = i + 1
        return child
      }
    }
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

  return claimInRange(start, len) ?? claimInRange(0, start)
}

export function noteHydrationFallback(
  hydration: HydrationState,
  path: string,
  tag = 'unknown',
): void {
  if (hydration.sealed) {
    return
  }

  if (tag === 'script' || tag === 'SCRIPT') {
    hydration.missesByType['expected:script'] =
      (hydration.missesByType['expected:script'] ?? 0) + 1
    return
  }
  hydration.createdPaths.push(path)
  const key = `created:${tag.toLowerCase()}`
  hydration.missesByType[key] = (hydration.missesByType[key] ?? 0) + 1
}

/** Find a direct child by path without adopting it (for stale-node removal). */
export function peekHydratedChild(
  parent: Element | ShadowRoot,
  path: string,
): Element | null {
  const children = parent.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!
    if (child.getAttribute(DATA_ATTR_ID) === path) {
      return child
    }
  }
  return null
}

export function hydrationTagMatches(element: Element, tag: string): boolean {
  return element.tagName.toLowerCase() === tag.toLowerCase()
}

export function sweepUnhydratedNodes(
  root: Element | ShadowRoot,
  hydration: HydrationState,
): void {
  sweepUnhydratedChildren(root, hydration)
  hydration.sealed = true
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
        hydration.sweptPaths.push(child.getAttribute(DATA_ATTR_ID)!)
        const key = `swept:${child.tagName.toLowerCase()}`
        hydration.missesByType[key] = (hydration.missesByType[key] ?? 0) + 1
        child.remove()
      }
      continue
    }
    sweepUnhydratedChildren(child, hydration)
  }
}

/**
 * Report unexpected hydration misses (fallback creations + stale removals) and
 * save diagnostics on `globalThis.__nc_hydration_result`. Expected SSR/CSR
 * differences (such as client-only `<script>` tags or raw SVG text nodes) do
 * not trigger a console warning.
 */
export function reportHydrationResult(hydration: HydrationState): void {
  const created = hydration.createdPaths.length
  const swept = hydration.sweptPaths.length
  ;(
    globalThis as { __nc_hydration_result?: HydrationResult }
  ).__nc_hydration_result = {
    claimedCount: hydration.claimedCount,
    created,
    swept,
    missesByType: hydration.missesByType,
  }

  // Release DOM references for garbage collection
  hydration.adopted.clear()
  hydration.lastParent = undefined
  hydration.createdPaths.length = 0
  hydration.sweptPaths.length = 0
}
