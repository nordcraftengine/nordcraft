import { isLegacyApi } from '../api/api'
import { LegacyToddleApi } from '../api/LegacyToddleApi'
import { ToddleApiV2 } from '../api/ToddleApiV2'
import type { Formula, FunctionOperation } from '../formula/formula'
import type { GlobalFormulas } from '../formula/formulaTypes'
import {
  getFormulasInAction,
  getFormulasInFormula,
} from '../formula/formulaUtils'
import { isDefined } from '../utils/util'
import { getActionsInAction } from './actionUtils'
import type {
  ActionModel,
  Component,
  CustomActionModel,
  NodeModel,
} from './component.types'
import { isPageComponent } from './isPageComponent'

export class ToddleComponent<Handler> {
  private component: Component
  private globalFormulas: GlobalFormulas<Handler>
  private getComponent: (
    name: string,
    packageName?: string,
  ) => Component | undefined
  public packageName?: string

  constructor({
    component,
    getComponent,
    packageName,
    globalFormulas,
  }: {
    component: Component
    getComponent: (name: string, packageName?: string) => Component | undefined
    packageName: string | undefined
    globalFormulas: GlobalFormulas<Handler>
  }) {
    this.component = component
    this.getComponent = getComponent
    this.packageName = packageName
    this.globalFormulas = globalFormulas
  }

  get uniqueSubComponents(): ToddleComponent<Handler>[] {
    const components = new Map<string, ToddleComponent<Handler>>()

    const visitNode = (packageName?: string) => (node: NodeModel) => {
      if (node.type !== 'component') {
        return
      }
      if (components.has(node.name)) {
        return
      }
      const component = this.getComponent(
        node.name,
        node.package ?? packageName,
      )
      if (!component) {
        return
      }
      components.set(
        component.name,
        new ToddleComponent({
          component,
          getComponent: this.getComponent,
          packageName: node.package ?? packageName,
          globalFormulas: this.globalFormulas,
        }),
      )
      Object.values(component.nodes ?? {}).forEach(
        visitNode(node.package ?? packageName),
      )
    }
    Object.values(this.nodes ?? {}).forEach(visitNode())
    return [...components.values()]
  }

  get formulaReferences() {
    return new Set(
      Array.from(this.formulasInComponent())
        .filter(
          (
            entry,
          ): entry is {
            path: (string | number)[]
            formula: FunctionOperation
            packageName?: string
          } => entry.formula.type === 'function',
        )
        .flatMap((entry) => {
          const refs = [entry.formula.name]
          const packageName =
            entry.formula.package ?? entry.packageName ?? this.packageName
          if (
            packageName &&
            this.globalFormulas.packages?.[packageName]?.formulas?.[
              entry.formula.name
            ]
          ) {
            refs.push([packageName, entry.formula.name].join('/'))
          }

          return refs
        }),
    )
  }

  get actionReferences(): Set<string> {
    return new Set(
      Array.from(this.actionModelsInComponent())
        .filter(
          (entry): entry is [(string | number)[], CustomActionModel] =>
            entry[1].type === 'Custom' || entry[1].type === undefined,
        )
        .map(([, a]) => [a.package, a.name].filter(isDefined).join('/')),
    )
  }

