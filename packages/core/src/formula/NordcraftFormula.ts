import type { Formula } from './formula'
import type { GlobalFormulas } from './formulaTypes'
import { getFormulasInFormula } from './formulaUtils'

export class NordcraftFormula<Handler> {
  private formula: Formula
  private globalFormulas: GlobalFormulas<Handler>

  constructor({
    formula,
    globalFormulas,
  }: {
    formula: Formula
    globalFormulas: GlobalFormulas<Handler>
  }) {
    this.formula = formula
    this.globalFormulas = globalFormulas
  }

  /**
   * Traverse all formulas in the formula.
   * @returns An iterable that yields the path and formula.
   */
  *formulasInFormula(): Generator<{
    path: (string | number)[]
    formula: Formula
    packageName?: string
  }> {
    yield* getFormulasInFormula({
      formula: this.formula,
      globalFormulas: this.globalFormulas,
    })
  }
}
