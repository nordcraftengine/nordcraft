import type { Component, ComponentData } from '@nordcraft/core'
import type { Signal } from '../signal/signal'

export function initLogState() {
  ;(window as any).logState = () => {
    // eslint-disable-next-line no-console
    console.table(
      Object.entries(window.__components ?? {}).map(([name, sig]) => {
        return {
          name,
          ...(sig as any).get(),
        }
      }),
    )
  }
}

export function registerComponentToLogState(
  component: Component,
  dataSignal: Signal<ComponentData>,
) {
  if (!window.__components) {
    window.__components = {}
  }

  window.__components[component.name] = dataSignal
}