  /**
   * Traverse all formulas in the component.
   * @returns An iterable that yields the path and formula.
   */
  *formulasInComponent(): Generator<{
    path: (string | number)[]
    formula: Formula
    packageName?: string
  }> {
    const globalFormulas = this.globalFormulas
    function* visitNode(
      node: NodeModel,
      path: (string | number)[] = [],
    ): Generator<{
      path: (string | number)[]
      formula: Formula
      packageName?: string
    }> {
      switch (node.type) {
        case 'text':
          yield* getFormulasInFormula({
            formula: node.condition,
            globalFormulas,
            path: [...path, 'condition'],
          })
          yield* getFormulasInFormula({
            formula: node.repeat,
            globalFormulas,
            path: [...path, 'repeat'],
          })
          yield* getFormulasInFormula({
            formula: node.repeatKey,
            globalFormulas,
            path: [...path, 'repeatKey'],
          })
          yield* getFormulasInFormula({
            formula: node.value,
            globalFormulas,
            path: [...path, 'value'],
          })
          break
        case 'slot':
          yield* getFormulasInFormula({
            formula: node.condition,
            globalFormulas,
            path: [...path, 'condition'],
          })
          break
        case 'component':
          yield* getFormulasInFormula({
            formula: node.condition,
            globalFormulas,
            path: [...path, 'condition'],
            packageName: node.package,
          })
          yield* getFormulasInFormula({
            formula: node.repeat,
            globalFormulas,
            path: [...path, 'repeat'],
            packageName: node.package,
          })
          yield* getFormulasInFormula({
            formula: node.repeatKey,
            globalFormulas,
            path: [...path, 'repeatKey'],
            packageName: node.package,
          })
          for (const [attrKey, attr] of Object.entries(node.attrs ?? {})) {
            yield* getFormulasInFormula({
              formula: attr,
              globalFormulas,
              path: [...path, 'attrs', attrKey],
              packageName: node.package,
            })
          }
          for (const [eventKey, event] of Object.entries(node.events ?? {})) {
            for (const [actionKey, action] of Object.entries(
              event?.actions ?? {},
            )) {
              yield* getFormulasInAction({
                action,
                globalFormulas,
                path: [...path, 'events', eventKey, 'actions', actionKey],
                packageName: node.package,
              })
            }
          }
          for (const [customPropertyKey, customProperty] of Object.entries(
            node.customProperties ?? {},
          )) {
            yield* getFormulasInFormula({
              formula: customProperty.formula,
              globalFormulas,
              path: [...path, 'customProperties', customPropertyKey, 'formula'],
              packageName: node.package,
            })
          }
          for (const [variantKey, variant] of Object.entries(
            node.variants ?? {},
          )) {
            for (const [customPropertyKey, customProperty] of Object.entries(
              variant.customProperties ?? {},
            )) {
              yield* getFormulasInFormula({
                formula: customProperty.formula,
                globalFormulas,
                path: [
                  ...path,
                  'variants',
                  variantKey,
                  'customProperties',
                  customPropertyKey,
                  'formula',
                ],
                packageName: node.package,
              })
            }
          }
          break
        case 'element':
          yield* getFormulasInFormula({
            formula: node.condition,
            globalFormulas,
            path: [...path, 'condition'],
          })
          yield* getFormulasInFormula({
            formula: node.repeat,
            globalFormulas,
            path: [...path, 'repeat'],
          })
          yield* getFormulasInFormula({
            formula: node.repeatKey,
            globalFormulas,
            path: [...path, 'repeatKey'],
          })
          for (const [attrKey, attr] of Object.entries(node.attrs ?? {})) {
            yield* getFormulasInFormula({
              formula: attr,
              globalFormulas,
              path: [...path, 'attrs', attrKey],
            })
          }
          for (const [eventKey, event] of Object.entries(node.events ?? {})) {
            for (const [actionKey, a] of Object.entries(event?.actions ?? {})) {
              yield* getFormulasInAction({
                action: a,
                globalFormulas,
                path: [...path, 'events', eventKey, 'actions', actionKey],
              })
            }
          }
          for (const [classKey, c] of Object.entries(node.classes ?? {})) {
            yield* getFormulasInFormula({
              formula: c.formula,
              globalFormulas,
              path: [...path, 'classes', classKey, 'formula'],
            })
          }

          for (const [styleVariableKey, styleVariable] of Object.entries(
            node['style-variables'] ?? {},
          )) {
            yield* getFormulasInFormula({
              formula: styleVariable.formula,
              globalFormulas,
              path: [...path, 'style-variables', styleVariableKey, 'formula'],
            })
          }

          for (const [customPropertyKey, customProperty] of Object.entries(
            node.customProperties ?? {},
          )) {
            yield* getFormulasInFormula({
              formula: customProperty.formula,
              globalFormulas,
              path: [...path, 'customProperties', customPropertyKey, 'formula'],
            })
          }

          for (const [variantKey, variant] of Object.entries(
            node.variants ?? {},
          )) {
            for (const [customPropertyKey, customProperty] of Object.entries(
              variant.customProperties ?? {},
            )) {
              yield* getFormulasInFormula({
                formula: customProperty.formula,
                globalFormulas,
                path: [
                  ...path,
                  'variants',
                  variantKey,
                  'customProperties',
                  customPropertyKey,
                  'formula',
                ],
              })
            }
          }
          break
      }
    }

    yield* getFormulasInFormula({
      formula: this.route?.info?.language?.formula,
      globalFormulas,
      path: ['route', 'info', 'language', 'formula'],
    })
    yield* getFormulasInFormula({
      formula: this.route?.info?.title?.formula,
      globalFormulas,
      path: ['route', 'info', 'title', 'formula'],
    })
    yield* getFormulasInFormula({
      formula: this.route?.info?.description?.formula,
      globalFormulas,
      path: ['route', 'info', 'description', 'formula'],
    })
    yield* getFormulasInFormula({
      formula: this.route?.info?.icon?.formula,
      globalFormulas,
      path: ['route', 'info', 'icon', 'formula'],
    })
    yield* getFormulasInFormula({
      formula: this.route?.info?.charset?.formula,
      globalFormulas,
      path: ['route', 'info', 'charset', 'formula'],
    })
    for (const [metaKey, meta] of Object.entries(
      this.route?.info?.meta ?? {},
    )) {
      yield* getFormulasInFormula({
        formula: meta.content,
        globalFormulas,
        path: ['route', 'info', 'meta', metaKey, 'content'],
      })
      for (const [attrKey, a] of Object.entries(meta.attrs)) {
        yield* getFormulasInFormula({
          formula: a,
          globalFormulas,
          path: ['route', 'info', 'meta', metaKey, 'attrs', attrKey],
        })
      }
    }
    for (const [formulaKey, formula] of Object.entries(this.formulas ?? {})) {
      yield* getFormulasInFormula({
        formula: formula.formula,
        globalFormulas,
        path: ['formulas', formulaKey, 'formula'],
      })
    }
    for (const [variableKey, variable] of Object.entries(
      this.variables ?? {},
    )) {
      yield* getFormulasInFormula({
        formula: variable.initialValue,
        globalFormulas,
        path: ['variables', variableKey, 'initialValue'],
      })
    }
    for (const [workflowKey, workflow] of Object.entries(
      this.workflows ?? {},
    )) {
      for (const [actionKey, action] of workflow.actions.entries()) {
        yield* getFormulasInAction({
          action,
          globalFormulas,
          path: ['workflows', workflowKey, 'actions', actionKey],
        })
      }
    }
    for (const [, api] of Object.entries(this.apis)) {
      yield* api.formulasInApi()
    }
    for (const [actionKey, action] of Object.entries(
      this.component.onLoad?.actions ?? {},
    )) {
      yield* getFormulasInAction({
        action,
        globalFormulas,
        path: ['onLoad', 'actions', actionKey],
      })
    }
    for (const [actionKey, action] of Object.entries(
      this.component.onAttributeChange?.actions ?? {},
    )) {
      yield* getFormulasInAction({
        action,
        globalFormulas,
        path: ['onAttributeChange', 'actions', actionKey],
      })
    }
    for (const [nodeKey, node] of Object.entries(this.nodes ?? {})) {
      yield* visitNode(node, ['nodes', nodeKey])
    }
  }

