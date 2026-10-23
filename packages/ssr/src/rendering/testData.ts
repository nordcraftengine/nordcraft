import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { ComponentAPI } from '@nordcraft/core/dist/api/apiTypes'
import type {
  ActionModel,
  Component,
  ComponentAttribute,
  ComponentFormula,
  ComponentVariable,
  ComponentWorkflow,
  CustomActionArgument,
  CustomActionModel,
  EventActionModel,
  NodeModel,
  SetURLParameterAction,
  SwitchActionModel,
  TextNodeModel,
  VariableActionModel,
  WorkflowActionModel,
  WorkflowCallbackActionModel,
} from '@nordcraft/core/dist/component/component.types'
import {
  isFormula,
  type ApplyOperation,
  type Formula,
  type FunctionArgument,
} from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'
import {
  filterObject,
  mapObject,
  omitKeys,
} from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ProjectFiles } from '../ssr.types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isProjectFiles = (value: unknown): value is ProjectFiles =>
  isRecord(value) &&
  ('components' in value || 'packages' in value) &&
  !('nodes' in value)

export const treeShakePackages = (
  files: ProjectFiles,
): ProjectFiles['packages'] => {
  if (!files.packages) {
    return files.packages
  }

  const used = new Set<string>()
  const queue: Array<{ pkgName: string; compName: string }> = []

  const register = (pkgName: string, compName: string) => {
    const key = `${pkgName}/${compName}`
    if (!used.has(key)) {
      used.add(key)
      queue.push({ pkgName, compName })
    }
  }

  // 1. Scan all project components for package references
  for (const component of Object.values(files.components ?? {})) {
    if (!component) continue
    for (const node of Object.values(component.nodes ?? {})) {
      if (node?.type === 'component' && node.package) {
        register(node.package, node.name)
      }
    }
  }

  // 2. Transitive resolution across package components
  while (queue.length > 0) {
    const next = queue.shift()
    if (!next) break
    const { pkgName, compName } = next
    const comp = files.packages[pkgName]?.components?.[compName]
    if (comp) {
      for (const node of Object.values(comp.nodes ?? {})) {
        if (node?.type === 'component') {
          const targetPkg = node.package ?? pkgName
          register(targetPkg, node.name)
        }
      }
    }
  }

  // 3. Filter packages to only keep used components
  return mapObject(files.packages, ([pkgName, pkg]) => {
    if (!pkg) {
      return [pkgName, pkg]
    }
    const filteredComponents = filterObject(
      pkg.components ?? {},
      ([compName]) => used.has(`${pkgName}/${compName}`),
    )
    return [
      pkgName,
      {
        ...pkg,
        components: filteredComponents,
      },
    ]
  })
}

