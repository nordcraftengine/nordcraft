import type {
  ApiStatus,
  LegacyApiStatus,
} from '@nordcraft/core/dist/api/apiTypes'
import type {
  Component,
  ComponentData,
  MediaQuery,
  NodeModel,
  SupportedNamespaces,
} from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type {
  FormulaContext,
  ToddleServerEnv,
} from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import {
  getClassName,
  toValidClassName,
} from '@nordcraft/core/dist/styling/className'
import { variantSelector } from '@nordcraft/core/dist/styling/variantSelector'
import { mapValues } from '@nordcraft/core/dist/utils/collections'
import { isDefined, toBoolean } from '@nordcraft/core/dist/utils/util'
import { escapeAttrValue } from 'xss'
import { VOID_HTML_ELEMENTS } from '../const'
import type { ProjectFiles } from '../ssr.types'
import type { ApiCache, ApiEvaluator } from './api'
import { getNodeAttrs, toEncodedText } from './attributes'

const renderComponent = async ({
  path,
  apiCache,
  children,
  component,
  data,
  env,
  evaluateComponentApis,
  files,
  toddle,
  includedComponents,
  instance,
  packageName,
  projectId,
  req,
  updateApiCache,
  addStyleVariable,
  namespace,
}: {
  path: string
  apiCache: ApiCache
  children?: Record<string, string>
  component: Component
  data: ComponentData
  env: ToddleServerEnv
  evaluateComponentApis: ApiEvaluator
  files: ProjectFiles
  toddle: FormulaContext['toddle']
  includedComponents: Component[]
  instance: Record<string, string>
  packageName: string | undefined
  projectId: string
  req: Request
  updateApiCache: (key: string, value: ApiStatus) => void
  addStyleVariable: (
    selector: string,
    rule: string,
    options?: {
      mediaQuery?: MediaQuery
      startingStyle?: boolean
    },
  ) => void
  namespace?: SupportedNamespaces
}): Promise<string> => {
  const renderNode = async ({
    id,
    path,
    node,
    data,
    packageName,
    isComponentRootNode = false,
    namespace,
  }: {
    id: string
    path: string
    node: NodeModel | undefined
    data: ComponentData
    packageName: string | undefined
    isComponentRootNode?: boolean
    namespace?: SupportedNamespaces
  }): Promise<string> => {
    if (!node) {
      return ''
    }

    const formulaContext: FormulaContext = {
      data,
      component,
      package: packageName,
      env,
      toddle,
    }
    if (node.repeat) {
      const items = applyFormula(node.repeat, formulaContext)
      if (!Array.isArray(items)) {
        return ''
      }

      const nodeItems = await Promise.all(
        items.map((Item, Index) =>
          renderNode({
            id,
            path: Index ? `${path}(${Index})` : path,
            node: { ...node, repeat: undefined },
            data: {
              ...data,
              ListItem: data.ListItem
                ? { Index, Item, Parent: data.ListItem }
                : { Index, Item },
            },
            namespace,
            packageName,
          }),
        ),
      )
      return nodeItems.join('')
    }
    if (
      node.condition &&
      !toBoolean(applyFormula(node.condition, formulaContext))
    ) {
      return ''
    }

    switch (node.type) {
      case 'text': {
        if (!namespace || namespace === 'http://www.w3.org/1999/xhtml') {
          return `<span data-node-type="text" data-node-id="${id}">${toEncodedText(
            String(applyFormula(node.value, formulaContext)),
          )}</span>`
        }

        return toEncodedText(String(applyFormula(node.value, formulaContext)))
      }
      case 'slot': {
        const defaultChild = children?.[node.name ?? 'default']
        if (defaultChild) {
          return defaultChild
        } else {
          const slotChildren = await Promise.all(
            node.children.map((child) =>
              renderNode({
                id: child,
                path: `${path}[${node.name ?? 'default'}]`,
                node: component.nodes[child],
                data,
                packageName,
                namespace,
              }),
            ),
          )
          return slotChildren.join('')
        }
      }
      case 'element': {
        switch (node.tag.toLocaleLowerCase()) {
          case 'script': {
            // we do not want to run scripts twice.
            return ''
          }
          case 'svg': {
            namespace = 'http://www.w3.org/2000/svg'
            break
          }
          case 'math': {
            namespace = 'http://www.w3.org/1998/Math/MathML'
            break
          }
        }

        const nodeAttrs = getNodeAttrs({
          node,
          data,
          component,
          packageName,
          env,
          toddle,
        })
        const classHash = getClassName([node.style, node.variants])
        let classList = Object.entries(node.classes)
          .filter(([_, { formula }]) =>
            toBoolean(applyFormula(formula, formulaContext)),
          )
          .map(([className]) => className)
          .join(' ')
        if (instance && id === 'root') {
          Object.entries(instance).forEach(([key, value]) => {
            classList += ' ' + toValidClassName(`${key}:${value}`)
          })
        }
        node['style-variables']
          ?.filter((styleVariable) => styleVariable.version === 2)
          .forEach((styleVariable) => {
            const value = applyFormula(styleVariable.formula, formulaContext)
            if (isDefined(value)) {
              addStyleVariable(
                `[data-id="${path}"]`,
                `--${styleVariable.name}: ${value}`,
              )
            }
          })

        node.variants?.forEach((variant) => {
          variant['style-variables']?.forEach((styleVariable) => {
            // style-variables on variants are always version 2
            const value = applyFormula(styleVariable.formula, formulaContext)
            if (isDefined(value)) {
              addStyleVariable(
                `[data-id="${path}"]${variantSelector(variant)}`,
                `--${styleVariable.name}: ${value}`,
                variant,
              )
            }
          })
        })

        let innerHTML = ''

        if (
          ['script', 'style'].includes(node.tag.toLocaleLowerCase()) === false
        ) {
          const childNodes = await Promise.all(
            node.children.map((child, i) =>
              renderNode({
                id: child,
                path: `${path}.${i}`,
                namespace,
                node: component.nodes[child],
                data,
                packageName,
              }),
            ),
          )
          innerHTML = childNodes.join('')
        }
        if (node.tag.toLocaleLowerCase() === 'style') {
          // render style content as text
          const textNode = node.children[0]
            ? component.nodes[node.children[0]]
            : undefined
          if (textNode?.type === 'text') {
            innerHTML = String(applyFormula(textNode.value, formulaContext))
          }
        }
        const tag =
          component.version === 2 && isComponentRootNode
            ? `${packageName ?? projectId}-${node.tag}`
            : node.tag
        const nodeClasses = `${classHash} ${classList}`.trim()
        if (!VOID_HTML_ELEMENTS.includes(tag)) {
          return `<${tag} ${nodeAttrs} data-id="${path}" data-node-id="${escapeAttrValue(
            id,
          )}" class="${escapeAttrValue(nodeClasses)}">${innerHTML}</${tag}>`
        } else {
          return `<${tag} ${nodeAttrs} data-id="${path}" data-node-id="${escapeAttrValue(
            id,
          )}" class="${escapeAttrValue(nodeClasses)}" />`
        }
      }
      case 'component': {
        const attrs = mapValues(node.attrs, (formula) =>
          applyFormula(formula, formulaContext),
        )

        const contexts = {
          ...data.Contexts,
          [component.name]: Object.fromEntries(
            Object.entries(component.formulas ?? {})
              .filter(([, formula]) => formula.exposeInContext)
              .map(([key, formula]) => [
                key,
                applyFormula(formula.formula, formulaContext),
              ]),
          ),
        }

        let _childComponent: Component | undefined
        // `node.package` is stored statically on nodes when inserted from the catalog
        const _packageName = node.package ?? packageName
        if (_packageName) {
          _childComponent =
            files.packages?.[_packageName]?.components[node.name] ??
            files.components[node.name]
        } else {
          _childComponent = files.components[node.name]
        }
        if (!isDefined(_childComponent)) {
          // eslint-disable-next-line no-console
          console.warn(
            `Unable to find component ${[packageName, node.name]
              .filter(isDefined)
              .join('/')} in files`,
          )
          return ''
        }
        // help Typescript know that childComponent is defined
        const childComponent = _childComponent

        const isLocalComponent = includedComponents.some(
          (c) => c.name === childComponent.name,
        )

        // Evaluate the child component apis before rendering to make sure we have api data for potential contexts
        const apis = await evaluateComponentApis({
          component: new ToddleComponent({
            component: childComponent,
            getComponent: (name, packageName) => {
              const nodeLookupKey = [packageName, name]
                .filter(isDefined)
                .join('/')
              const component = packageName
                ? files.packages?.[packageName]?.components[name]
                : files.components[name]
              if (!component) {
                // eslint-disable-next-line no-console
                console.warn(
                  `Unable to find component ${nodeLookupKey} in files`,
                )
                return undefined
              }

              return component
            },
            packageName,
            globalFormulas: {
              formulas: files.formulas,
              packages: files.packages,
            },
          }),
          formulaContext: {
            data: {
              Location: formulaContext.data.Location,
              Attributes: attrs,
              Contexts: contexts,
              Variables: mapValues(
                childComponent.variables,
                ({ initialValue }) => {
                  return applyFormula(initialValue, formulaContext)
                },
              ),
              Apis: {},
            },
            component: childComponent,
            package:
              node.package ?? (isLocalComponent ? undefined : packageName),
            env,
            toddle,
          },
          req,
          apiCache,
          updateApiCache,
        })

        const childNodes = await Promise.all(
          node.children.map((child, i) =>
            renderNode({
              id: child,
              path: `${path}.${i}`,
              namespace,
              node: component.nodes[child],
              data: {
                ...data,
                Contexts: {
                  ...contexts,
                  [childComponent.name]: Object.fromEntries(
                    Object.entries(childComponent.formulas ?? {})
                      .filter(([, formula]) => formula.exposeInContext)
                      .map(([key, formula]) => [
                        key,
                        applyFormula(formula.formula, {
                          component: childComponent,
                          package: _packageName,
                          data: {
                            Contexts: {
                              ...data.Contexts,
                              ...Object.fromEntries(
                                Object.entries(childComponent.formulas ?? {})
                                  .filter(
                                    ([, formula]) => formula.exposeInContext,
                                  )
                                  .map(([key, formula]) => [
                                    key,
                                    applyFormula(formula.formula, {
                                      data: {
                                        Attributes: attrs,
                                        Apis: { ...data.Apis, ...apis },
                                      },
                                      component,
                                      package: _packageName,
                                      env,
                                      toddle,
                                    }),
                                  ]),
                              ),
                            },
                            Apis: apis,
                            Attributes: attrs,
                            Variables: mapValues(
                              childComponent.variables,
                              ({ initialValue }) => {
                                return applyFormula(initialValue, {
                                  data: {
                                    Attributes: attrs,
                                  },
                                  component,
                                  package: _packageName,
                                  env,
                                  toddle,
                                })
                              },
                            ),
                          },
                          env,
                          toddle,
                        }),
                      ]),
                  ),
                },
              },
              // pass package name to child component if it's defined
              packageName: node.package ?? packageName,
            }),
          ),
        )

        const children: Record<string, string> = {}
        childNodes.forEach((childNode, i) => {
          // Add children to the correct slot in the right order
          const slotName =
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            component.nodes[node.children[i]]?.slot ?? 'default'
          children[slotName] = `${children[slotName] ?? ''} ${childNode}`
        })

        // Add extra instance styling for each style-variable
        node['style-variables']?.forEach((styleVariable) => {
          const value = applyFormula(styleVariable.formula, formulaContext)
          if (isDefined(value)) {
            addStyleVariable(
              `[data-id="${path}"].${component.name}\\:${id}`,
              `--${styleVariable.name}: ${applyFormula(
                styleVariable.formula,
                formulaContext,
              )}`,
            )
          }
        })

        node.variants?.forEach((variant) => {
          variant['style-variables']?.forEach((styleVariable) => {
            const value = applyFormula(styleVariable.formula, formulaContext)
            if (isDefined(value)) {
              addStyleVariable(
                `[data-id="${path}"].${component.name}\\:${id}${variantSelector(
                  variant,
                )}`,
                `--${styleVariable.name}: ${value}`,
                variant,
              )
            }
          })
        })

        return createComponent({
          path,
          attrs,
          component: childComponent,
          contexts,
          children,
          packageName:
            node.package ?? (isLocalComponent ? undefined : packageName),
          // If the root node is another component, then append and forward previous instance
          instance:
            id === 'root'
              ? { ...instance, [component.name]: 'root' }
              : { [component.name]: id },
          apis,
          env,
          includedComponents,
          formulaContext,
          files,
          apiCache,
          updateApiCache,
          addStyleVariable,
          projectId,
          namespace,
          evaluateComponentApis,
          req,
        })
      }
    }
  }
  return renderNode({
    id: 'root',
    path,
    node: component.nodes.root,
    data,
    packageName,
    isComponentRootNode: true,
    namespace,
  })
}

