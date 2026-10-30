import type { Component, ComponentData } from '@nordcraft/core'
import type { Signal } from '../signal/signal'

export function initLogState() {
  ;(window as any).logState = () => {
    const tableData: any[] = []
    if (window.__components) {
      for (const name in window.__components) {
        const sig = window.__components[name]
        tableData.push({
          name,
          ...(sig as any).get(),
        })
      }
    }
    // eslint-disable-next-line no-console
    console.table(tableData)
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