export const removeComponentTestData = (component: Component): Component =>
  removeOptionalPropertiesIfEmpty<Component>(
    {
      ...component,
      attributes: mapObject(
        filterObject<Nullable<ComponentAttribute>, ComponentAttribute>(
          component.attributes ?? {},
          ([_, value]) => isDefined(value),
        ),
        ([key, value]) => [key, omitKeys(value, ['testValue'])],
      ),
      ...(component.events
        ? {
            events: component.events
              .filter(isDefined)
              .map((event) => omitKeys(event, ['dummyEvent'])),
          }
        : undefined),
      nodes: processNodes(component.nodes),
      ...(component.route
        ? {
            route: {
              ...component.route,
              path: component.route.path.map((p) => omitKeys(p, ['testValue'])),
              query: mapObject(component.route.query, ([key, value]) => [
                key,
                omitKeys(value, ['testValue']),
              ]),
              ...(component.route.info?.meta
                ? {
                    info: {
                      ...component.route.info,
                      meta: mapObject(component.route.info.meta, ([k, tag]) => [
                        k,
                        tag?.attrs
                          ? {
                              ...tag,
                              attrs: mapObject(tag.attrs, ([ak, av]) => [
                                ak,
                                av ? removeFormulaTestData(av) : av,
                              ]),
                            }
                          : tag,
                      ]),
                    },
                  }
                : {}),
            },
          }
        : {}),
      ...(component.formulas
        ? {
            formulas: mapObject(
              filterObject<Nullable<ComponentFormula>, ComponentFormula>(
                component.formulas,
                ([_, value]) => isDefined(value),
              ),
              ([key, value]) => [
                key,
                {
                  ...value,
                  arguments: (value.arguments ?? []).map((a) =>
                    omitKeys(a, ['testValue']),
                  ),
                  formula: removeFormulaTestData(value.formula),
                },
              ],
            ),
          }
        : {}),
      ...(component.variables
        ? {
            variables: mapObject(
              filterObject<Nullable<ComponentVariable>, ComponentVariable>(
                component.variables,
                ([_, variable]) => isDefined(variable),
              ),
              ([key, variable]) => [
                key,
                {
                  ...omitKeys(variable, ['name']),
                  ...(variable.initialValue
                    ? {
                        initialValue: removeFormulaTestData(
                          variable.initialValue,
                        ),
                      }
                    : {}),
                },
              ],
            ),
          }
        : {}),
      ...(component.workflows
        ? {
            workflows: mapObject(
              filterObject<Nullable<ComponentWorkflow>, ComponentWorkflow>(
                component.workflows,
                ([_, value]) => isDefined(value),
              ),
              ([key, value]) => [
                key,
                {
                  ...omitKeys(value, ['testValue']),
                  actions: value.actions.map(removeActionTestData),
                  parameters: (value.parameters ?? []).map((p) =>
                    omitKeys(p, ['testValue']),
                  ),
                  callbacks: value.callbacks?.map((c) =>
                    omitKeys(c, ['testValue']),
                  ),
                },
              ],
            ),
          }
        : {}),
      apis: mapObject(
        filterObject<Nullable<ComponentAPI>, ComponentAPI>(
          component.apis ?? {},
          ([_, api]) => isDefined(api),
        ),
        ([key, api]) => [
          key,
          // service and servicePath are only necessary in the editor. All information about an API
          // request is available on the api object itself
          isLegacyApi(api) ? api : omitKeys(api, ['service', 'servicePath']),
        ],
      ),
      ...(component.onLoad
        ? {
            onLoad: {
              ...component.onLoad,
              actions: component.onLoad.actions?.map(removeActionTestData),
            },
          }
        : undefined),
      ...(component.onAttributeChange
        ? {
            onAttributeChange: {
              ...component.onAttributeChange,
              actions:
                component.onAttributeChange.actions?.map(removeActionTestData),
            },
          }
        : undefined),
    },
    [
      'version',
      'page',
      'route',
      'attributes',
      'variables',
      'formulas',
      'contexts',
      'workflows',
      'apis',
      'nodes',
      'events',
      'onLoad',
      'onAttributeChange',
      'exported',
      'customElement',
    ],
  )

export const removeProjectTestData = (files: ProjectFiles): ProjectFiles => {
  const packages = treeShakePackages(files)
  return {
    ...files,
    components: mapObject(files.components ?? {}, ([key, comp]) => [
      key,
      comp ? removeComponentTestData(comp) : comp,
    ]),
    ...(packages
      ? {
          packages: mapObject(packages, ([pkgName, pkg]) => [
            pkgName,
            pkg
              ? {
                  ...pkg,
                  components: mapObject(pkg.components ?? {}, ([ck, cv]) => [
                    ck,
                    cv ? removeComponentTestData(cv) : cv,
                  ]),
                }
              : pkg,
          ]),
        }
      : {}),
  }
}

export function removeTestData(files: ProjectFiles): ProjectFiles
export function removeTestData(component: Component): Component
export function removeTestData(
  target: Component | ProjectFiles,
): Component | ProjectFiles {
  if (isProjectFiles(target)) {
    return removeProjectTestData(target)
  }
  return removeComponentTestData(target)
}

