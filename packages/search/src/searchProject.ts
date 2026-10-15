import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { CustomPropertyName } from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { isToddleFormula } from '@nordcraft/core/dist/formula/formula'
import { ToddleFormula } from '@nordcraft/core/dist/formula/ToddleFormula'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { ToddleApiService } from '@nordcraft/ssr/dist/ToddleApiService'
import { ToddleRoute } from '@nordcraft/ssr/dist/ToddleRoute'
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

const COMPONENT_SUBTREE_TYPES = [
  'component',
  'component-attribute',
  'component-variable',
  'component-formula',
  'component-workflow',
  'component-context',
  'component-node',
  'component-node-attribute',
  'style-declaration',
  'style-variant',
  'style-variable',
  'animation',
  'custom-property',
  'formula',
  'action-model',
  'action-custom-model-argument',
  'action-custom-model-event',
  'component-api',
  'component-api-input',
  'component-event',
] as const

const COMPONENT_NODE_SUBTREE_TYPES = [
  'component-node',
  'component-node-attribute',
  'style-declaration',
  'style-variant',
  'style-variable',
  'animation',
  'custom-property',
] as const

const ACTION_MODEL_SUBTREE_TYPES = [
  'action-model',
  'action-custom-model-argument',
  'action-custom-model-event',
] as const

const API_SUBTREE_TYPES = ['component-api', 'component-api-input'] as const

const THEME_SUBTREE_TYPES = ['project-theme', 'project-theme-property'] as const

const SERVICE_SUBTREE_TYPES = [
  'api-service',
  'component-api',
  'component-api-input',
  'formula',
] as const

const ROUTE_SUBTREE_TYPES = ['project-route', 'formula'] as const

const PROJECT_FORMULA_SUBTREE_TYPES = ['project-formula', 'formula'] as const

const PROJECT_ACTION_SUBTREE_TYPES = [
  'project-action',
  'action-model',
  'action-custom-model-argument',
  'action-custom-model-event',
] as const

interface RuleIndex {
  rules: Rule[]
  hasWildcard: boolean
  activeNodeTypes: Set<string> | null
  byNodeType: Map<string, (IssueRule & SearchRule)[]>
  singleRule: (IssueRule & SearchRule) | null
  singleRuleNodeType: string | readonly string[] | undefined
}

const EMPTY_RULES: (IssueRule & SearchRule)[] = []
const ruleIndexCache = new WeakMap<Rule[], RuleIndex>()

function getRuleIndex(rules: Rule[]): RuleIndex {
  let index = ruleIndexCache.get(rules)
  if (index) {
    return index
  }

  const byNodeType = new Map<string, (IssueRule & SearchRule)[]>()
  let hasWildcard = false
  const activeNodeTypes = new Set<string>()

  if (rules.length === 1) {
    const singleRule = rules[0] as IssueRule & SearchRule
    const nt = singleRule.nodeTypes
    if (!nt) {
      hasWildcard = true
    } else if (Array.isArray(nt)) {
      for (const t of nt) {
        activeNodeTypes.add(t)
        byNodeType.set(t, rules as (IssueRule & SearchRule)[])
      }
    } else {
      activeNodeTypes.add(nt)
      byNodeType.set(nt, rules as (IssueRule & SearchRule)[])
    }
    index = {
      rules,
      hasWildcard,
      activeNodeTypes: hasWildcard ? null : activeNodeTypes,
      byNodeType,
      singleRule,
      singleRuleNodeType: nt,
    }
  } else {
    for (const rule of rules as (IssueRule & SearchRule)[]) {
      if (!rule.nodeTypes) {
        hasWildcard = true
      } else {
        const declared = Array.isArray(rule.nodeTypes)
          ? rule.nodeTypes
          : [rule.nodeTypes]
        for (const t of declared) {
          activeNodeTypes.add(t)
          let list = byNodeType.get(t)
          if (!list) {
            list = []
            byNodeType.set(t, list)
          }
          list.push(rule)
        }
      }
    }

    index = {
      rules,
      hasWildcard,
      activeNodeTypes: hasWildcard ? null : activeNodeTypes,
      byNodeType,
      singleRule: null,
      singleRuleNodeType: undefined,
    }
  }

  ruleIndexCache.set(rules, index)
  return index
}

