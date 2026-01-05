import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import {
  applyFormula,
  type ToddleEnv,
} from '@nordcraft/core/dist/formula/formula'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { getCookie } from '@nordcraft/std-lib/dist/formulas'
import { signal, type Signal } from '../signal/signal'

export const getThemeSignal = (
  component: Component,
  dataSignal: Signal<ComponentData>,
  env: ToddleEnv,
) => {
  const theme = component.route?.info?.theme
  const themeFormula = theme?.formula
  const dynamicTheme = themeFormula && themeFormula.type !== 'value'
  if (dynamicTheme) {
    const sig = dataSignal.map<string | null>(() =>
      component
        ? applyFormula(themeFormula, {
            data: dataSignal.get(),
            component,
            root: document,
            package: undefined,
            toddle: window.toddle,
            env,
          })
        : null,
    )

    return sig
  } else if (isDefined(themeFormula)) {
    // Set static theme value
    return signal<string | null>(themeFormula.value as string | null)
  } else {
    // This is the standard theme resolution logic, if not overridden:
    // 1. Check for 'theme' cookie
    // 2. Default to null
    //    2.1 No theme set explicitly will default to system preference
    //    2.2 Default theme (or initial value) is handled in CSS
    const initialThemeValue = getCookie.default(['theme'], {
      component,
      root: document,
      data: dataSignal.get(),
      env,
    })

    const sig = signal<string | null>(initialThemeValue as string | null)
    // Listen to cookie store API changes for 'theme'
    cookieStore.addEventListener('change', (event) => {
      for (const change of event.changed) {
        if (change.name === 'theme') {
          sig.set(change.value ?? null)
        }
      }
      for (const removal of event.deleted) {
        if (removal.name === 'theme') {
          sig.set(null)
        }
      }
    })

    return sig
  }
}
