import type {
  Component,
  ComponentFormula,
  ComponentVariable,
  Nullable,
} from '@nordcraft/core'
import {
  filterObject,
  getClassName,
  getStaticStyleAndVariants,
  isDefined,
} from '@nordcraft/core'

// Component definitions and nodes are immutable snapshots of a project while a
// page is being rendered. The helpers below memoize derived data on those
// objects so repeated component instances do not redo the same work.

/**
 * `includedComponents` is created per render. Cache the name lookup per array
 * instance so component nodes can do an O(1) lookup instead of `some()`.
 */
const INCLUDED_COMPONENT_NAMES = new WeakMap<
  ReadonlyArray<Component>,
  ReadonlySet<string>
>()

export const getIncludedComponentNames = (
  components: ReadonlyArray<Component>,
) => {
  let names = INCLUDED_COMPONENT_NAMES.get(components)
  if (!names) {
    names = new Set(components.map((component) => component.name))
    INCLUDED_COMPONENT_NAMES.set(components, names)
  }
  return names
}

/**
 * Static styles (including static style-variables) never change for a given
 * node snapshot, but computing the class name re-stringifies the merged style
 * for every node render. Cache the result on the node object itself.
 */
const STATIC_CLASS_NAMES = new WeakMap<object, string>()

export const getStaticClassName = (
  node: Parameters<typeof getStaticStyleAndVariants>[0],
) => {
  const cached = STATIC_CLASS_NAMES.get(node)
  if (cached !== undefined) {
    return cached
  }
  const [style, variants] = getStaticStyleAndVariants(node)
  const className = style || variants ? getClassName([style, variants]) : ''
  STATIC_CLASS_NAMES.set(node, className)
  return className
}

/**
 * Tag names repeat heavily between nodes, and lower-casing them on every render
 * shows up in profiles. The set of distinct tags in a project is tiny.
 */
const LOWER_CASE_TAGS = new Map<string, string>()

export const getLowerCaseTag = (tag: string) => {
  let lowerTag = LOWER_CASE_TAGS.get(tag)
  if (lowerTag === undefined) {
    lowerTag = tag.toLocaleLowerCase()
    LOWER_CASE_TAGS.set(tag, lowerTag)
  }
  return lowerTag
}

/**
 * Variables without an initial value are skipped on every component instance.
 * Filter them once per component definition instead.
 */
const COMPONENT_VARIABLES = new WeakMap<
  Component,
  Record<string, ComponentVariable>
>()

export const getComponentVariables = (component: Component) => {
  let variables = COMPONENT_VARIABLES.get(component)
  if (!variables) {
    variables = filterObject<Nullable<ComponentVariable>, ComponentVariable>(
      component.variables ?? {},
      ([_, variable]) => isDefined(variable),
    )
    COMPONENT_VARIABLES.set(component, variables)
  }
  return variables
}

/**
 * Most components do not expose any formulas in their context, but the entries
 * are collected and filtered for every rendered instance. Cache the filtered
 * list per component definition.
 */
const COMPONENT_CONTEXT_FORMULAS = new WeakMap<
  Component,
  Array<[string, ComponentFormula]>
>()

export const getExposedContextFormulas = (component: Component) => {
  let formulas = COMPONENT_CONTEXT_FORMULAS.get(component)
  if (!formulas) {
    formulas = Object.entries(component.formulas ?? {}).filter(
      ([, formula]) => formula?.exposeInContext,
    ) as Array<[string, ComponentFormula]>
    COMPONENT_CONTEXT_FORMULAS.set(component, formulas)
  }
  return formulas
}