const cleanNode = (node: NodeModel): NodeModel => {
  switch (node.type) {
    case 'element': {
      const updatedNode: NodeModel = {
        ...node,
        events: mapObject(node.events ?? {}, ([eventKey, eventValue]) => [
          eventKey,
          eventValue
            ? {
                ...eventValue,
                actions: eventValue.actions?.map(removeActionTestData),
              }
            : null,
        ]),
        condition: node.condition
          ? removeFormulaTestData(node.condition)
          : undefined,
        repeat: node.repeat ? removeFormulaTestData(node.repeat) : undefined,
        repeatKey: node.repeatKey
          ? removeFormulaTestData(node.repeatKey)
          : undefined,
        attrs: node.attrs
          ? mapObject(node.attrs, ([attrKey, attrFormula]) => [
              attrKey,
              attrFormula ? removeFormulaTestData(attrFormula) : attrFormula,
            ])
          : undefined,
        customProperties: node.customProperties
          ? mapObject(node.customProperties, ([propKey, prop]) => [
              propKey,
              prop
                ? {
                    ...prop,
                    formula: removeFormulaTestData(prop.formula),
                  }
                : prop,
            ])
          : undefined,
        variants: node.variants
          ? node.variants.map((v) => ({
              ...v,
              customProperties: v.customProperties
                ? mapObject(v.customProperties, ([propKey, prop]) => [
                    propKey,
                    prop
                      ? {
                          ...prop,
                          formula: removeFormulaTestData(prop.formula),
                        }
                      : prop,
                  ])
                : undefined,
            }))
          : undefined,
      }
      return removeOptionalPropertiesIfEmpty(updatedNode, [
        'animations',
        'attrs',
        'children',
        'condition',
        'classes',
        'customProperties',
        'events',
        'id',
        'repeat',
        'repeatKey',
        'slot',
        'style-variables',
        'style',
        'styleVariables',
        'variants',
      ]) as NodeModel
    }
    case 'text': {
      return removeOptionalPropertiesIfEmpty<TextNodeModel>(
        {
          ...node,
          value: removeFormulaTestData(node.value),
          condition: node.condition
            ? removeFormulaTestData(node.condition)
            : undefined,
          repeat: node.repeat ? removeFormulaTestData(node.repeat) : undefined,
          repeatKey: node.repeatKey
            ? removeFormulaTestData(node.repeatKey)
            : undefined,
        },
        ['id', 'slot', 'repeat', 'repeatKey', 'condition'],
      ) as NodeModel
    }
    case 'component': {
      const updatedNode: NodeModel = {
        ...node,
        events: mapObject(node.events ?? {}, ([eventKey, eventValue]) => [
          eventKey,
          eventValue
            ? {
                ...eventValue,
                actions: eventValue.actions?.map(removeActionTestData),
              }
            : null,
        ]),
        condition: node.condition
          ? removeFormulaTestData(node.condition)
          : undefined,
        repeat: node.repeat ? removeFormulaTestData(node.repeat) : undefined,
        repeatKey: node.repeatKey
          ? removeFormulaTestData(node.repeatKey)
          : undefined,
        attrs: node.attrs
          ? mapObject(node.attrs, ([attrKey, attrFormula]) => [
              attrKey,
              attrFormula ? removeFormulaTestData(attrFormula) : attrFormula,
            ])
          : undefined,
        variants: node.variants
          ? node.variants.map((v) => ({
              ...v,
              customProperties: v.customProperties
                ? mapObject(v.customProperties, ([propKey, prop]) => [
                    propKey,
                    prop
                      ? {
                          ...prop,
                          formula: removeFormulaTestData(prop.formula),
                        }
                      : prop,
                  ])
                : undefined,
            }))
          : undefined,
      }
      return removeOptionalPropertiesIfEmpty(updatedNode, [
        'id',
        'slot',
        'path',
        'package',
        'condition',
        'repeat',
        'repeatKey',
        'variants',
        'animations',
        'attrs',
        'children',
        'events',
      ]) as NodeModel
    }
    case 'slot': {
      return removeOptionalPropertiesIfEmpty(
        omitKeys(
          node,
          // Always remove repeat and repeatKey from slots as they're not supported
          ['repeat', 'repeatKey'],
        ),
        ['children', 'condition', 'events', 'name', 'slot'],
      ) as NodeModel
    }
  }
}