  /**
   * Traverse all actions in the component.
   * @returns An iterable that yields the path and action.
   */
  *actionModelsInComponent(): Generator<[(string | number)[], ActionModel]> {
    function* visitNode(
      node: NodeModel,
      path: (string | number)[] = [],
    ): Generator<[(string | number)[], ActionModel]> {
      switch (node.type) {
        case 'text':
        case 'slot':
          break
        case 'component':
        case 'element':
          for (const [eventKey, event] of Object.entries(node.events ?? {})) {
            for (const [actionKey, a] of Object.entries(event?.actions ?? {})) {
              yield* getActionsInAction(a, [
                ...path,
                'events',
                eventKey,
                'actions',
                actionKey,
              ])
            }
          }
          break
      }
    }

    for (const [workflowKey, workflow] of Object.entries(
      this.workflows ?? {},
    )) {
      for (const [key, a] of Object.entries(workflow?.actions ?? {})) {
        yield* getActionsInAction(a, ['workflows', workflowKey, 'actions', key])
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    for (const [apiKey, api] of Object.entries(this.apis ?? {})) {
      if (!isLegacyApi(api)) {
        yield* api.actionModelsInApi()
        continue
      }

      // Legacy API
      for (const [actionKey, a] of Object.entries(
        api.onCompleted?.actions ?? {},
      )) {
        yield* getActionsInAction(a, [
          'apis',
          apiKey,
          'onCompleted',
          'actions',
          actionKey,
        ])
      }
      for (const [actionKey, a] of Object.entries(
        api.onFailed?.actions ?? {},
      )) {
        yield* getActionsInAction(a, [
          'apis',
          apiKey,
          'onFailed',
          'actions',
          actionKey,
        ])
      }
    }
    for (const [actionKey, action] of Object.entries(
      this.component.onLoad?.actions ?? {},
    )) {
      yield* getActionsInAction(action, ['onLoad', 'actions', actionKey])
    }
    for (const [actionKey, action] of Object.entries(
      this.component.onAttributeChange?.actions ?? {},
    )) {
      yield* getActionsInAction(action, [
        'onAttributeChange',
        'actions',
        actionKey,
      ])
    }
    for (const [nodeKey, node] of Object.entries(this.nodes ?? {})) {
      yield* visitNode(node, ['nodes', nodeKey])
    }
  }

  get formulas() {
    return this.component.formulas
  }

  get name() {
    return this.component.name
  }

  get route() {
    return this.component.route
  }

  get attributes() {
    return this.component.attributes
  }

  get variables() {
    return this.component.variables
  }

  get workflows() {
    return this.component.workflows
  }

  get apis() {
    return Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      Object.entries(this.component.apis ?? {}).map(([key, api]) => [
        key,
        isLegacyApi(api)
          ? new LegacyToddleApi(api, key, this.globalFormulas)
          : new ToddleApiV2(api, key, this.globalFormulas),
      ]),
    )
  }

  get nodes() {
    return this.component.nodes
  }

  get events() {
    return this.component.events
  }

  get onLoad() {
    return this.component.onLoad
  }

  get onAttributeChange() {
    return this.component.onAttributeChange
  }

  get isPage() {
    return isPageComponent(this.component)
  }

  get contexts() {
    return this.component.contexts
  }

  get exported() {
    return this.component.exported
  }

  get customElement() {
    return this.component.customElement
  }
}
