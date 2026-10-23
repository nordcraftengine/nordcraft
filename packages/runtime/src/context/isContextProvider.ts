/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import type { Component } from '@nordcraft/core'

export const isContextProvider = (component: Component) =>
  (component.formulas &&
    Object.values(component.formulas).some((f) => f?.exposeInContext)) ||
  (component.workflows &&
    Object.values(component.workflows).some((w) => w?.exposeInContext))
