import type { CustomPropertyName } from '@nordcraft/core'
import {
  isDefined,
  isLegacyApi,
  isToddleFormula,
  ToddleComponent,
  ToddleFormula,
} from '@nordcraft/core'
import type { ProjectFiles } from '@nordcraft/ssr'
import { ToddleApiService, ToddleRoute } from '@nordcraft/ssr'
import type {
  ApplicationState,
  FixType,
  IssueResult,
  IssueRule,
  NodeType,
  Rule,
  SearchResult,
  SearchRule,
} from './types'
import { applyFixResult } from './util/applyFix'
import { shouldSearchExactPath, shouldVisitTree } from './util/helpers'

interface FixOptions {
  mode: 'FIX'
  fixType: FixType
}

const FIXED_SIGNAL = Symbol('FIXED_SIGNAL')

/**
 * Groups rules by the `nodeTypes` they target so `visitNode` can look up
 * matching rules in O(1) instead of checking every rule on every node, and
 * skip traversing subtrees/leaf node types that no rule inspects.
 */
type RuleIndex = Map<NodeType['nodeType'], (IssueRule & SearchRule)[]>

function createRuleIndex(rules: Rule[]): RuleIndex {
  const byNodeType: RuleIndex = new Map()

  for (const rule of rules as (IssueRule & SearchRule)[]) {
    const declaredTypes = Array.isArray(rule.nodeTypes)
      ? rule.nodeTypes
      : [rule.nodeTypes]
    for (const nodeType of declaredTypes) {
      const list = byNodeType.get(nodeType)
      if (list) {
        list.push(rule)
      } else {
        byNodeType.set(nodeType, [rule])
      }
    }
  }

  return byNodeType
}

interface SearchContext {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: Rule[]
  pathsToVisit: string[][]
  useExactPaths: boolean
  state: ApplicationState | undefined
  fixOptions?: FixOptions
  ruleIndex: RuleIndex
  memo: (key: string | string[], fn: () => any) => any
}

/**
 * Search a project by applying rules to all nodes in the project and returning reported results.
 *
 * @param files All files to check against
 * @param rules All rules to check against
 * @param pathsToVisit Only visit specific paths. All subpaths are visited as well. For example, ['components', 'test'] would visit everything under the test component. Defaults is `[]` which means all paths are visited.
 * @param state Optional parameter describing the current state of the application/editor
 * @param options Optional parameter for fixing issues
 * @returns A generator that yields results as they are found
 */
