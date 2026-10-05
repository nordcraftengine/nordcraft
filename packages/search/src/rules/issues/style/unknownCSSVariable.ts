import type { CustomProperty } from '@nordcraft/core/dist/component/component.types'
import type { CustomPropertyDefinition } from '@nordcraft/core/dist/styling/theme'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { FixFunction, IssueRule, StyleNode } from '../../../types'

const REGEX = /var\(\s*(--[\w-]+)/g

export const unknownCSSVariableRule: IssueRule<
  {
    name: string
  },
  StyleNode
> = {
  code: 'unknown css variable',
  level: 'warning',
  category: 'Unknown Reference',
  nodeTypes: 'style-declaration',
  visit: (report, { path, value, files, memo }) => {
    if (typeof value.styleValue !== 'string') {
      return
    }
    if (!value.styleValue.includes('var(')) {
      return
    }

    const theme = files.themes?.Default
    // Issue rule only available for projects using v2 themes
    if (!isDefined(theme?.propertyDefinitions)) {
      return
    }

    // Has a style property definition
    const vars = [...value.styleValue.matchAll(REGEX)].map(
      ([_, varName]) => varName,
    )
    if (vars.length === 0) {
      return
    }

    const themeCssVariables = theme.propertyDefinitions
    const componentName = path[1]
    const nodeName = path[3]
    const component = files.components[componentName as string]
    const nodes = component?.nodes ?? {}
    const parentByNode = memo(`component-parents-${componentName}`, () => {
      const map = new Map<string, string>()
      for (const [name, node] of Object.entries(nodes)) {
        const children = (node as { children?: unknown })?.children
        if (Array.isArray(children)) {
          for (const child of children) {
            if (typeof child === 'string' && !map.has(child)) {
              map.set(child, name)
            }
          }
        }
      }
      return map
    }) as Map<string, string>
    const varsCache = memo(
      `component-css-variables-cache-${componentName}`,
      () => new Map<string, Set<string>>(),
    ) as Map<string, Set<string>>

    const collectOwnVars = (node: {
      type?: string
      name?: string
      customProperties?: Record<string, unknown>
      variants?: Array<{
        customProperties?: Record<string, unknown>
        style?: Record<string, unknown>
      }>
      style?: Record<string, unknown>
      'style-variables'?: Array<{ name: string }>
    }): Set<string> => {
      const vars = new Set<string>()
      if (node.type !== 'component' && node.type !== 'element') {
        return vars
      }
      const customProperties = node.customProperties
      if (customProperties) {
        for (const varName in customProperties) {
          vars.add(varName)
        }
      }
      const variants = node.variants
      if (variants) {
        for (const variant of variants) {
          const variantCustomProperties = variant.customProperties
          if (variantCustomProperties) {
            for (const varName in variantCustomProperties) {
              vars.add(varName)
            }
          }
        }
      }

      // Also add legacy style variables
      if (node.type === 'element' && node['style-variables']) {
        for (const styleVar of node['style-variables']) {
          vars.add(`--${styleVar.name}`)
        }
      }

      // Add if declared in any parent styles object
      const style = node.style
      if (style) {
        for (const styleKey in style) {
          if (styleKey.startsWith('--')) {
            vars.add(styleKey)
          }
        }
      }
      if (variants) {
        for (const variant of variants) {
          const variantStyle = variant.style
          if (variantStyle) {
            for (const styleKey in variantStyle) {
              if (styleKey.startsWith('--')) {
                vars.add(styleKey)
              }
            }
          }
        }
      }

      // If the node is a component, add variables declared on the component's root
      if (node.type === 'component' && typeof node.name === 'string') {
        const referencedComponent = files.components[node.name]
        const rootNode = referencedComponent?.nodes?.root as
          | { customProperties?: Record<string, unknown> }
          | undefined
        const rootCustomProperties = rootNode?.customProperties
        if (rootCustomProperties) {
          for (const varName in rootCustomProperties) {
            vars.add(varName)
          }
        }
      }
      return vars
    }

    const getLocalVars = (currentNodeName: string): Set<string> => {
      const cached = varsCache.get(currentNodeName)
      if (cached) {
        return cached
      }
      // Insert empty set up-front to guard against cycles, then fill it.
      const vars = new Set<string>()
      varsCache.set(currentNodeName, vars)
      const node = nodes[currentNodeName] as
        | Parameters<typeof collectOwnVars>[0]
        | undefined
      if (node) {
        for (const v of collectOwnVars(node)) {
          vars.add(v)
        }
      }
      const parentName = parentByNode.get(currentNodeName)
      if (parentName !== undefined) {
        for (const parentVar of getLocalVars(parentName)) {
          vars.add(parentVar)
        }
      }
      return vars
    }

    const localCssVariables = getLocalVars(String(nodeName))

    const rootNodeType =
      files.components?.[componentName]?.nodes?.[nodeName]?.type
    for (const varName of vars) {
      if (!(varName in themeCssVariables) && !localCssVariables.has(varName)) {
        report({
          path,
          info: {
            title: `Unknown CSS variable`,
            description: `The CSS variable **${varName}** is not declared in any parent element or theme. CSS variables must be declared in an ancestor element or in your global theme.`,
          },
          details: { name: varName },
          fixes:
            rootNodeType === 'component' || rootNodeType === 'element'
              ? ['add-to-theme', 'add-to-root-node']
              : ['add-to-theme'],
        })
      }
    }
  },
  fixes: {
    'add-to-theme': addToThemeFix,
    'add-to-root-node': addToRootNodeFix,
  },
}

export type AddToThemeFix = 'add-to-theme'
export type AddToRootNodeFix = 'add-to-root-node'

function addToThemeFix(
  args: Parameters<FixFunction<StyleNode, { name: string }>>[0],
): ReturnType<FixFunction<StyleNode, { name: string }>> {
  const varName = args.details?.name
  if (typeof varName !== 'string' || !args.data.files.themes?.Default) {
    return
  }

  const definition: CustomPropertyDefinition = {
    syntax: {
      type: 'primitive',
      name: '*',
    },
    inherits: true,
    initialValue: '',
    values: {},
    description: '',
  } as const

  // Add the variable to the theme with Any (*) syntax type
  return {
    path: ['themes', 'Default', 'propertyDefinitions', varName],
    value: definition,
  }
}

// Add an empty definition for the variable on the root node of the component, which will indicate that the variable is expected to be passed in from instances
function addToRootNodeFix(
  args: Parameters<FixFunction<StyleNode, { name: string }>>[0],
): ReturnType<FixFunction<StyleNode, { name: string }>> {
  const varName = args.details?.name
  if (typeof varName !== 'string') {
    return
  }

  const [_fileType, componentName] = args.data.path as string[]
  const component = args.data.files.components[componentName]
  if (!component) {
    return
  }

  const rootNode = component.nodes?.root
  if (!rootNode) {
    return
  }

  if (rootNode.type !== 'component' && rootNode.type !== 'element') {
    return
  }

  const customProperty: CustomProperty = {
    syntax: {
      type: 'primitive',
      name: '*',
    },
    formula: {
      type: 'value',
      value: null,
    },
  }

  return {
    path: [
      'components',
      componentName,
      'nodes',
      'root',
      'customProperties',
      varName,
    ],
    value: customProperty,
  }
}