function rulesForNodeType(
  index: RuleIndex,
  nodeType: string,
): (IssueRule & SearchRule)[] {
  if (index.singleRule) {
    const nt = index.singleRuleNodeType
    if (!nt) {
      return index.rules as (IssueRule & SearchRule)[]
    }
    if (typeof nt === 'string') {
      return nt === nodeType
        ? (index.rules as (IssueRule & SearchRule)[])
        : EMPTY_RULES
    }
    return nt.includes(nodeType)
      ? (index.rules as (IssueRule & SearchRule)[])
      : EMPTY_RULES
  }

  if (!index.hasWildcard) {
    return index.byNodeType.get(nodeType) ?? EMPTY_RULES
  }

  let cached = index.byNodeType.get(nodeType)
  if (cached) {
    return cached
  }
  cached = (index.rules as (IssueRule & SearchRule)[]).filter((rule) => {
    if (!rule.nodeTypes) {
      return true
    }
    const declared = Array.isArray(rule.nodeTypes)
      ? rule.nodeTypes
      : [rule.nodeTypes]
    return declared.includes(nodeType as never)
  })
  index.byNodeType.set(nodeType, cached)
  return cached
}

function isNodeTypeActive(index: RuleIndex, nodeType: string): boolean {
  return index.activeNodeTypes === null || index.activeNodeTypes.has(nodeType)
}

