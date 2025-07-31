import type { MediaQuery } from '@nordcraft/core/dist/component/component.types'

/**
 * CustomPropertyStyleSheet is a utility class that manages CSS custom properties
 * (variables) in a dedicated CSSStyleSheet. It allows for efficient registration,
 * updating, and removal of style properties as fast as setting style properties.
 *
 * It abstracts the complexity of managing CSS rules via. indexing and
 * provides a simple API to register and unregister style properties for specific
 * selectors.
 */
export class CustomPropertyStyleSheet {
  private styleSheet: CSSStyleSheet

  // Selector to rule index mapping
  private ruleMap: Map<string, CSSStyleRule | CSSNestedDeclarations> | undefined

  constructor(root: Document | ShadowRoot, styleSheet?: CSSStyleSheet | null) {
    if (styleSheet) {
      this.styleSheet = styleSheet
    } else {
      this.styleSheet = new CSSStyleSheet()
      root.adoptedStyleSheets.push(this.getStyleSheet())
    }
  }

  /**
   * @returns A function to update the property value efficiently.
   */
  public registerProperty(
    selector: string,
    name: string,
    options?: {
      mediaQuery?: MediaQuery
      startingStyle?: boolean
    },
  ): (newValue: string) => void {
    this.ruleMap ??= this.hydrateFromBase()
    const fullSelector = CustomPropertyStyleSheet.getFullSelector(
      selector,
      options,
    )

    // Check if the selector already exists
    let rule = this.ruleMap.get(fullSelector)
    if (!rule) {
      const ruleIndex = this.styleSheet.insertRule(fullSelector)
      let newRule = this.styleSheet.cssRules[ruleIndex]

      // We are only interested in the dynamic style, so get the actual style rule, not media or other nested rules. Loop until we are at the bottom most rule.
      while (
        (newRule as any).cssRules &&
        (newRule as CSSGroupingRule).cssRules.length > 0
      ) {
        newRule = (newRule as CSSGroupingRule).cssRules[0]
      }
      rule = newRule as CSSStyleRule | CSSNestedDeclarations
      this.ruleMap.set(fullSelector, rule)
    }

    return (value: string) => {
      rule.style.setProperty(name, value)
    }
  }

  public unregisterProperty(
    selector: string,
    name: string,
    options?: {
      mediaQuery?: MediaQuery
      startingStyle?: boolean
    },
  ): void {
    if (!this.ruleMap) {
      return
    }

    const fullSelector = CustomPropertyStyleSheet.getFullSelector(
      selector,
      options,
    )

    // We only clean up the property, as we assume that the rule will be reused.
    this.ruleMap.get(fullSelector)?.style.removeProperty(name)
  }

  public getStyleSheet(): CSSStyleSheet {
    return this.styleSheet
  }

  /**
   * Maps all selectors to their rule index. This is used to map the initial
   * SSR style variable values to their selectors.
   */
  private hydrateFromBase() {
    const ruleIndex: Map<string, CSSStyleRule> = new Map()
    for (let i = 0; i < this.styleSheet.cssRules.length; i++) {
      let rule = this.styleSheet.cssRules[i]
      const selector = CustomPropertyStyleSheet.selectorFromCSSRule(rule)
      // Get last part of the selector, which is the actual selector we are interested in
      while (
        (rule as CSSGroupingRule).cssRules &&
        (rule as CSSGroupingRule).cssRules.length > 0
      ) {
        rule = (rule as CSSGroupingRule).cssRules[0]
      }

      ruleIndex.set(selector, rule as CSSStyleRule)
    }
    return ruleIndex
  }

  private static selectorFromCSSRule(rule: CSSRule): string {
    switch (rule.constructor.name) {
      case 'CSSStyleRule':
        // For these rules, we just return (potentially with subrules if any cssRules exist)
        return `${(rule as CSSStyleRule).selectorText} { ${Array.from(
          (rule as CSSStyleRule).cssRules,
        )
          .map(CustomPropertyStyleSheet.selectorFromCSSRule)
          .join(', ')}}`
      case 'CSSStartingStyleRule':
        return `@starting-style { ${Array.from(
          (rule as CSSStartingStyleRule).cssRules,
        )
          .map(CustomPropertyStyleSheet.selectorFromCSSRule)
          .join(', ')}}`
      case 'CSSMediaRule':
        return `@media ${(rule as CSSMediaRule).media.mediaText} { ${Array.from(
          (rule as CSSMediaRule).cssRules,
        )
          .map(CustomPropertyStyleSheet.selectorFromCSSRule)
          .join(', ')}}`
      case 'CSSNestedDeclarations':
        return ''
      default:
        // eslint-disable-next-line no-console
        console.warn(
          `Unsupported CSS rule type: ${rule.constructor.name}. Returning empty selector.`,
        )
        return ''
    }
  }

  private static getFullSelector(
    selector: string,
    options?: {
      mediaQuery?: MediaQuery
      startingStyle?: boolean
    },
  ) {
    let result =
      selector + (options?.startingStyle ? ' { @starting-style { }}' : ' { }')
    if (options?.mediaQuery) {
      result = `@media (${Object.entries(options.mediaQuery)
        .map(([key, value]) => `${key}: ${value}`)
        .filter(Boolean)
        .join(') and (')}) { ${result}}`
    }

    return result
  }
}