export function searchProject(args: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: IssueRule<any, any>[]
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
  fixOptions: FixOptions
}): Generator<ProjectFiles | void>
export function searchProject(args: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: IssueRule<any, any>[]
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
}): Generator<IssueResult>
export function searchProject(args: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: SearchRule<any, any>[]
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  withDetails?: boolean
}): Generator<SearchResult>
export function* searchProject({
  files,
  rules,
  pathsToVisit = [],
  useExactPaths = false,
  state,
  fixOptions,
}: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: Rule[]
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
  fixOptions?: FixOptions
}): Generator<SearchResult | IssueResult | ProjectFiles | void> {
  const memos = new Map<string, any>()
  const memo = (key: string | string[], fn: () => any) => {
    const stringKey = Array.isArray(key) ? key.join('/') : key
    if (memos.has(stringKey)) {
      return memos.get(stringKey)
    }

    const result = fn()
    memos.set(stringKey, result)
    return result
  }

  const ruleIndex = createRuleIndex(rules)
  const context: SearchContext = {
    files,
    rules,
    pathsToVisit,
    useExactPaths,
    state,
    fixOptions,
    ruleIndex,
    memo,
  }

  try {
    for (const key in context.files.components) {
      const component = context.files.components[key]
      if (component) {
        yield* visitNode(context, {
          nodeType: 'component',
          value: component,
          path: ['components', key],
          memo: context.memo,
          files: context.files,
        })
      }
    }

    if (ruleIndex.has('project-formula') || ruleIndex.has('formula')) {
      for (const key in context.files.formulas) {
        yield* visitNode(context, {
          nodeType: 'project-formula',
          value: context.files.formulas[key],
          path: ['formulas', key],
          memo: context.memo,
          files: context.files,
        })
      }
    }

    if (ruleIndex.has('project-action')) {
      for (const key in context.files.actions) {
        yield* visitNode(context, {
          nodeType: 'project-action',
          value: context.files.actions[key],
          path: ['actions', key],
          memo: context.memo,
          files: context.files,
        })
      }
    }

    if (
      ruleIndex.has('project-theme') ||
      ruleIndex.has('project-theme-property')
    ) {
      for (const key in context.files.themes) {
        yield* visitNode(context, {
          nodeType: 'project-theme',
          value: context.files.themes[key],
          path: ['themes', key],
          memo: context.memo,
          files: context.files,
        })
        if (ruleIndex.has('project-theme-property')) {
          const propDefs = context.files.themes[key]?.propertyDefinitions
          if (propDefs) {
            for (const propKey in propDefs) {
              const propDef = propDefs[propKey as any]
              if (propDef) {
                yield* visitNode(context, {
                  nodeType: 'project-theme-property',
                  value: {
                    key: propKey as CustomPropertyName,
                    value: propDef,
                  },
                  path: ['themes', key, 'propertyDefinitions', propKey],
                  memo: context.memo,
                  files: context.files,
                })
              }
            }
          }
        }
      }
    }

    if (
      context.files.services &&
      (ruleIndex.has('api-service') || ruleIndex.has('formula'))
    ) {
      for (const key in context.files.services) {
        yield* visitNode(context, {
          nodeType: 'api-service',
          value: context.files.services[key],
          path: ['services', key],
          memo: context.memo,
          files: context.files,
        })
      }
    }

    if (
      context.files.routes &&
      (ruleIndex.has('project-route') || ruleIndex.has('formula'))
    ) {
      for (const key in context.files.routes) {
        yield* visitNode(context, {
          nodeType: 'project-route',
          value: context.files.routes[key],
          routeName: key,
          path: ['routes', key],
          memo: context.memo,
          files: context.files,
        })
      }
    }

    if (ruleIndex.has('project-config')) {
      yield* visitNode(context, {
        nodeType: 'project-config',
        value: context.files.config,
        path: ['config'],
        memo: context.memo,
        files: context.files,
      })
    }

    if (context.files.packages && ruleIndex.has('project-package')) {
      for (const key in context.files.packages) {
        const pkg = context.files.packages[key]
        if (pkg) {
          yield* visitNode(context, {
            nodeType: 'project-package',
            value: pkg,
            packageName: key,
            path: ['packages', key],
            memo: context.memo,
            files: context.files,
          })
        }
      }
    }
  } catch (e) {
    if (e !== FIXED_SIGNAL) {
      throw e
    }
  }
}