function isAnyNodeTypeActive(
  index: RuleIndex,
  nodeTypes: readonly string[],
): boolean {
  if (index.activeNodeTypes === null) {
    return true
  }
  for (let i = 0; i < nodeTypes.length; i++) {
    if (index.activeNodeTypes.has(nodeTypes[i])) {
      return true
    }
  }
  return false
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
  rules: SearchRule<any, any>[]
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  withDetails?: boolean
}): Generator<SearchResult>
export function searchProject(args: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: IssueRule<any, any>[]
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
}): Generator<IssueResult>
export function searchProject(args: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: IssueRule<any, any>[]
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
  fixOptions: FixOptions
}): Generator<ProjectFiles | void>
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

  const ruleIndex = getRuleIndex(rules)

  if (isAnyNodeTypeActive(ruleIndex, COMPONENT_SUBTREE_TYPES)) {
    for (const key in files.components) {
      const component = files.components[key]
      if (component) {
        yield* visitNode({
          args: {
            nodeType: 'component',
            value: component,
            path: ['components', key],
            rules,
            files,
            pathsToVisit,
            useExactPaths,
            memo,
            ruleIndex,
          },
          state,
          fixOptions: fixOptions as any,
        })
      }
    }
  }

  if (isAnyNodeTypeActive(ruleIndex, PROJECT_FORMULA_SUBTREE_TYPES)) {
    for (const key in files.formulas) {
      yield* visitNode({
        args: {
          nodeType: 'project-formula',
          value: files.formulas[key],
          path: ['formulas', key],
          rules,
          files,
          pathsToVisit,
          useExactPaths,
          memo,
          ruleIndex,
        },
        state,
        fixOptions: fixOptions as any,
      })
    }
  }

  if (isAnyNodeTypeActive(ruleIndex, PROJECT_ACTION_SUBTREE_TYPES)) {
    for (const key in files.actions) {
      yield* visitNode({
        args: {
          nodeType: 'project-action',
          value: files.actions[key],
          path: ['actions', key],
          rules,
          files,
          pathsToVisit,
          useExactPaths,
          memo,
          ruleIndex,
        },
        state,
        fixOptions: fixOptions as any,
      })
    }
  }

  if (isAnyNodeTypeActive(ruleIndex, THEME_SUBTREE_TYPES)) {
    for (const key in files.themes) {
      yield* visitNode({
        args: {
          nodeType: 'project-theme',
          value: files.themes[key],
          path: ['themes', key],
          rules,
          files,
          pathsToVisit,
          useExactPaths,
          memo,
          ruleIndex,
        },
        state,
        fixOptions: fixOptions as any,
      })
      if (isNodeTypeActive(ruleIndex, 'project-theme-property')) {
        for (const propKey in files.themes[key]?.propertyDefinitions ?? {}) {
          const propDef =
            files.themes[key]?.propertyDefinitions?.[propKey as any]
          if (propDef) {
            yield* visitNode({
              args: {
                nodeType: 'project-theme-property',
                value: { key: propKey as CustomPropertyName, value: propDef },
                path: ['themes', key, 'propertyDefinitions', propKey],
                rules,
                files,
                pathsToVisit,
                useExactPaths,
                memo,
                ruleIndex,
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }
      }
    }
  }

  if (files.services && isAnyNodeTypeActive(ruleIndex, SERVICE_SUBTREE_TYPES)) {
    for (const key in files.services) {
      yield* visitNode({
        args: {
          nodeType: 'api-service',
          value: files.services[key],
          path: ['services', key],
          rules,
          files,
          pathsToVisit,
          useExactPaths,
          memo,
          ruleIndex,
        },
        state,
        fixOptions: fixOptions as any,
      })
    }
  }

  if (files.routes && isAnyNodeTypeActive(ruleIndex, ROUTE_SUBTREE_TYPES)) {
    for (const key in files.routes) {
      yield* visitNode({
        args: {
          nodeType: 'project-route',
          value: files.routes[key],
          routeName: key,
          path: ['routes', key],
          rules,
          files,
          pathsToVisit,
          useExactPaths,
          memo,
          ruleIndex,
        },
        state,
        fixOptions: fixOptions as any,
      })
    }
  }

  if (isNodeTypeActive(ruleIndex, 'project-config')) {
    yield* visitNode({
      args: {
        nodeType: 'project-config',
        value: files.config,
        path: ['config'],
        rules,
        files,
        pathsToVisit,
        useExactPaths,
        memo,
        ruleIndex,
      },
      state,
      fixOptions: fixOptions as any,
    })
  }

  if (files.packages && isNodeTypeActive(ruleIndex, 'project-package')) {
    for (const key in files.packages) {
      const pkg = files.packages[key]
      if (pkg) {
        yield* visitNode({
          args: {
            nodeType: 'project-package',
            value: pkg,
            packageName: key,
            path: ['packages', key],
            rules,
            files,
            pathsToVisit,
            useExactPaths,
            memo,
            ruleIndex,
          },
          state,
          fixOptions: fixOptions as any,
        })
      }
    }
  }
}

function visitNode(args: {
  args: {
    path: (string | number)[]
    rules: Rule[]
    files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
    pathsToVisit: string[][]
    useExactPaths: boolean
    ruleIndex: RuleIndex
  } & NodeType
  state: ApplicationState | undefined
  fixOptions: never
}): Generator<IssueResult>
function visitNode(args: {
  args: {
    path: (string | number)[]
    rules: Rule[]
    files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
    pathsToVisit: string[][]
    useExactPaths: boolean
    ruleIndex: RuleIndex
  } & NodeType
  state: ApplicationState | undefined
  fixOptions: FixOptions
}): Generator<ProjectFiles | void>
function* visitNode({
  args,
  state,
  fixOptions,
}: {
  args: {
    path: (string | number)[]
    rules: Rule[]
    files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
    pathsToVisit: string[][]
    useExactPaths: boolean
    ruleIndex: RuleIndex
  } & NodeType
  state: ApplicationState | undefined
  fixOptions?: FixOptions
}): Generator<IssueResult | ProjectFiles | void> {
  const { rules, pathsToVisit, useExactPaths, ruleIndex, ...data } = args
  const { files, value, path, memo, nodeType } = data
  if (
    !shouldVisitTree({
      path: data.path,
      pathsToVisit,
    })
  ) {
    // We don't need to search this path or any of its subpaths
    return
  }

  if (
    !useExactPaths ||
    shouldSearchExactPath({ path: data.path, pathsToVisit })
  ) {
    const matchingRules = rulesForNodeType(ruleIndex, nodeType)
    if (matchingRules.length > 0) {
      const results: (IssueResult & SearchResult)[] = []
      let fixedFiles: ProjectFiles | undefined
      for (const rule of matchingRules) {
        rule.visit(
          // Report callback used to report issues
          ({ path, details, fixes, info }) => {
            if (fixOptions) {
              // We're in "fix mode"
              if (
                // We only overwrite fixedFiles once to avoid conflicting fixes
                !fixedFiles &&
                // The current fix must be one of the fixes reported
                fixes?.includes(fixOptions.fixType) &&
                // The rule must have an implementation for the fix
                rule.fixes?.[fixOptions.fixType]
              ) {
                const ruleFixes = rule.fixes[fixOptions.fixType]?.(
                  // We must use the path from the report, not the original path
                  // because the report might be for a subpath
                  { data: { ...data, path }, details, state },
                )
                if (ruleFixes) {
                  fixedFiles = applyFixResult(data.files, ruleFixes)
                }
              }
            } else {
              const res: Record<string, unknown> = {
                path,
              }
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
          state,
        )
        if (fixedFiles) {
          // We have applied a fix, stop processing more rules
          break
        }
      }

      if (fixOptions) {
        if (fixedFiles) {
          yield fixedFiles
        }
      } else {
        for (const result of results) {
          yield result
        }
      }
    }
  }

  switch (nodeType) {
    // The node types below currently don't require any further traversal
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
        component: value,
        packageName: undefined,
        getComponent: (name) => files.components[name],
        globalFormulas: {
          formulas: files.formulas,
          packages: files.packages,
        },
      })

      if (isNodeTypeActive(ruleIndex, 'component-attribute')) {
        for (const key in value.attributes) {
          const attribute = value.attributes[key]
          if (isDefined(attribute)) {
            yield* visitNode({
              args: {
                nodeType: 'component-attribute',
                value: attribute,
                path: [...path, 'attributes', key],
                rules,
                files,
                pathsToVisit,
                useExactPaths,
                memo,
                component,
                ruleIndex,
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }
      }

      if (isNodeTypeActive(ruleIndex, 'component-variable')) {
        for (const key in value.variables) {
          const variable = value.variables[key]
          if (isDefined(variable)) {
            yield* visitNode({
              args: {
                nodeType: 'component-variable',
                value: variable,
                path: [...path, 'variables', key],
                rules,
                files,
                pathsToVisit,
                useExactPaths,
                memo,
                component,
                ruleIndex,
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }
      }

      if (isAnyNodeTypeActive(ruleIndex, API_SUBTREE_TYPES)) {
        for (const key in value.apis) {
          const api = value.apis[key]
          if (!api) {
            continue
          }
          yield* visitNode({
            args: {
              nodeType: 'component-api',
              value: api,
              component,
              path: [...path, 'apis', key],
              rules,
              files,
              pathsToVisit,
              useExactPaths,
              memo,
              ruleIndex,
            },
            state,
            fixOptions: fixOptions as any,
          })
          if (
            !isLegacyApi(api) &&
            isNodeTypeActive(ruleIndex, 'component-api-input')
          ) {
            for (const [inputKey, input] of Object.entries(api.inputs)) {
              yield* visitNode({
                args: {
                  nodeType: 'component-api-input',
                  value: input,
                  api,
                  component,
                  path: [...path, 'apis', key, 'inputs', inputKey],
                  rules,
                  files,
                  pathsToVisit,
                  useExactPaths,
                  memo,
                  ruleIndex,
                },
                state,
                fixOptions: fixOptions as any,
              })
            }
          }
        }
      }

      if (isNodeTypeActive(ruleIndex, 'component-formula')) {
        for (const key in value.formulas) {
          const formula = value.formulas[key]
          if (isDefined(formula)) {
            yield* visitNode({
              args: {
                nodeType: 'component-formula',
                value: formula,
                path: [...path, 'formulas', key],
                rules,
                files,
                pathsToVisit,
                useExactPaths,
                memo,
                component,
                ruleIndex,
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }
      }

      if (isNodeTypeActive(ruleIndex, 'component-workflow')) {
        for (const key in value.workflows) {
          const workflow = value.workflows[key]
          if (isDefined(workflow)) {
            yield* visitNode({
              args: {
                nodeType: 'component-workflow',
                value: workflow,
                path: [...path, 'workflows', key],
                rules,
                files,
                pathsToVisit,
                useExactPaths,
                memo,
                component,
                ruleIndex,
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }
      }

      if (isNodeTypeActive(ruleIndex, 'component-event')) {
        for (let i = 0; i < (value.events ?? []).length; i++) {
          const event = value.events?.[i]
          if (event) {
            yield* visitNode({
              args: {
                nodeType: 'component-event',
                path: [...path, 'events', i],
                rules,
                files,
                pathsToVisit,
                useExactPaths,
                memo,
                value: { component, event },
                ruleIndex,
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }
      }

      if (isNodeTypeActive(ruleIndex, 'component-context')) {
        for (const key in value.contexts) {
          yield* visitNode({
            args: {
              nodeType: 'component-context',
              value: value.contexts[key],
              path: [...path, 'contexts', key],
              rules,
              files,
              pathsToVisit,
              useExactPaths,
              memo,
              ruleIndex,
            },
            state,
            fixOptions: fixOptions as any,
          })
        }
      }

      if (isAnyNodeTypeActive(ruleIndex, COMPONENT_NODE_SUBTREE_TYPES)) {
        for (const key in value.nodes) {
          const node = value.nodes[key]
          yield* visitNode({
            args: {
              nodeType: 'component-node',
              value: node,
              path: [...path, 'nodes', key],
              rules,
              files,
              pathsToVisit,
              useExactPaths,
              memo,
              component,
              ruleIndex,
            },
            state,
            fixOptions: fixOptions as any,
          })
          if (
            isDefined(node) &&
            (node.type === 'component' || node.type === 'element') &&
            isNodeTypeActive(ruleIndex, 'component-node-attribute')
          ) {
            // Visit attributes on component and element nodes
            for (const attrKey in node.attrs) {
              const attr = node.attrs[attrKey]
              yield* visitNode({
                args: {
                  nodeType: 'component-node-attribute',
                  value: { key: attrKey, value: attr },
                  path: [...path, 'nodes', key, 'attrs', attrKey],
                  rules,
                  files,
                  pathsToVisit,
                  useExactPaths,
                  memo,
                  node: node,
                  ruleIndex,
                },
                state,
                fixOptions: fixOptions as any,
              })
            }
          }
        }
      }

      if (isNodeTypeActive(ruleIndex, 'formula')) {
        for (const {
          path: formulaPath,
          formula,
          packageName,
        } of component.formulasInComponent()) {
          if (packageName && packageName !== 'root') {
            // Skip reporting issues from inside package formulas
            continue
          }

          yield* visitNode({
            args: {
              nodeType: 'formula',
              value: formula,
              path: [...path, ...formulaPath],
              rules,
              files,
              pathsToVisit,
              useExactPaths,
              memo,
              component,
              ruleIndex,
            },
            state,
            fixOptions: fixOptions as any,
          })
        }
      }

      if (isAnyNodeTypeActive(ruleIndex, ACTION_MODEL_SUBTREE_TYPES)) {
        for (const [
          actionPath,
          action,
        ] of component.actionModelsInComponent()) {
          yield* visitNode({
            args: {
              nodeType: 'action-model',
              value: action,
              path: [...path, ...actionPath],
              rules,
              files,
              pathsToVisit,
              useExactPaths,
              memo,
              component,
              ruleIndex,
            },
            state,
            fixOptions: fixOptions as any,
          })
          if (action.type === 'Custom' || action.type === undefined) {
            if (isNodeTypeActive(ruleIndex, 'action-custom-model-argument')) {
              for (
                let index = 0;
                index < (action.arguments?.length ?? 0);
                index++
              ) {
                const arg = action.arguments?.[index]
                if (arg) {
                  yield* visitNode({
                    args: {
                      nodeType: 'action-custom-model-argument',
                      value: { action, argument: arg, argumentIndex: index },
                      path: [...path, ...actionPath, 'arguments', index],
                      rules,
                      files,
                      pathsToVisit,
                      useExactPaths,
                      memo,
                      component,
                      ruleIndex,
                    },
                    state,
                    fixOptions: fixOptions as any,
                  })
                }
              }
            }
            if (isNodeTypeActive(ruleIndex, 'action-custom-model-event')) {
              const actionEvents = action.events ?? {}
              for (const eventName in actionEvents) {
                if (!Object.hasOwn(actionEvents, eventName)) continue
                const event = actionEvents[eventName]
                yield* visitNode({
                  args: {
                    nodeType: 'action-custom-model-event',
                    value: { action, event, eventName },
                    path: [...path, ...actionPath, 'events', eventName],
                    rules,
                    files,
                    pathsToVisit,
                    useExactPaths,
                    memo,
                    component,
                    ruleIndex,
                  },
                  state,
                  fixOptions: fixOptions as any,
                })
              }
            }
          }
        }
      }
      break
    }

    case 'project-formula':
      if (isNodeTypeActive(ruleIndex, 'formula') && isToddleFormula(value)) {
        const formula = new ToddleFormula({
          formula: value.formula,
          globalFormulas: {
            formulas: files.formulas,
            packages: files.packages,
          },
        })
        for (const {
          path: formulaPath,
          formula: f,
          packageName,
        } of formula.formulasInFormula()) {
          if (packageName && packageName !== 'root') {
            // Skip reporting issues from inside package formulas
            continue
          }

          yield* visitNode({
            args: {
              nodeType: 'formula',
              value: f,
              path: [...path, 'formula', ...formulaPath],
              rules,
              files,
              pathsToVisit,
              useExactPaths,
              memo,
              ruleIndex,
            },
            state,
            fixOptions: fixOptions as any,
          })
        }
      }
      break

    case 'component-node':
      if (value?.type === 'element' || value?.type === 'component') {
        if (isNodeTypeActive(ruleIndex, 'style-declaration')) {
          for (const [styleKey, styleValue] of Object.entries(
            value.style ?? {},
          )) {
            yield* visitNode({
              args: {
                nodeType: 'style-declaration',
                value: { styleProperty: styleKey, styleValue, element: value },
                path: [...path, 'style', styleKey],
                rules,
                files,
                pathsToVisit,
                useExactPaths,
                memo,
                ruleIndex,
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }

        // Legacy style-variables only exist on element nodes
        if (
          value.type === 'element' &&
          isNodeTypeActive(ruleIndex, 'style-variable')
        ) {
          const styleVariables = value['style-variables']
          if (styleVariables) {
            for (let i = 0; i < styleVariables.length; i++) {
              const styleVariable = styleVariables[i]
              yield* visitNode({
                args: {
                  nodeType: 'style-variable',
                  value: { styleVariable, element: value },
                  path: [...path, 'style-variables', i],
                  rules,
                  files,
                  pathsToVisit,
                  useExactPaths,
                  memo,
                  ruleIndex,
                },
                state,
                fixOptions: fixOptions as any,
              })
            }
          }
        }

        if (
          value.customProperties &&
          isNodeTypeActive(ruleIndex, 'custom-property')
        ) {
          for (const [customPropertyKey, customProperty] of Object.entries(
            value.customProperties,
          )) {
            yield* visitNode({
              args: {
                nodeType: 'custom-property',
                value: {
                  key: customPropertyKey as CustomPropertyName,
                  value: customProperty,
                  element: value,
                },
                path: [...path, 'customProperties', customPropertyKey],
                rules,
                files,
                pathsToVisit,
                useExactPaths,
                memo,
                ruleIndex,
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }

        if (value.animations && isNodeTypeActive(ruleIndex, 'animation')) {
          for (const [animationKey, animation] of Object.entries(
            value.animations,
          )) {
            yield* visitNode({
              args: {
                nodeType: 'animation',
                node: value,
                value: {
                  key: animationKey,
                  value: animation,
                },
                path: [...path, 'animations', animationKey],
                rules,
                files,
                pathsToVisit,
                useExactPaths,
                memo,
                ruleIndex,
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }

        const variants = value.variants
        if (
          variants &&
          isAnyNodeTypeActive(ruleIndex, [
            'style-variant',
            'style-declaration',
            'custom-property',
          ])
        ) {
          for (let i = 0; i < variants.length; i++) {
            const variant = variants[i]
            if (isNodeTypeActive(ruleIndex, 'style-variant')) {
              yield* visitNode({
                args: {
                  nodeType: 'style-variant',
                  value: { variant, element: value },
                  path: [...path, 'variants', i],
                  rules,
                  files,
                  pathsToVisit,
                  useExactPaths,
                  memo,
                  ruleIndex,
                },
                state,
                fixOptions: fixOptions as any,
              })
            }
            if (isNodeTypeActive(ruleIndex, 'style-declaration')) {
              for (const [styleKey, styleValue] of Object.entries(
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                variant.style ?? {},
              )) {
                yield* visitNode({
                  args: {
                    nodeType: 'style-declaration',
                    value: {
                      styleProperty: styleKey,
                      styleValue,
                      element: value,
                    },
                    path: [...path, 'variants', i, 'style', styleKey],
                    rules,
                    files,
                    pathsToVisit,
                    useExactPaths,
                    memo,
                    ruleIndex,
                  },
                  state,
                  fixOptions: fixOptions as any,
                })
              }
            }
            if (
              variant.customProperties &&
              isNodeTypeActive(ruleIndex, 'custom-property')
            ) {
              for (const [customPropertyKey, customProperty] of Object.entries(
                variant.customProperties,
              )) {
                yield* visitNode({
                  args: {
                    nodeType: 'custom-property',
                    value: {
                      key: customPropertyKey as CustomPropertyName,
                      value: customProperty,
                      element: value,
                      variant,
                    },
                    path: [
                      ...path,
                      'variants',
                      i,
                      'customProperties',
                      customPropertyKey,
                    ],
                    rules,
                    files,
                    pathsToVisit,
                    useExactPaths,
                    memo,
                    ruleIndex,
                  },
                  state,
                  fixOptions: fixOptions as any,
                })
              }
            }
          }
        }
      }
      break

    case 'api-service': {
      if (isNodeTypeActive(ruleIndex, 'formula')) {
        const apiService = new ToddleApiService<string>({
          service: value,
          globalFormulas: {
            formulas: files.formulas,
            packages: files.packages,
          },
        })
        for (const {
          path: formulaPath,
          formula,
        } of apiService.formulasInService()) {
          yield* visitNode({
            args: {
              nodeType: 'formula',
              value: formula,
              path: [...path, ...formulaPath],
              rules,
              files,
              pathsToVisit,
              useExactPaths,
              memo,
              ruleIndex,
            },
            state,
            fixOptions: fixOptions as any,
          })
        }
      }
      break
    }

    case 'project-route': {
      if (isNodeTypeActive(ruleIndex, 'formula')) {
        const projectRoute = new ToddleRoute<string>({
          route: value,
          globalFormulas: {
            formulas: files.formulas,
            packages: files.packages,
          },
        })
        for (const {
          path: formulaPath,
          formula,
        } of projectRoute.formulasInRoute()) {
          yield* visitNode({
            args: {
              nodeType: 'formula',
              value: formula,
              path: [...path, 'formula', ...formulaPath],
              rules,
              files,
              pathsToVisit,
              useExactPaths,
              memo,
              ruleIndex,
            },
            state,
            fixOptions: fixOptions as any,
          })
        }
      }
      break
    }
  }
}