const createComponent = async ({
  path,
  apiCache,
  apis,
  attrs,
  children,
  component,
  contexts,
  env,
  evaluateComponentApis,
  files,
  formulaContext,
  includedComponents,
  instance,
  packageName,
  projectId,
  req,
  updateApiCache,
  addStyleVariable,
  namespace,
}: {
  path: string
  apiCache: ApiCache
  apis: Record<
    string,
    | LegacyApiStatus
    | (ApiStatus & {
        inputs?: Record<string, unknown>
      })
  >
  attrs: Record<string, any>
  children?: Record<string, string>
  component: Component
  contexts?: Record<string, Record<string, any>>
  env: ToddleServerEnv
  evaluateComponentApis: ApiEvaluator
  files: ProjectFiles
  formulaContext: FormulaContext
  includedComponents: Component[]
  instance: Record<string, string>
  packageName: string | undefined
  projectId: string
  req: Request
  namespace?: SupportedNamespaces
  updateApiCache: (key: string, value: ApiStatus) => void
  addStyleVariable: (
    selector: string,
    rule: string,
    options?: {
      mediaQuery?: MediaQuery
      startingStyle?: boolean
    },
  ) => void
}): Promise<string> => {
  const data: ComponentData = {
    Location: formulaContext.data.Location,
    Attributes: attrs,
    Contexts: contexts,
    Variables: mapValues(component.variables, ({ initialValue }) => {
      return applyFormula(initialValue, {
        ...formulaContext,
        data: {
          ...formulaContext.data,
          Contexts: contexts,
        },
      })
    }),
    Apis: apis,
  }
  data.Contexts = {
    ...data.Contexts,
    ...Object.fromEntries(
      Object.entries(component.formulas ?? {})
        .filter(([, formula]) => formula.exposeInContext)
        .map(([key, formula]) => [
          key,
          applyFormula(formula.formula, {
            ...formulaContext,
            data,
          }),
        ]),
    ),
  }

  return renderComponent({
    apiCache,
    path,
    children,
    component,
    data,
    env,
    evaluateComponentApis,
    files,
    includedComponents,
    instance,
    packageName,
    projectId,
    namespace,
    req,
    toddle: formulaContext.toddle,
    updateApiCache,
    addStyleVariable,
  })
}

