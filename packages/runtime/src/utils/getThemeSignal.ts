import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import {
  applyFormula,
  type ToddleEnv,
} from '@nordcraft/core/dist/formula/formula'
import { THEME_COOKIE_NAME } from '@nordcraft/core/dist/styling/theme.const'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { signal, type Signal } from '../signal/signal'

// Theme signals based on the 'nc-theme' cookie are updated through a single
// shared cookieStore listener. Registering one listener per call would (a) leak
// every previously created theme signal (and the component tree reachable from
// its subscribers, since the listener closure captures the signal) and (b) add
// an event listener per mounted component.
let activeCookieThemeSignal: Signal<string | null> | null = null
let cookieListenerRegistered = false

const handleCookieStoreChange = (event: CookieChangeEvent) => {
  if (!activeCookieThemeSignal) {
    return
  }
  for (const change of event.changed) {
    if (change.name === THEME_COOKIE_NAME) {
      activeCookieThemeSignal.set(change.value ?? null)
    }
  }
  for (const removal of event.deleted) {
    if (removal.name === THEME_COOKIE_NAME) {
      activeCookieThemeSignal.set(null)
    }
  }
}

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
      applyFormula(themeFormula, {
        data: dataSignal.get(),
        component,
        root: document,
        package: undefined,
        toddle: window.toddle,
        env,
      }),
    )

    return sig
  } else if (isDefined(themeFormula)) {
    // Set static theme value
    return signal<string | null>(themeFormula.value as string | null)
  } else {
    // This is the standard theme resolution logic, if not overridden:
    // 1. Check for 'nc-theme' cookie
    // 2. Default to null
    //    2.1 No theme set explicitly will default to system preference
    //    2.2 Default theme (or initial value) is handled in CSS
    const initialThemeValue =
      document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${THEME_COOKIE_NAME}=`))
        ?.split('=')[1] ?? null

    const sig = signal<string | null>(initialThemeValue as string | null)
    activeCookieThemeSignal = sig
    sig.onDestroy(() => {
      if (activeCookieThemeSignal === sig) {
        activeCookieThemeSignal = null
      }
    })
    // Listen to cookie store API changes for 'nc-theme'
    if (!cookieListenerRegistered && 'cookieStore' in window) {
      cookieListenerRegistered = true
      cookieStore.addEventListener('change', handleCookieStoreChange)
    }

    return sig
  }
}
