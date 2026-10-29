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
  /** Last parent element queried in `claimHydratedChild`. */
  lastParent?: Element | ShadowRoot
  /** Cursor into `lastParent.children` for O(1) sequential child claiming. */
  lastIndex: number
}

export const createHydrationState = (): HydrationState => ({
  adopted: new Set(),
  sealed: false,
  claimedCount: 0,
  createdPaths: [],
  sweptPaths: [],
  lastIndex: 0,
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
  const start =
    hydration.lastParent === parent && hydration.lastIndex < len
      ? hydration.lastIndex
      : 0
  for (let i = start; i < len; i++) {
    const child = children[i]!
    if (
      child.getAttribute(DATA_ATTR_ID) === path &&
      !hydration.adopted.has(child)
    ) {
      hydration.adopted.add(child)
      hydration.claimedCount++
      hydration.lastParent = parent
      hydration.lastIndex = i + 1
      return child
    }
  }
  for (let i = 0; i < start; i++) {
    const child = children[i]!
    if (
      child.getAttribute(DATA_ATTR_ID) === path &&
      !hydration.adopted.has(child)
    ) {
      hydration.adopted.add(child)
      hydration.claimedCount++
      hydration.lastParent = parent
      hydration.lastIndex = i + 1
      return child
    }
  }
  return null
}

export function noteHydrationFallback(
  hydration: HydrationState,
  path: string,
): void {
  hydration.createdPaths.push(path)
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

export function hasHydratableContent(parent: Element | ShadowRoot): boolean {
  return parent.querySelector(`[${DATA_ATTR_ID}]`) !== null
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
        child.remove()
      }
      continue
    }
    sweepUnhydratedChildren(child, hydration)
  }
}

/**
 * Report hydration misses (fallback creations + stale removals). Misses are
 * not necessarily a problem: `is Server` conditionals and client-only API
 * data legitimately skew SSR/CSR
 */
export function reportHydrationResult(hydration: HydrationState): void {
  const created = hydration.createdPaths.length
  const swept = hydration.sweptPaths.length
  if (created > 0 || swept > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `Hydration misses: adopted ${hydration.claimedCount} SSR node(s)` +
        (created > 0 ? `, created ${created} missing node(s)` : '') +
        (swept > 0 ? `, removed ${swept} stale SSR node(s)` : ''),
    )
  }

  // Send off to garbage collection
  hydration.adopted.clear()
  hydration.lastParent = undefined
  hydration.createdPaths.length = 0
  hydration.sweptPaths.length = 0
}