function* visitNode(
  context: SearchContext,
  data: NodeType,
): Generator<SearchResult | IssueResult | ProjectFiles | void> {
  const { path, nodeType } = data
  const { pathsToVisit, useExactPaths, ruleIndex } = context
  if (
    !shouldVisitTree({
      path,
      pathsToVisit,
    })
  ) {
    return
  }

  if (!useExactPaths || shouldSearchExactPath({ path, pathsToVisit })) {
    const matchingRules = ruleIndex.get(nodeType)
    if (matchingRules && matchingRules.length > 0) {
      const results: (IssueResult & SearchResult)[] = []
      let fixedFiles: ProjectFiles | undefined
      for (const rule of matchingRules) {
        rule.visit(
          ({ path: reportPath, details, fixes, info }) => {
            if (context.fixOptions) {
              if (
                !fixedFiles &&
                fixes?.includes(context.fixOptions.fixType) &&
                rule.fixes?.[context.fixOptions.fixType]
              ) {
                const ruleFixes = rule.fixes[context.fixOptions.fixType]?.({
                  data: { ...data, files: context.files, path: reportPath },
                  details,
                  state: context.state,
                })
                if (ruleFixes) {
                  fixedFiles = applyFixResult(context.files, ruleFixes)
                  context.files = fixedFiles
                }
              }
            } else {
              const res: Record<string, unknown> = { path: reportPath }
              if (rule.code !== undefined) res.code = rule.code
              if (rule.category !== undefined) res.category = rule.category
              if (rule.level !== undefined) res.level = rule.level
              if (info !== undefined) res.info = info
              if (details !== undefined) res.details = details
              if (fixes !== undefined) res.fixes = fixes
              results.push(res as IssueResult & SearchResult)
            }
          },
          data,
          context.state,
        )
        if (fixedFiles) {
          break
        }
      }

      if (context.fixOptions) {
        if (fixedFiles) {
          yield fixedFiles
          throw FIXED_SIGNAL
        }
      } else {
        for (let i = 0; i < results.length; i++) {
          yield results[i]
        }
      }
    }
  }

  switch (nodeType) {
    case 'action-model':
    case 'action-custom-model-argument':
    case 'action-custom-model-event':
    case 'animation':
    case 'component-api-input':
    case 'component-api':
    case 'component-attribute':
    case 'component-context':
    case 'component-event':
    case 'component-formula':
    case 'component-node-attribute':
    case 'component-test-scenario':
    case 'component-variable':
    case 'component-workflow':
    case 'custom-property':
    case 'formula':
    case 'project-action':
    case 'project-config':
    case 'project-theme':
    case 'project-theme-property':
    case 'project-package':
    case 'style-declaration':
    case 'style-variable':
    case 'style-variant':
      break
    case 'component': {
      const component = new ToddleComponent<string>({
        component: data.value,
        packageName: undefined,
        getComponent: (name) => context.files.components[name],
        globalFormulas: {
          formulas: context.files.formulas,
          packages: context.files.packages,
        },
      })

      if (ruleIndex.has('component-attribute')) {
        const attributes = data.value.attributes
        if (attributes) {
          for (const key in attributes) {
            const attribute = attributes[key]
            if (isDefined(attribute)) {
              yield* visitNode(context, {
                nodeType: 'component-attribute',
                value: attribute,
                path: [...path, 'attributes', key],
                component,
                memo: context.memo,
                files: context.files,
              })
            }
          }
        }
      }

      if (ruleIndex.has('component-variable')) {
        const variables = data.value.variables
        if (variables) {
          for (const key in variables) {
            const variable = variables[key]
            if (isDefined(variable)) {
              yield* visitNode(context, {
                nodeType: 'component-variable',
                value: variable,
                path: [...path, 'variables', key],
                component,
                memo: context.memo,
                files: context.files,
              })
            }
          }
        }
      }

      if (
        ruleIndex.has('component-api') ||
        ruleIndex.has('component-api-input')
      ) {
        const apis = data.value.apis
        if (apis) {
          for (const key in apis) {
            const api = apis[key]
            if (!api) {
              continue
            }
            yield* visitNode(context, {
              nodeType: 'component-api',
              value: api,
              component,
              path: [...path, 'apis', key],
              memo: context.memo,
              files: context.files,
            })
            if (!isLegacyApi(api) && ruleIndex.has('component-api-input')) {
              const inputs = api.inputs
              if (inputs) {
                for (const inputKey in inputs) {
                  yield* visitNode(context, {
                    nodeType: 'component-api-input',
                    value: inputs[inputKey],
                    api,
                    component,
                    path: [...path, 'apis', key, 'inputs', inputKey],
                    memo: context.memo,
                    files: context.files,
                  })
                }
              }
            }
          }
        }
      }

      if (ruleIndex.has('component-formula')) {
        const formulas = data.value.formulas
        if (formulas) {
          for (const key in formulas) {
            const formula = formulas[key]
            if (isDefined(formula)) {
              yield* visitNode(context, {
                nodeType: 'component-formula',
                value: formula,
                path: [...path, 'formulas', key],
                component,
                memo: context.memo,
                files: context.files,
              })
            }
          }
        }
      }

      if (ruleIndex.has('component-workflow')) {
        const workflows = data.value.workflows
        if (workflows) {
          for (const key in workflows) {
            const workflow = workflows[key]
            if (isDefined(workflow)) {
              yield* visitNode(context, {
                nodeType: 'component-workflow',
                value: workflow,
                path: [...path, 'workflows', key],
                component,
                memo: context.memo,
                files: context.files,
              })
            }
          }
        }
      }

      if (ruleIndex.has('component-event')) {
        const events = data.value.events
        if (events) {
          for (let i = 0; i < events.length; i++) {
            const event = events[i]
            if (event) {
              yield* visitNode(context, {
                nodeType: 'component-event',
                path: [...path, 'events', i],
                value: { component, event },
                memo: context.memo,
                files: context.files,
              })
            }
          }
        }
      }

      if (ruleIndex.has('component-context')) {
        const contexts = data.value.contexts
        if (contexts) {
          for (const key in contexts) {
            yield* visitNode(context, {
              nodeType: 'component-context',
              value: contexts[key],
              path: [...path, 'contexts', key],
              memo: context.memo,
              files: context.files,
            })
          }
        }
      }

      if (ruleIndex.has('component-test-scenario')) {
        const testScenarios = data.value.testScenarios
        if (testScenarios) {
          for (const key in testScenarios) {
            const scenario = testScenarios[key]
            if (isDefined(scenario)) {
              yield* visitNode(context, {
                nodeType: 'component-test-scenario',
                value: scenario,
                scenarioKey: key,
                path: [...path, 'testScenarios', key],
                component,
                memo: context.memo,
                files: context.files,
              })
            }
          }
        }
      }

      const nodes = data.value.nodes
      if (nodes) {
        for (const key in nodes) {
          const node = nodes[key]
          yield* visitNode(context, {
            nodeType: 'component-node',
            value: node,
            path: [...path, 'nodes', key],
            component,
            memo: context.memo,
            files: context.files,
          })
          if (
            isDefined(node) &&
            (node.type === 'component' || node.type === 'element') &&
            ruleIndex.has('component-node-attribute')
          ) {
            const attrs = node.attrs
            if (attrs) {
              for (const attrKey in attrs) {
                yield* visitNode(context, {
                  nodeType: 'component-node-attribute',
                  value: { key: attrKey, value: attrs[attrKey] },
                  path: [...path, 'nodes', key, 'attrs', attrKey],
                  node,
                  memo: context.memo,
                  files: context.files,
                })
              }
            }
          }
        }
      }

      if (ruleIndex.has('formula')) {
        for (const {
          path: formulaPath,
          formula,
          packageName,
        } of component.formulasInComponent()) {
          if (packageName && packageName !== 'root') {
            continue
          }

          yield* visitNode(context, {
            nodeType: 'formula',
            value: formula,
            path: [...path, ...formulaPath],
            component,
            memo: context.memo,
            files: context.files,
          })
        }
      }

      if (
        ruleIndex.has('action-model') ||
        ruleIndex.has('action-custom-model-argument') ||
        ruleIndex.has('action-custom-model-event')
      ) {
        for (const [
          actionPath,
          action,
        ] of component.actionModelsInComponent()) {
          yield* visitNode(context, {
            nodeType: 'action-model',
            value: action,
            path: [...path, ...actionPath],
            component,
            memo: context.memo,
            files: context.files,
          })
          if (action.type === 'Custom' || action.type === undefined) {
            if (ruleIndex.has('action-custom-model-argument')) {
              const argsList = action.arguments
              if (argsList) {
                for (let index = 0; index < argsList.length; index++) {
                  const arg = argsList[index]
                  if (arg) {
                    yield* visitNode(context, {
                      nodeType: 'action-custom-model-argument',
                      value: { action, argument: arg, argumentIndex: index },
                      path: [...path, ...actionPath, 'arguments', index],
                      component,
                      memo: context.memo,
                      files: context.files,
                    })
                  }
                }
              }
            }
            if (ruleIndex.has('action-custom-model-event')) {
              const actionEvents = action.events
              if (actionEvents) {
                for (const eventName in actionEvents) {
                  if (!Object.hasOwn(actionEvents, eventName)) continue
                  const event = actionEvents[eventName]
                  yield* visitNode(context, {
                    nodeType: 'action-custom-model-event',
                    value: { action, event, eventName },
                    path: [...path, ...actionPath, 'events', eventName],
                    component,
                    memo: context.memo,
                    files: context.files,
                  })
                }
              }
            }
          }
        }
      }
      break
    }

    case 'project-formula':
      if (ruleIndex.has('formula') && isToddleFormula(data.value)) {
        const formula = new ToddleFormula({
          formula: data.value.formula,
          globalFormulas: {
            formulas: context.files.formulas,
            packages: context.files.packages,
          },
        })
        for (const {
          path: formulaPath,
          formula: f,
          packageName,
        } of formula.formulasInFormula()) {
          if (packageName && packageName !== 'root') {
            continue
          }

          yield* visitNode(context, {
            nodeType: 'formula',
            value: f,
            path: [...path, 'formula', ...formulaPath],
            memo: context.memo,
            files: context.files,
          })
        }
      }
      break

    case 'component-node':
      if (data.value?.type === 'element' || data.value?.type === 'component') {
        const element = data.value
        if (ruleIndex.has('style-declaration')) {
          const style = element.style
          if (style) {
            for (const styleKey in style) {
              yield* visitNode(context, {
                nodeType: 'style-declaration',
                value: {
                  styleProperty: styleKey,
                  styleValue: style[styleKey],
                  element,
                },
                path: [...path, 'style', styleKey],
                memo: context.memo,
                files: context.files,
              })
            }
          }
        }

        if (element.type === 'element' && ruleIndex.has('style-variable')) {
          const styleVariables = element['style-variables']
          if (styleVariables) {
            for (let i = 0; i < styleVariables.length; i++) {
              const styleVariable = styleVariables[i]
              yield* visitNode(context, {
                nodeType: 'style-variable',
                value: { styleVariable, element },
                path: [...path, 'style-variables', i],
                memo: context.memo,
                files: context.files,
              })
            }
          }
        }

        if (element.customProperties && ruleIndex.has('custom-property')) {
          const customProps = element.customProperties
          for (const customPropertyKey in customProps) {
            yield* visitNode(context, {
              nodeType: 'custom-property',
              value: {
                key: customPropertyKey as CustomPropertyName,
                value: customProps[customPropertyKey as CustomPropertyName],
                element,
              },
              path: [...path, 'customProperties', customPropertyKey],
              memo: context.memo,
              files: context.files,
            })
          }
        }

        if (element.animations && ruleIndex.has('animation')) {
          const animations = element.animations
          for (const animationKey in animations) {
            yield* visitNode(context, {
              nodeType: 'animation',
              node: element,
              value: {
                key: animationKey,
                value: animations[animationKey],
              },
              path: [...path, 'animations', animationKey],
              memo: context.memo,
              files: context.files,
            })
          }
        }

        const variants = element.variants
        if (
          variants &&
          (ruleIndex.has('style-variant') ||
            ruleIndex.has('style-declaration') ||
            ruleIndex.has('custom-property'))
        ) {
          for (let i = 0; i < variants.length; i++) {
            const variant = variants[i]
            if (ruleIndex.has('style-variant')) {
              yield* visitNode(context, {
                nodeType: 'style-variant',
                value: { variant, element },
                path: [...path, 'variants', i],
                memo: context.memo,
                files: context.files,
              })
            }
            if (ruleIndex.has('style-declaration')) {
              const variantStyle = variant.style
              if (variantStyle) {
                for (const styleKey in variantStyle) {
                  yield* visitNode(context, {
                    nodeType: 'style-declaration',
                    value: {
                      styleProperty: styleKey,
                      styleValue: variantStyle[styleKey],
                      element,
                    },
                    path: [...path, 'variants', i, 'style', styleKey],
                    memo: context.memo,
                    files: context.files,
                  })
                }
              }
            }
            if (variant.customProperties && ruleIndex.has('custom-property')) {
              const variantCustomProps = variant.customProperties
              for (const customPropertyKey in variantCustomProps) {
                yield* visitNode(context, {
                  nodeType: 'custom-property',
                  value: {
                    key: customPropertyKey as CustomPropertyName,
                    value:
                      variantCustomProps[
                        customPropertyKey as CustomPropertyName
                      ],
                    element,
                    variant,
                  },
                  path: [
                    ...path,
                    'variants',
                    i,
                    'customProperties',
                    customPropertyKey,
                  ],
                  memo: context.memo,
                  files: context.files,
                })
              }
            }
          }
        }
      }
      break

    case 'api-service': {
      if (ruleIndex.has('formula')) {
        const apiService = new ToddleApiService<string>({
          service: data.value,
          globalFormulas: {
            formulas: context.files.formulas,
            packages: context.files.packages,
          },
        })
        for (const {
          path: formulaPath,
          formula,
        } of apiService.formulasInService()) {
          yield* visitNode(context, {
            nodeType: 'formula',
            value: formula,
            path: [...path, ...formulaPath],
            memo: context.memo,
            files: context.files,
          })
        }
      }
      break
    }

    case 'project-route': {
      if (ruleIndex.has('formula')) {
        const projectRoute = new ToddleRoute<string>({
          route: data.value,
          globalFormulas: {
            formulas: context.files.formulas,
            packages: context.files.packages,
          },
        })
        for (const {
          path: formulaPath,
          formula,
        } of projectRoute.formulasInRoute()) {
          yield* visitNode(context, {
            nodeType: 'formula',
            value: formula,
            path: [...path, 'formula', ...formulaPath],
            memo: context.memo,
            files: context.files,
          })
        }
      }
      break
    }
  }
}
