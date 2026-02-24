import type { Component } from '@nordcraft/core/dist/component/component.types'

let componentMap: Map<string, Component> | null

/**
 * Project components is not expected to change during runtime, so we can memoize the components in a map for faster lookup.
 */
export const getComponent = (key: string, components: Component[]) =>
  (componentMap ??= new Map(components.map((c) => [c.name, c]))).get(key)
