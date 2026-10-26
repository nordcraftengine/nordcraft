import type { Formula, GlobalFormulas } from '@nordcraft/core'
import { getFormulasInFormula } from '@nordcraft/core'
import type { Route } from './ssr.types'

export class ToddleRoute<Handler> {
  private route: Route
  private globalFormulas: GlobalFormulas<Handler>

  constructor({
    route,
    globalFormulas,
  }: {
    route: Route
    globalFormulas: GlobalFormulas<Handler>
  }) {
    this.route = route
    this.globalFormulas = globalFormulas
  }

  /**
   * Traverse all formulas in the route
   * @returns An iterable that yields the path and formula.
   */
  *formulasInRoute(): Generator<{
    path: (string | number)[]
    formula: Formula
    packageName?: string
  }> {
    const globalFormulas = this.globalFormulas

    yield* getFormulasInFormula({
      formula: this.route.destination.url,
      globalFormulas,
      path: ['destination', 'url'],
    })
    for (const [key, path] of Object.entries(
      this.route.destination.path ?? {},
    )) {
      yield* getFormulasInFormula({
        formula: path.formula,
        globalFormulas,
        path: ['destination', 'path', key, 'formula'],
      })
    }
    for (const [key, q] of Object.entries(
      this.route.destination.queryParams ?? {},
    )) {
      yield* getFormulasInFormula({
        formula: q.formula,
        globalFormulas,
        path: ['destination', 'queryParams', key, 'formula'],
      })
      yield* getFormulasInFormula({
        formula: q.enabled,
        globalFormulas,
        path: ['destination', 'queryParams', key, 'enabled'],
      })
    }
  }

  get type() {
    return this.route.type
  }
  get source() {
    return this.route.source
  }
  get destination() {
    return this.route.destination
  }
  get status() {
    return this.route.type === 'redirect' ? this.route.status : undefined
  }
}
