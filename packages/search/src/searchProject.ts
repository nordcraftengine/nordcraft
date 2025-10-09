import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { isToddleFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import { ToddleFormula } from '@nordcraft/core/dist/formula/ToddleFormula'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { ToddleApiService } from '@nordcraft/ssr/dist/ToddleApiService'
import { ToddleRoute } from '@nordcraft/ssr/dist/ToddleRoute'
import type { ApplicationState, FixType, NodeType, Result, Rule } from './types'
import { shouldSearchExactPath, shouldVisitTree } from './util/helpers'

interface FixOptions {
  mode: 'FIX'
  fixType: FixType
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
  rules: Rule[]
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
}): Generator<Result>
export function searchProject(args: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: Rule[]
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
}): Generator<Result | ProjectFiles | void> {
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
        },
        state,
        fixOptions: fixOptions as any,
      })
    }
  }

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
      },
      state,
      fixOptions: fixOptions as any,
    })
  }

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
      },
      state,
      fixOptions: fixOptions as any,
    })
  }

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
      },
      state,
      fixOptions: fixOptions as any,
    })
  }

  if (files.services) {
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
        },
        state,
        fixOptions: fixOptions as any,
      })
    }
  }

  if (files.routes) {
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
        },
        state,
        fixOptions: fixOptions as any,
      })
    }
  }

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
    },
    state,
    fixOptions: fixOptions as any,
  })
}

function visitNode(args: {
  args: {
    path: (string | number)[]
    rules: Rule[]
    files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
    pathsToVisit: string[][]
    useExactPaths: boolean
  } & NodeType
  state: ApplicationState | undefined
  fixOptions: never
}): Generator<Result>
function visitNode(args: {
  args: {
    path: (string | number)[]
    rules: Rule[]
    files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
    pathsToVisit: string[][]
    useExactPaths: boolean
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
  } & NodeType
  state: ApplicationState | undefined
  fixOptions?: FixOptions
}): Generator<Result | ProjectFiles | void> {
  const { rules, pathsToVisit, useExactPaths, ...data } = args
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
    const results: Result[] = []
    let fixedFiles: ProjectFiles | undefined
    for (const rule of rules) {
      // eslint-disable-next-line no-console
      console.timeStamp(`Visiting rule ${rule.code}`)
      rule.visit(
        // Report callback used to report issues
        (path, details, fixes) => {
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
                { ...data, path },
                state,
              )
              if (ruleFixes) {
                fixedFiles = ruleFixes
              }
            }
          } else {
            // We're in "report mode"
            results.push({
              code: rule.code,
              category: rule.category,
              level: rule.level,
              path,
              details,
              fixes,
            })
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

  switch (nodeType) {
    // The node types below currently don't require any further traversal
    case 'action-model':
    case 'component-api-input':
    case 'component-api':
    case 'component-attribute':
    case 'component-context':
    case 'component-event':
    case 'component-formula':
    case 'component-node-attribute':
    case 'component-variable':
    case 'component-workflow':
    case 'formula':
    case 'project-action':
    case 'project-config':
    case 'project-theme':
    case 'style-declaration':
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

      for (const key in value.attributes) {
        yield* visitNode({
          args: {
            nodeType: 'component-attribute',
            value: value.attributes[key],
            path: [...path, 'attributes', key],
            rules,
            files,
            pathsToVisit,
            useExactPaths,
            memo,
            component,
          },
          state,
          fixOptions: fixOptions as any,
        })
      }

      for (const key in value.variables) {
        yield* visitNode({
          args: {
            nodeType: 'component-variable',
            value: value.variables[key],
            path: [...path, 'variables', key],
            rules,
            files,
            pathsToVisit,
            useExactPaths,
            memo,
            component,
          },
          state,
          fixOptions: fixOptions as any,
        })
      }

      for (const key in value.apis) {
        const api = value.apis[key]
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
          },
          state,
          fixOptions: fixOptions as any,
        })
        if (!isLegacyApi(api)) {
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
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }
      }

      for (const key in value.formulas) {
        yield* visitNode({
          args: {
            nodeType: 'component-formula',
            value: value.formulas[key],
            path: [...path, 'formulas', key],
            rules,
            files,
            pathsToVisit,
            useExactPaths,
            memo,
            component,
          },
          state,
          fixOptions: fixOptions as any,
        })
      }

      for (const key in value.workflows) {
        yield* visitNode({
          args: {
            nodeType: 'component-workflow',
            value: value.workflows[key],
            path: [...path, 'workflows', key],
            rules,
            files,
            pathsToVisit,
            useExactPaths,
            memo,
            component,
          },
          state,
          fixOptions: fixOptions as any,
        })
      }

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
            },
            state,
            fixOptions: fixOptions as any,
          })
        }
      }

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
          },
          state,
          fixOptions: fixOptions as any,
        })
      }

      for (const key in value.nodes) {
        yield* visitNode({
          args: {
            nodeType: 'component-node',
            value: value.nodes[key],
            path: [...path, 'nodes', key],
            rules,
            files,
            pathsToVisit,
            useExactPaths,
            memo,
            component,
          },
          state,
          fixOptions: fixOptions as any,
        })
        if (
          value.nodes[key].type === 'component' ||
          value.nodes[key].type === 'element'
        ) {
          // Visit attributes on component and element nodes
          for (const attrKey in value.nodes[key].attrs) {
            const attr = value.nodes[key].attrs[attrKey]
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
                node: value.nodes[key],
              },
              state,
              fixOptions: fixOptions as any,
            })
          }
        }
      }

      for (const {
        path: formulaPath,
        formula,
      } of component.formulasInComponent()) {
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
          },
          state,
          fixOptions: fixOptions as any,
        })
      }

      for (const [actionPath, action] of component.actionModelsInComponent()) {
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
          },
          state,
          fixOptions: fixOptions as any,
        })
      }
      break
    }

    case 'project-formula':
      if (isToddleFormula(value)) {
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
        } of formula.formulasInFormula()) {
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
            },
            state,
            fixOptions: fixOptions as any,
          })
        }
      }
      break

    case 'component-node':
      if (value.type === 'element' || value.type === 'component') {
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
            },
            state,
            fixOptions: fixOptions as any,
          })
        }
        const variants = value.variants
        if (variants) {
          for (let i = 0; i < variants.length; i++) {
            const variant = variants[i]
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
              },
              state,
              fixOptions: fixOptions as any,
            })
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
                },
                state,
                fixOptions: fixOptions as any,
              })
            }
          }
        }
      }
      break

    case 'api-service': {
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
          },
          state,
          fixOptions: fixOptions as any,
        })
      }
      break
    }

    case 'project-route': {
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
          },
          state,
          fixOptions: fixOptions as any,
        })
      }
      break
    }
  }
}
