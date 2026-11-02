import type { Component } from '@nordcraft/core'

const componentMaps = new WeakMap<Component[], Map<string, Component>>()

/**
 * Project components is not expected to change during runtime, so we can memoize the components in a map per components list for faster lookup.
 */
export const getComponent = (
  key: string,
  components: Component[],
  useCache = true,
) => {
  if (!useCache) {
    return components.find((c) => c.name === key)
  }
  let map = componentMaps.get(components)
  if (!map) {
    map = new Map(components.map((c) => [c.name, c]))
    componentMaps.set(components, map)
  }
  return map.get(key)
}