export const processNodes = (
  nodes: Component['nodes'],
): Record<string, NodeModel> | undefined => {
  if (!isDefined(nodes)) {
    return undefined
  }
  return mapObject(
    filterObject<NodeModel | undefined | null, NodeModel>(nodes, ([_, value]) =>
      isDefined(value),
    ),
    ([key, value]) => [key, cleanNode(value)],
  )
}

type OptionalKeys<T extends object> = {
  [K in keyof T]-?: object extends Pick<T, K> ? K : never
}[keyof T]

const removeOptionalPropertiesIfEmpty = <T extends object>(
  obj: T,
  keysToRemove: OptionalKeys<T>[],
): T => {
  const newObj = { ...obj }
  for (const key of keysToRemove) {
    const value = obj[key]
    if (
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0) || // Covers empty arrays
      (typeof value === 'object' && Object.keys(value).length === 0) // Covers empty objects
    ) {
      delete newObj[key]
    }
  }
  return newObj
}

export const removeActionTestData = (action: ActionModel): ActionModel => {
  if (!isDefined(action)) {
    return action
  }
  switch (action.type) {
    case 'SetVariable':
      return removeOptionalPropertiesIfEmpty<VariableActionModel>(
        {
          ...action,
          ...(action.data
            ? { data: removeFormulaTestData(action.data) }
            : undefined),
        },
        ['arguments'],
      )
    case 'TriggerEvent':
    case 'SetURLParameter':
    case 'TriggerWorkflowCallback':
      return removeOptionalPropertiesIfEmpty<
        EventActionModel | SetURLParameterAction | WorkflowCallbackActionModel
      >(
        {
          ...action,
          ...(action.data
            ? { data: removeFormulaTestData(action.data) }
            : undefined),
        },
        ['arguments'],
      )
    case 'Switch':
      return removeOptionalPropertiesIfEmpty<SwitchActionModel>(
        {
          ...action,
          cases: (action.cases ?? []).map((c) => ({
            ...c,
            ...(c.condition
              ? { condition: removeFormulaTestData(c.condition) }
              : undefined),
            actions: c.actions.map(removeActionTestData),
          })),
          default: {
            ...action.default,
            actions: (action.default?.actions ?? []).map(removeActionTestData),
          },
        },
        ['arguments'],
      )
    case 'Fetch':
      return {
        ...action,
        inputs: action.inputs
          ? mapObject(action.inputs, ([key, value]) => [
              key,
              {
                ...value,
                ...(value.formula
                  ? { formula: removeFormulaTestData(value.formula) }
                  : undefined),
              },
            ])
          : action.inputs,
        onSuccess: {
          ...action.onSuccess,
          actions: (action.onSuccess?.actions ?? []).map(removeActionTestData),
        },
        onError: {
          ...action.onError,
          actions: (action.onError?.actions ?? []).map(removeActionTestData),
        },
        onMessage: action.onMessage
          ? {
              ...action.onMessage,
              actions: (action.onMessage?.actions ?? []).map(
                removeActionTestData,
              ),
            }
          : undefined,
      }
    case 'Custom':
    case undefined:
    case null:
      return removeOptionalPropertiesIfEmpty<CustomActionModel>(
        {
          // The 'group' property was used for categorizing actions and should
          // not have been persisted in projects. But since it's there (for some actions)
          // we should remove it
          ...omitKeys(action, ['description', 'group', 'label']),
          ...(action.arguments
            ? {
                arguments: action.arguments.map((a) =>
                  a ? removeActionArgumentTestData(a) : a,
                ),
              }
            : undefined),
          ...(action.events
            ? {
                events: mapObject(
                  action.events ?? {},
                  ([eventKey, eventValue]) => [
                    eventKey,
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    eventValue
                      ? {
                          ...eventValue,
                          actions: (eventValue.actions ?? []).map(
                            removeActionTestData,
                          ),
                        }
                      : eventValue,
                  ],
                ),
              }
            : undefined),
        },
        ['arguments', 'events', 'package'],
      )
    case 'SetURLParameters':
      return {
        ...action,
        parameters: mapObject(action.parameters, ([key, value]) => [
          key,
          removeFormulaTestData(value),
        ]),
      }
    case 'TriggerWorkflow':
      return removeOptionalPropertiesIfEmpty<WorkflowActionModel>(
        {
          ...action,
          ...(action.parameters
            ? {
                parameters: mapObject(action.parameters, ([key, value]) => [
                  key,
                  value?.formula
                    ? {
                        ...value,
                        formula: removeFormulaTestData(value.formula),
                      }
                    : value,
                ]),
              }
            : undefined),
          ...(action.callbacks
            ? {
                callbacks: mapObject(action.callbacks, ([key, value]) => [
                  key,
                  {
                    ...value,
                    actions:
                      value?.actions?.map((a) =>
                        a ? removeActionTestData(a) : a,
                      ) ?? [],
                  },
                ]),
              }
            : undefined),
        },
        ['callbacks', 'contextProvider', 'parameters'],
      )
    case 'AbortFetch':
      // Fetch aborts have no test data
      return action
  }
}

