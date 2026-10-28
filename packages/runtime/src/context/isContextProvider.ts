/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import type { Component } from '@nordcraft/core'

export const isContextProvider = (component: Component) => {
  const formulas = component.formulas
  if (formulas) {
    for (const name in formulas) {
      if (formulas[name]?.exposeInContext) {
        return true
      }
    }
  }
  const workflows = component.workflows
  if (workflows) {
    for (const name in workflows) {
      if (workflows[name]?.exposeInContext) {
        return true
      }
    }
  }
  return false
}
