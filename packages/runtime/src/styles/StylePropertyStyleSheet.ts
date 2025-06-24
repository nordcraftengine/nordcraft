/**
 * StylePropertyStyleSheet is a utility class that manages CSS custom properties
 * (variables) in a dedicated CSSStyleSheet. It allows for efficient registration,
 * updating, and removal of style properties as fast as setting style properties.
 *
 * It abstracts the complexity of managing CSS rules via. indexing and
 * provides a simple API to register and unregister style properties for specific
 * selectors.
 */
export class StylePropertyStyleSheet {
  private styleSheet: CSSStyleSheet

  // Selector to rule index mapping
  private ruleMap: Map<string, CSSStyleRule | CSSNestedDeclarations> | undefined

  constructor(styleSheet?: CSSStyleSheet | null) {
    if (styleSheet) {
      this.styleSheet = styleSheet
    } else {
      this.styleSheet = new CSSStyleSheet()
      document.adoptedStyleSheets.push(this.getStyleSheet())
    }
  }

  /**
   * @param selector The CSS selector to apply the property to.
   * @param name The name of the property, without the `--` prefix.
   * @param options Optional parameters to specify media queries or starting styles.
   *                - `media`: A media query string to apply the property under.
   *                - `startingStyle`: If true, the property will be applied as a starting style.
   * @returns A function to update the property value efficiently.
   */
  public registerStyleProperty(
    selector: string,
    name: string,
  ): (newValue: string) => void {
    this.ruleMap ??= this.generateRuleMap()

    // Check if the selector already exists
    let rule = this.ruleMap.get(selector)
    if (!rule) {
      const ruleIndex = this.styleSheet.insertRule(`${selector} {}`)
      let newRule = this.styleSheet.cssRules[ruleIndex]

      // We are only interested in the dynamic style, so get the actual style rule, not media or other nested rules
      while (
        Object.prototype.hasOwnProperty.call(newRule, 'cssRules') &&
        (newRule as CSSGroupingRule).cssRules.length
      ) {
        newRule = (newRule as CSSGroupingRule).cssRules[0]
      }
      rule = newRule as CSSStyleRule | CSSNestedDeclarations
      this.ruleMap.set(selector, rule)
    }

    return (newValue: string) => {
      rule.style.setProperty(`--${name}`, newValue)
    }
  }

  public unregisterStyleProperty(selector: string, name: string): void {
    if (!this.ruleMap) {
      return
    }

    const rule = this.ruleMap.get(selector)
    if (rule) {
      rule.style.removeProperty(`--${name}`)
      if (rule.style.length === 0) {
        let parentRule: CSSRule = rule
        while (rule.parentRule) {
          parentRule = rule.parentRule
        }
        this.styleSheet.deleteRule(
          Array.from(this.styleSheet.cssRules).indexOf(parentRule),
        )
        this.ruleMap.delete(selector)
      }
    }
  }

  public getStyleSheet(): CSSStyleSheet {
    return this.styleSheet
  }

  /**
   * Maps all selectors to their rule index. This is used to map the initial SSR style variable values
   * to their selectors.
   * This is only called once, when the first property is registered.
   */
  private generateRuleMap() {
    const ruleIndex: Map<string, CSSStyleRule> = new Map()
    for (let i = 0; i < this.styleSheet.cssRules.length; i++) {
      const rule = this.styleSheet.cssRules[i]
      if (rule instanceof CSSStyleRule) {
        ruleIndex.set(rule.selectorText, rule)
      }
    }
    return ruleIndex
  }
}
