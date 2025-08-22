import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { isToddleFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import { ToddleFormula } from '@nordcraft/core/dist/formula/ToddleFormula'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { ToddleApiService } from '@nordcraft/ssr/dist/ToddleApiService'
import { ToddleRoute } from '@nordcraft/ssr/dist/ToddleRoute'
import type { ApplicationState, FixType, NodeType, Result, Rule } from './types'
import { shouldSearchPath } from './util/helpers'

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
  state?: ApplicationState
}): Generator<Result>
export function searchProject(args: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: Rule[]
  pathsToVisit?: string[][]
  state?: ApplicationState
  options: FixOptions
}): Generator<ProjectFiles | void>
export function* searchProject({
  files,
  rules,
  pathsToVisit = [],
  state,
  options,
}: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rules: Rule[]
  pathsToVisit?: string[][]
  state?: ApplicationState
  options?: FixOptions
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
          memo,
        },
        state,
        options: options as any,
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
        memo,
      },
      state,
      options: options as any,
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
        memo,
      },
      state,
      options: options as any,
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
        memo,
      },
      state,
      options: options as any,
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
          memo,
        },
        state,
        options: options as any,
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
          memo,
        },
        state,
        options: options as any,
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
      memo,
    },
    state,
    options: options as any,
  })
}

// function* visitProxy({
//   args,
//   state,
//   mode
// }: {
//   args: {
//     path: (string | number)[]
//     rules: Rule[]
//     files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
//     pathsToVisit: string[][]
//   } & NodeType
//   state: ApplicationState | undefined
//   mode: 'VISIT' | 'FIX'
// }): Generator<typeof mode extends 'VISIT' ? Result : ProjectFiles | void> {
//   if (mode === 'VISIT') {
//     yield* visitNode({ args, state, mode }) as any as Generator<Result>
//   } else {
//     yield* visitNode({ args, state, mode })
//   }
// }

function visitNode(args: {
  args: {
    path: (string | number)[]
    rules: Rule[]
    files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
    pathsToVisit: string[][]
  } & NodeType
  state: ApplicationState | undefined
}): Generator<Result>
function visitNode(args: {
  args: {
    path: (string | number)[]
    rules: Rule[]
    files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
    pathsToVisit: string[][]
  } & NodeType
  state: ApplicationState | undefined
  options: { mode: 'FIX'; fixType: FixType }
}): Generator<ProjectFiles | void>
function* visitNode({
  args,
  state,
  options,
}: {
  args: {
    path: (string | number)[]
    rules: Rule[]
    files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
    pathsToVisit: string[][]
  } & NodeType
  state: ApplicationState | undefined
  options?: { mode: 'FIX'; fixType: FixType }
}): Generator<Result | ProjectFiles | void> {
  performance.mark(`visitNode-${args.path.join('/')}`)
  const { rules, pathsToVisit, ...data } = args
  const { files, value, path, memo, nodeType } = data
  if (!shouldSearchPath(data.path, pathsToVisit)) {
    return
  }

  if (options) {
    for (const rule of rules) {
      const fixedFiles = rule.fix?.(data, options.fixType, state)
      if (fixedFiles) {
        yield fixedFiles
      }
    }
  } else {
    const results: Result[] = []
    for (const rule of rules) {
      performance.mark(`rule-${rule.code}`)
      rule.visit(
        (path, details, fixes) => {
          results.push({
            code: rule.code,
            category: rule.category,
            level: rule.level,
            path,
            details,
            fixes,
          })
        },
        data,
        state,
      )
    }

    for (const result of results) {
      yield result
    }
  }

  switch (nodeType) {
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
            memo,
            component,
          },
          state,
          options: options as any,
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
            memo,
            component,
          },
          state,
          options: options as any,
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
            memo,
          },
          state,
          options: options as any,
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
                memo,
              },
              state,
              options: options as any,
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
            memo,
            component,
          },
          state,
          options: options as any,
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
            memo,
            component,
          },
          state,
          options: options as any,
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
              memo,
              value: { component, event },
            },
            state,
            options: options as any,
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
            memo,
          },
          state,
          options: options as any,
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
            memo,
            component,
          },
          state,
          options: options as any,
        })
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
            memo,
            component,
          },
          state,
          options: options as any,
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
            memo,
            component,
          },
          state,
          options: options as any,
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
              memo,
            },
            state,
            options: options as any,
          })
        }
      }
      break

    case 'component-node':
      if (value.type === 'element') {
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
                memo,
              },
              state,
              options: options as any,
            })
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
            memo,
          },
          state,
          options: options as any,
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
            memo,
          },
          state,
          options: options as any,
        })
      }
      break
    }
  }
}
