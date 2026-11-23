import type { Component } from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'

const abortControllerNeededCache = new WeakMap<Component, boolean>()

function hasDefinedEntry(record: Record<string, unknown> | null | undefined) {
  if (!record) {
    return false
  }
  for (const key in record) {
    if (isDefined(record[key])) {
      return true
    }
  }
  return false
}

function checkNeedsAbortController(component: Component): boolean {
  if (
    hasDefinedEntry(component.apis) ||
    (component.onLoad?.actions?.length ?? 0) > 0 ||
    (component.onAttributeChange?.actions?.length ?? 0) > 0 ||
    hasDefinedEntry(component.workflows)
  ) {
    return true
  }
  if (component.nodes) {
    for (const id in component.nodes) {
      const node = component.nodes[id]
      if (node && 'events' in node && hasDefinedEntry(node.events)) {
        return true
      }
    }
  }
  return false
}

/**
 * Returns true if the component has any APIs, lifecycle actions, workflows, or
 * node event handlers that can use `ctx.abortSignal`. Pure presentational
 * components can safely reuse the parent's `abortSignal` and skip allocating
 * an `AbortController` per instance.
 */
export function needsAbortController(component: Component): boolean {
  let cached = abortControllerNeededCache.get(component)
  if (cached === undefined) {
    cached = checkNeedsAbortController(component)
    abortControllerNeededCache.set(component, cached)
  }
  return cached
}
