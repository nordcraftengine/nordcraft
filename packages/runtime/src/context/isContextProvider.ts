/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import type { Component } from '@nordcraft/core/dist/component/component.types'

export const isContextProvider = (component: Component) => {
  if (component.formulas) {
    for (const key in component.formulas) {
      if (component.formulas[key]?.exposeInContext) {
        return true
      }
    }
  }
  if (component.workflows) {
    for (const key in component.workflows) {
      if (component.workflows[key]?.exposeInContext) {
        return true
      }
    }
  }
  return false
}