export const removeActionArgumentTestData = (action: CustomActionArgument) => {
  if (!isDefined(action)) {
    return action
  }
  return {
    ...omitKeys(action, ['description', 'type']),
    formula: action.formula
      ? removeFormulaTestData(action.formula)
      : action.formula,
  }
}

const cleanFunctionArgument = (arg: FunctionArgument): FunctionArgument => {
  const { testValue: _, ...clean } = arg as FunctionArgument & {
    testValue?: unknown
    description?: unknown
  }
  delete (clean as { description?: unknown }).description
  return {
    ...clean,
    formula: removeFormulaTestData(arg.formula),
  }
}

export const removeFormulaTestData = (_formula: Formula): Formula => {
  if (!isFormula(_formula)) {
    return _formula
  }
  const formula = omitKeys(_formula as unknown as Record<string, unknown>, [
    'label',
    '@nordcraft/metadata',
    '@toddle/metadata',
    'description',
    'display_name',
    'variableArguments',
  ]) as unknown as Formula

  switch (formula.type) {
    case 'path':
    case 'value':
      return formula
    case 'function': {
      const updated = {
        ...formula,
        ...(formula.arguments
          ? {
              arguments: formula.arguments.map(cleanFunctionArgument),
            }
          : {}),
      }
      return removeOptionalPropertiesIfEmpty(updated, ['arguments'])
    }
    case 'record':
      return {
        ...formula,
        ...(formula.entries
          ? {
              entries: formula.entries.map(cleanFunctionArgument),
            }
          : {}),
      }
    case 'object':
      return {
        ...formula,
        ...(formula.arguments
          ? {
              arguments: formula.arguments.map(cleanFunctionArgument),
            }
          : {}),
      }
    case 'array':
    case 'or':
    case 'and':
      return {
        ...formula,
        ...(formula.arguments
          ? {
              arguments: formula.arguments.map((arg) => ({
                ...arg,
                formula: removeFormulaTestData(arg.formula),
              })),
            }
          : {}),
      }
    case 'apply':
      return removeOptionalPropertiesIfEmpty<ApplyOperation>(
        {
          ...formula,
          ...(formula.arguments
            ? {
                arguments: formula.arguments.map(cleanFunctionArgument),
              }
            : {}),
        },
        ['arguments'],
      )
    case 'switch':
      return {
        ...formula,
        ...(formula.cases
          ? {
              cases: formula.cases.map((c) => ({
                ...c,
                condition: removeFormulaTestData(c.condition),
                ...(c.formula
                  ? { formula: removeFormulaTestData(c.formula) }
                  : {}),
              })),
            }
          : {}),
        default: removeFormulaTestData(formula.default),
      }
  }
}
