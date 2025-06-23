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
  private ruleMap: Map<string, CSSStyleRule> | undefined

  constructor(styleSheet?: CSSStyleSheet | null) {
    if (styleSheet) {
      this.styleSheet = styleSheet
      console.log(
        `Using provided stylesheet with ${styleSheet.cssRules.length} rules.`,
        this,
      )
    } else {
      console.log('Creating new stylesheet for style properties.')
      this.styleSheet = new CSSStyleSheet()
      document.adoptedStyleSheets.push(this.getStyleSheet())
    }
  }

  /**
   * @param selector The CSS selector to apply the property to.
   * @param name The name of the property, without the `--` prefix.
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
      console.log(`Creating new style rule for selector: ${selector}`)
      const ruleIndex = this.styleSheet.insertRule(`${selector} {}`)
      rule = this.styleSheet.cssRules[ruleIndex] as CSSStyleRule
      this.ruleMap.set(selector, rule)
    }

    return (newValue: string) => {
      console.log(
        `Updating style property ${name} for selector ${selector} to ${newValue};`,
      )
      rule.style.setProperty(`--${name}`, newValue)
    }
  }

  public unregisterStyleProperty(selector: string, name: string): void {
    if (!this.ruleMap) {
      return
    }

    const rule = this.ruleMap.get(selector)
    if (rule) {
      console.log(`Removing style property ${name} for selector ${selector};`)
      rule.style.removeProperty(`--${name}`)
      if (rule.style.length === 0) {
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