/**
 * Renders a page body for a given ToddleComponent
 */
export const renderPageBody = async ({
  component,
  env,
  evaluateComponentApis,
  files,
  formulaContext,
  includedComponents,
  req,
  projectId,
}: {
  component: ToddleComponent<string>
  env: ToddleServerEnv
  evaluateComponentApis: ApiEvaluator
  files: ProjectFiles
  formulaContext: FormulaContext
  includedComponents: Component[]
  req: Request
  projectId: string
}) => {
  const apiCache: ApiCache = {}
  const updateApiCache = (key: string, value: ApiStatus) =>
    (apiCache[key] = value)
  const styleVariables: Map<string, Set<string>> = new Map()
  const addStyleVariable = (
    selector: string,
    rule: string,
    options?: {
      mediaQuery?: MediaQuery
      startingStyle?: boolean
    },
  ) => {
    selector = options?.startingStyle
      ? `${selector} { @starting-style { __RULES__ } }`
      : `${selector} { __RULES__ }`

    if (options?.mediaQuery) {
      selector = `@media (${Object.entries(options.mediaQuery)
        .map(([key, value]) => `${key}: ${value}`)
        .filter(Boolean)
        .join(') and (')}) { ${selector} }`
    }

    if (!styleVariables.has(selector)) {
      styleVariables.set(selector, new Set())
    }

    styleVariables.get(selector)?.add(rule)
  }

  const apis = await evaluateComponentApis({
    component,
    formulaContext,
    req,
    apiCache,
    updateApiCache,
  })
  formulaContext.data.Apis = apis

  const html = await renderComponent({
    path: '0',
    apiCache,
    component,
    data: formulaContext.data,
    env,
    evaluateComponentApis,
    files,
    includedComponents,
    instance: {},
    packageName: undefined,
    projectId,
    req,
    toddle: formulaContext.toddle,
    updateApiCache,
    addStyleVariable,
  })
  return {
    html,
    apiCache,
    styleVariables: [...styleVariables]
      .map(([selector, vars]) =>
        selector.replace('__RULES__', Array.from(vars).join(';\n')),
      )
      .toReversed(),
  }
}
