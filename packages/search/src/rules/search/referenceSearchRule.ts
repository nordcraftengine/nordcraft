import { isDefined, isLegacyApi, type Component } from '@nordcraft/core'
import type { Base, MemoFn, NodeType } from '../../types'
import { isLegacyAction } from '../../util/helpers'
import {
  matchesSegment,
  type ReferenceToken,
  type SegmentMatcher,
} from '../../util/parseSearchQuery'

const CSS_VAR_REGEX = /var\(\s*(--[\w-]+)/g

export function getNodeTypesForReference(
  token: ReferenceToken,
): NodeType['nodeType'][] {
  switch (token.targetKind) {
    case 'component':
      return ['component-node', 'component-context']
    case 'formula':
      return ['formula', 'component-context']
    case 'workflow':
      return ['action-model', 'component-context']
    case 'context':
      return ['component-context', 'formula', 'action-model']
    case 'action':
      return ['action-model']
    case 'variable':
      return ['formula', 'action-model']
    case 'attribute':
      return ['formula', 'component-node-attribute']
    case 'event':
      return ['action-model', 'component-node']
    case 'api':
      return ['formula', 'action-model']
    case 'api-service':
      return ['component-api']
    case 'url-param':
      return ['formula', 'action-model']
    case 'workflow-param':
      return ['formula', 'action-model']
    case 'slot':
      return ['component-node']
    case 'css':
      return ['style-declaration', 'custom-property', 'project-theme-property']
    case 'package':
      return ['component-node', 'component-context', 'formula', 'action-model']
  }
}

function matcherMemoKey(matcher: SegmentMatcher | undefined): string {
  if (!matcher) {
    return ''
  }
  return `${matcher.matchType}:${matcher.value}`
}

function getTargetComponent(
  files: Base['files'],
  componentName: string,
  packageName?: string,
): Component | undefined {
  if (packageName) {
    return files.packages?.[packageName]?.components[componentName]
  }
  return files.components[componentName]
}

function getMemoizedComponentFormulaKeys(options: {
  files: Base['files']
  memo: MemoFn
  componentName: string
  formulaMatcher: SegmentMatcher
  packageName?: string
}): { keys: Set<string>; hasComp: boolean } {
  const { files, memo, componentName, formulaMatcher, packageName } = options
  return memo(
    `ref-cf/${packageName ?? ''}/${componentName}/${matcherMemoKey(formulaMatcher)}`,
    () => {
      const comp = getTargetComponent(files, componentName, packageName)
      const keys = new Set<string>()
      if (comp?.formulas) {
        for (const k in comp.formulas) {
          const formula = comp.formulas[k]
          if (
            matchesSegment(k, formulaMatcher) ||
            matchesSegment(formula?.name, formulaMatcher)
          ) {
            keys.add(k)
          }
        }
      }
      return { keys, hasComp: isDefined(comp) }
    },
  )
}

function getMemoizedComponentWorkflowKeys(options: {
  files: Base['files']
  memo: MemoFn
  componentName: string
  workflowMatcher: SegmentMatcher
  packageName?: string
}): { keys: Set<string>; hasComp: boolean } {
  const { files, memo, componentName, workflowMatcher, packageName } = options
  return memo(
    `ref-cw/${packageName ?? ''}/${componentName}/${matcherMemoKey(workflowMatcher)}`,
    () => {
      const comp = getTargetComponent(files, componentName, packageName)
      const keys = new Set<string>()
      if (comp?.workflows) {
        for (const k in comp.workflows) {
          const wf = comp.workflows[k]
          if (
            matchesSegment(k, workflowMatcher) ||
            matchesSegment(wf?.name, workflowMatcher)
          ) {
            keys.add(k)
          }
        }
      }
      return { keys, hasComp: isDefined(comp) }
    },
  )
}

function getMemoizedProjectFormulaIds(
  files: Base['files'],
  memo: MemoFn,
  formulaMatcher: SegmentMatcher,
): Set<string> {
  return memo(`ref-pf/${matcherMemoKey(formulaMatcher)}`, () => {
    const ids = new Set<string>()
    const formulasMap = files.formulas
    if (formulasMap) {
      for (const key in formulasMap) {
        const f = formulasMap[key]
        if (
          matchesSegment(key, formulaMatcher) ||
          matchesSegment(f?.name, formulaMatcher)
        ) {
          ids.add(key)
          if (f?.name) {
            ids.add(f.name)
          }
        }
      }
    }
    return ids
  })
}

function getMemoizedPackageFormulaIds(options: {
  files: Base['files']
  memo: MemoFn
  packageName: string
  formulaMatcher: SegmentMatcher
}): Set<string> {
  const { files, memo, packageName, formulaMatcher } = options
  return memo(
    `ref-pkgf/${packageName}/${matcherMemoKey(formulaMatcher)}`,
    () => {
      const ids = new Set<string>()
      const formulasMap = files.packages?.[packageName]?.formulas
      if (formulasMap) {
        for (const key in formulasMap) {
          const f = formulasMap[key]
          if (
            matchesSegment(key, formulaMatcher) ||
            matchesSegment(f?.name, formulaMatcher)
          ) {
            ids.add(key)
            if (f?.name) {
              ids.add(f.name)
            }
          }
        }
      }
      return ids
    },
  )
}

function resolveContextProvider(
  files: Base['files'],
  consumingCompName: string,
  contextKey: string,
): { providerName: string; packageName?: string } {
  const ctx = files.components[consumingCompName]?.contexts?.[contextKey]
  if (ctx) {
    return {
      providerName: ctx.componentName ?? contextKey,
      packageName: ctx.package ?? undefined,
    }
  }
  const slashIdx = contextKey.indexOf('/')
  if (slashIdx > 0) {
    return {
      packageName: contextKey.slice(0, slashIdx),
      providerName: contextKey.slice(slashIdx + 1),
    }
  }
  return { providerName: contextKey }
}

function matchComponentReference(
  data: NodeType,
  token: ReferenceToken,
): boolean {
  const { segments, rootScoped } = token
  const pkgMatcher = segments.length >= 2 ? segments[0] : undefined
  const compMatcher = segments.length >= 2 ? segments[1] : segments[0]

  if (data.nodeType === 'component-node') {
    const node = data.value
    if (node?.type !== 'component') {
      return false
    }
    if (pkgMatcher) {
      return (
        matchesSegment(node.package, pkgMatcher) &&
        matchesSegment(node.name, compMatcher)
      )
    }
    if (rootScoped && isDefined(node.package)) {
      return false
    }
    return matchesSegment(node.name, compMatcher)
  }

  if (data.nodeType === 'component-context') {
    const contextKey = String(data.path[3] ?? '')
    const actualComp = data.value.componentName ?? contextKey
    if (pkgMatcher) {
      return (
        matchesSegment(data.value.package, pkgMatcher) &&
        matchesSegment(actualComp, compMatcher)
      )
    }
    if (rootScoped && isDefined(data.value.package)) {
      return false
    }
    return matchesSegment(actualComp, compMatcher)
  }

  return false
}

function matchComponentFormulaNode(options: {
  data: NodeType
  compMatcher?: SegmentMatcher
  formulaMatcher: SegmentMatcher
  pkgMatcher?: SegmentMatcher
  includeInternal: boolean
}): boolean {
  const { data, compMatcher, formulaMatcher, pkgMatcher, includeInternal } =
    options

  const checkFormulaKeyOnProvider = (
    providerName: string,
    packageName: string | undefined,
    key: string,
  ): boolean => {
    const { keys, hasComp } = getMemoizedComponentFormulaKeys({
      files: data.files,
      memo: data.memo,
      componentName: providerName,
      formulaMatcher,
      packageName,
    })
    return hasComp ? keys.has(key) : matchesSegment(key, formulaMatcher)
  }

  if (data.nodeType === 'component-context') {
    const contextKey = String(data.path[3] ?? '')
    const providerName = data.value.componentName ?? contextKey
    const packageName = data.value.package ?? undefined

    if (pkgMatcher) {
      if (!matchesSegment(packageName, pkgMatcher)) {
        return false
      }
    } else if (isDefined(packageName)) {
      return false
    }

    if (compMatcher && !matchesSegment(providerName, compMatcher)) {
      return false
    }

    return data.value.formulas.some((fKey) =>
      checkFormulaKeyOnProvider(providerName, packageName, fKey),
    )
  }

  if (data.nodeType === 'formula') {
    const formula = data.value

    // Fast-path 1: Internal `apply` formula inside a component
    if (formula.type === 'apply') {
      if (!includeInternal || pkgMatcher || data.path[0] !== 'components') {
        return false
      }
      const currentCompName = String(data.path[1])
      if (compMatcher && !matchesSegment(currentCompName, compMatcher)) {
        return false
      }
      return checkFormulaKeyOnProvider(currentCompName, undefined, formula.name)
    }

    // Fast-path 2: External `Contexts.<contextKey>.<formulaKey>` path formula
    if (
      formula.type === 'path' &&
      formula.path[0] === 'Contexts' &&
      typeof formula.path[1] === 'string' &&
      typeof formula.path[2] === 'string' &&
      data.path[0] === 'components'
    ) {
      const currentCompName = String(data.path[1])
      const { providerName, packageName } = resolveContextProvider(
        data.files,
        currentCompName,
        formula.path[1],
      )

      if (pkgMatcher) {
        if (!matchesSegment(packageName, pkgMatcher)) {
          return false
        }
      } else if (isDefined(packageName)) {
        return false
      }

      if (compMatcher && !matchesSegment(providerName, compMatcher)) {
        return false
      }

      return checkFormulaKeyOnProvider(
        providerName,
        packageName,
        formula.path[2],
      )
    }
  }

  return false
}

function matchFormulaReference(data: NodeType, token: ReferenceToken): boolean {
  const { segments, rootScoped } = token

  // 1. Explicit project formula: @formula:/<name>
  if (rootScoped && segments.length === 1) {
    if (
      data.nodeType !== 'formula' ||
      data.value.type !== 'function' ||
      Boolean(data.value.package)
    ) {
      return false
    }
    const targetMatcher = segments[0]
    const ids = getMemoizedProjectFormulaIds(
      data.files,
      data.memo,
      targetMatcher,
    )
    return (
      ids.has(data.value.name) ||
      matchesSegment(data.value.name, targetMatcher) ||
      matchesSegment(data.value.display_name, targetMatcher)
    )
  }

  // 2. Unqualified 1-segment: @formula:<name> (matches project formula or any component formula)
  if (segments.length === 1) {
    const targetMatcher = segments[0]
    if (data.nodeType === 'formula' && data.value.type === 'function') {
      const ids = data.value.package
        ? getMemoizedPackageFormulaIds({
            files: data.files,
            memo: data.memo,
            packageName: data.value.package,
            formulaMatcher: targetMatcher,
          })
        : getMemoizedProjectFormulaIds(data.files, data.memo, targetMatcher)
      return (
        ids.has(data.value.name) ||
        matchesSegment(data.value.name, targetMatcher) ||
        matchesSegment(data.value.display_name, targetMatcher)
      )
    }

    return matchComponentFormulaNode({
      data,
      formulaMatcher: targetMatcher,
      includeInternal: true,
    })
  }

  // 3. 2 segments: @formula:<CompOrPkg>/<Name>
  if (segments.length === 2) {
    const [firstMatcher, secondMatcher] = segments
    if (data.nodeType === 'formula' && data.value.type === 'function') {
      if (
        isDefined(data.value.package) &&
        matchesSegment(data.value.package, firstMatcher)
      ) {
        const pkgIds = getMemoizedPackageFormulaIds({
          files: data.files,
          memo: data.memo,
          packageName: data.value.package,
          formulaMatcher: secondMatcher,
        })
        return (
          pkgIds.has(data.value.name) ||
          matchesSegment(data.value.name, secondMatcher)
        )
      }
      return false
    }

    return matchComponentFormulaNode({
      data,
      compMatcher: firstMatcher,
      formulaMatcher: secondMatcher,
      includeInternal: true,
    })
  }

  // 4. 3 segments: @formula:<Pkg>/<Comp>/<Name>
  if (segments.length === 3) {
    const [pkgMatcher, compMatcher, formulaMatcher] = segments
    return matchComponentFormulaNode({
      data,
      pkgMatcher,
      compMatcher,
      formulaMatcher,
      includeInternal: false,
    })
  }

  return false
}

function matchComponentWorkflowNode(options: {
  data: NodeType
  compMatcher?: SegmentMatcher
  workflowMatcher: SegmentMatcher
  pkgMatcher?: SegmentMatcher
  includeInternal: boolean
}): boolean {
  const { data, compMatcher, workflowMatcher, pkgMatcher, includeInternal } =
    options

  const checkWfKeyOnProvider = (
    providerName: string,
    packageName: string | undefined,
    key: string,
  ): boolean => {
    const { keys, hasComp } = getMemoizedComponentWorkflowKeys({
      files: data.files,
      memo: data.memo,
      componentName: providerName,
      workflowMatcher,
      packageName,
    })
    return hasComp ? keys.has(key) : matchesSegment(key, workflowMatcher)
  }

  if (data.nodeType === 'component-context') {
    const contextKey = String(data.path[3] ?? '')
    const providerName = data.value.componentName ?? contextKey
    const packageName = data.value.package ?? undefined

    if (pkgMatcher) {
      if (!matchesSegment(packageName, pkgMatcher)) {
        return false
      }
    } else if (isDefined(packageName)) {
      return false
    }

    if (compMatcher && !matchesSegment(providerName, compMatcher)) {
      return false
    }

    return data.value.workflows.some((wfKey) =>
      checkWfKeyOnProvider(providerName, packageName, wfKey),
    )
  }

  if (data.nodeType === 'action-model') {
    const action = data.value
    if (action.type !== 'TriggerWorkflow' || data.path[0] !== 'components') {
      return false
    }
    const currentCompName = String(data.path[1])

    // 1. Internal TriggerWorkflow inside provider component
    if (!action.contextProvider) {
      if (!includeInternal || pkgMatcher) {
        return false
      }
      if (compMatcher && !matchesSegment(currentCompName, compMatcher)) {
        return false
      }
      return checkWfKeyOnProvider(currentCompName, undefined, action.workflow)
    }

    // 2. External context TriggerWorkflow
    const { providerName, packageName } = resolveContextProvider(
      data.files,
      currentCompName,
      action.contextProvider,
    )

    if (pkgMatcher) {
      if (!matchesSegment(packageName, pkgMatcher)) {
        return false
      }
    } else if (isDefined(packageName)) {
      return false
    }

    if (compMatcher && !matchesSegment(providerName, compMatcher)) {
      return false
    }

    return checkWfKeyOnProvider(providerName, packageName, action.workflow)
  }

  return false
}

function matchWorkflowReference(
  data: NodeType,
  token: ReferenceToken,
): boolean {
  const { segments } = token

  if (segments.length === 1) {
    return matchComponentWorkflowNode({
      data,
      workflowMatcher: segments[0],
      includeInternal: true,
    })
  }

  if (segments.length === 2) {
    return matchComponentWorkflowNode({
      data,
      compMatcher: segments[0],
      workflowMatcher: segments[1],
      includeInternal: true,
    })
  }

  if (segments.length === 3) {
    return matchComponentWorkflowNode({
      data,
      pkgMatcher: segments[0],
      compMatcher: segments[1],
      workflowMatcher: segments[2],
      includeInternal: false,
    })
  }

  return false
}

function matchContextReference(data: NodeType, token: ReferenceToken): boolean {
  const { segments } = token

  // 1 segment: @context:<Comp>
  if (segments.length === 1) {
    const providerMatcher = segments[0]

    if (data.nodeType === 'component-context') {
      const contextKey = String(data.path[3] ?? '')
      const actualComp = data.value.componentName ?? contextKey
      return matchesSegment(actualComp, providerMatcher)
    }

    if (data.nodeType === 'formula') {
      if (
        data.value.type !== 'path' ||
        data.value.path[0] !== 'Contexts' ||
        typeof data.value.path[1] !== 'string' ||
        data.path[0] !== 'components'
      ) {
        return false
      }
      const { providerName } = resolveContextProvider(
        data.files,
        String(data.path[1]),
        data.value.path[1],
      )
      return matchesSegment(providerName, providerMatcher)
    }

    if (data.nodeType === 'action-model') {
      if (
        data.value.type !== 'TriggerWorkflow' ||
        typeof data.value.contextProvider !== 'string' ||
        data.path[0] !== 'components'
      ) {
        return false
      }
      const { providerName } = resolveContextProvider(
        data.files,
        String(data.path[1]),
        data.value.contextProvider,
      )
      return matchesSegment(providerName, providerMatcher)
    }

    return false
  }

  // 2 segments: @context:<Comp>/<Member>
  if (segments.length === 2) {
    const [compMatcher, memberMatcher] = segments
    return (
      matchComponentFormulaNode({
        data,
        compMatcher,
        formulaMatcher: memberMatcher,
        includeInternal: false,
      }) ||
      matchComponentWorkflowNode({
        data,
        compMatcher,
        workflowMatcher: memberMatcher,
        includeInternal: false,
      })
    )
  }

  // 3 segments: @context:<Pkg>/<Comp>/<Member>
  if (segments.length === 3) {
    const [pkgMatcher, compMatcher, memberMatcher] = segments
    return (
      matchComponentFormulaNode({
        data,
        pkgMatcher,
        compMatcher,
        formulaMatcher: memberMatcher,
        includeInternal: false,
      }) ||
      matchComponentWorkflowNode({
        data,
        pkgMatcher,
        compMatcher,
        workflowMatcher: memberMatcher,
        includeInternal: false,
      })
    )
  }

  return false
}

function matchActionReference(data: NodeType, token: ReferenceToken): boolean {
  if (data.nodeType !== 'action-model') {
    return false
  }
  const action = data.value
  const { segments, rootScoped } = token

  if (segments.length === 1) {
    const targetMatcher = segments[0]
    if (
      !rootScoped &&
      action.type !== 'Custom' &&
      action.type !== undefined &&
      matchesSegment(action.type, targetMatcher)
    ) {
      return true
    }
    if (action.type === 'Custom' || action.type === undefined) {
      if (rootScoped && action.package) {
        return false
      }
      if (matchesSegment(action.name, targetMatcher)) {
        return true
      }
      const actionIds = data.memo(
        `ref-pa/${matcherMemoKey(targetMatcher)}`,
        () => {
          const ids = new Set<string>()
          for (const key in data.files.actions) {
            const a = data.files.actions[key]
            if (
              matchesSegment(key, targetMatcher) ||
              matchesSegment(a?.name, targetMatcher)
            ) {
              ids.add(key)
              if (a?.name) {
                ids.add(a.name)
              }
            }
          }
          return ids
        },
      )
      return actionIds.has(action.name)
    }
    return false
  }

  if (segments.length === 2) {
    const [pkgMatcher, targetMatcher] = segments
    if (
      (action.type === 'Custom' || action.type === undefined) &&
      isDefined(action.package) &&
      matchesSegment(action.package, pkgMatcher)
    ) {
      if (matchesSegment(action.name, targetMatcher)) {
        return true
      }
      const pkgName = action.package
      const pkgActionIds = data.memo(
        `ref-pkga/${pkgName}/${matcherMemoKey(targetMatcher)}`,
        () => {
          const ids = new Set<string>()
          const actionsMap = data.files.packages?.[pkgName]?.actions
          for (const key in actionsMap) {
            const a = actionsMap[key]
            if (
              matchesSegment(key, targetMatcher) ||
              matchesSegment(a?.name, targetMatcher)
            ) {
              ids.add(key)
              if (a?.name) {
                ids.add(a.name)
              }
            }
          }
          return ids
        },
      )
      return pkgActionIds.has(action.name)
    }
  }

  return false
}

function matchVariableReference(
  data: NodeType,
  token: ReferenceToken,
): boolean {
  if (data.path[0] !== 'components') {
    return false
  }
  const { segments } = token
  const compMatcher = segments.length >= 2 ? segments[0] : undefined
  const varMatcher = segments.length >= 2 ? segments[1] : segments[0]

  if (data.nodeType === 'formula') {
    if (data.value.type !== 'path' || data.value.path[0] !== 'Variables') {
      return false
    }
    if (
      compMatcher !== undefined &&
      !matchesSegment(data.path[1], compMatcher)
    ) {
      return false
    }
    return matchesSegment(data.value.path[1], varMatcher)
  }

  if (data.nodeType === 'action-model') {
    if (data.value.type !== 'SetVariable') {
      return false
    }
    if (
      compMatcher !== undefined &&
      !matchesSegment(data.path[1], compMatcher)
    ) {
      return false
    }
    return matchesSegment(data.value.variable, varMatcher)
  }

  return false
}

function matchAttributeReference(
  data: NodeType,
  token: ReferenceToken,
): boolean {
  const { segments } = token
  const pkgMatcher = segments.length === 3 ? segments[0] : undefined
  const compMatcher =
    segments.length === 3
      ? segments[1]
      : segments.length === 2
        ? segments[0]
        : undefined
  const attrMatcher = segments[segments.length - 1]

  const resolveAttrKeys = (compName: string, packageName?: string) =>
    data.memo(
      `ref-attr/${packageName ?? ''}/${compName}/${matcherMemoKey(attrMatcher)}`,
      () => {
        const comp = getTargetComponent(data.files, compName, packageName)
        const keys = new Set<string>()
        if (comp?.attributes) {
          for (const k in comp.attributes) {
            const a = comp.attributes[k]
            if (
              matchesSegment(k, attrMatcher) ||
              matchesSegment(a?.name, attrMatcher)
            ) {
              keys.add(k)
            }
          }
        }
        return { keys, hasComp: isDefined(comp) }
      },
    )

  if (data.nodeType === 'formula') {
    if (
      pkgMatcher !== undefined ||
      data.value.type !== 'path' ||
      data.value.path[0] !== 'Attributes' ||
      !isDefined(data.value.path[1]) ||
      data.path[0] !== 'components'
    ) {
      return false
    }
    const currentComp = String(data.path[1])
    if (
      compMatcher !== undefined &&
      !matchesSegment(currentComp, compMatcher)
    ) {
      return false
    }
    const { keys, hasComp } = resolveAttrKeys(currentComp)
    const attrKey = String(data.value.path[1])
    return (
      keys.has(attrKey) || (!hasComp && matchesSegment(attrKey, attrMatcher))
    )
  }

  if (data.nodeType === 'component-node-attribute') {
    const { node, value } = data
    if (node.type !== 'component') {
      return false
    }
    if (pkgMatcher !== undefined && !matchesSegment(node.package, pkgMatcher)) {
      return false
    }
    if (compMatcher !== undefined) {
      if (pkgMatcher === undefined && isDefined(node.package)) {
        return false
      }
      if (!matchesSegment(node.name, compMatcher)) {
        return false
      }
    }
    const { keys, hasComp } = resolveAttrKeys(
      node.name,
      node.package ?? undefined,
    )
    return (
      keys.has(value.key) ||
      (!hasComp && matchesSegment(value.key, attrMatcher))
    )
  }

  return false
}

function matchEventReference(data: NodeType, token: ReferenceToken): boolean {
  const { segments } = token
  const pkgMatcher = segments.length === 3 ? segments[0] : undefined
  const compMatcher =
    segments.length === 3
      ? segments[1]
      : segments.length === 2
        ? segments[0]
        : undefined
  const eventMatcher = segments[segments.length - 1]

  if (data.nodeType === 'action-model') {
    if (pkgMatcher !== undefined || data.path[0] !== 'components') {
      return false
    }
    const action = data.value
    if (isLegacyAction(action)) {
      if (
        'name' in action &&
        'arguments' in action &&
        action.name === 'TriggerEvent' &&
        action.version === undefined
      ) {
        if (
          compMatcher !== undefined &&
          !matchesSegment(data.path[1], compMatcher)
        ) {
          return false
        }
        const nameArg = action.arguments?.find(
          (a) => a?.name === 'name',
        )?.formula
        return (
          nameArg?.type === 'value' &&
          typeof nameArg.value === 'string' &&
          matchesSegment(nameArg.value, eventMatcher)
        )
      }
      return false
    }
    if (action.type !== 'TriggerEvent') {
      return false
    }
    if (
      compMatcher !== undefined &&
      !matchesSegment(data.path[1], compMatcher)
    ) {
      return false
    }
    return matchesSegment(action.event, eventMatcher)
  }

  if (data.nodeType === 'component-node') {
    const node = data.value
    if (
      !node ||
      (node.type !== 'component' && node.type !== 'element') ||
      !node.events
    ) {
      return false
    }
    if (compMatcher !== undefined) {
      if (
        node.type !== 'component' ||
        !matchesSegment(node.name, compMatcher)
      ) {
        return false
      }
      if (pkgMatcher !== undefined) {
        if (!matchesSegment(node.package, pkgMatcher)) {
          return false
        }
      } else if (isDefined(node.package)) {
        return false
      }
    }
    for (const eventKey in node.events) {
      if (
        isDefined(node.events[eventKey]) &&
        matchesSegment(eventKey, eventMatcher)
      ) {
        return true
      }
    }
    return false
  }

  return false
}

function getMemoizedComponentApiKeys(options: {
  files: Base['files']
  memo: MemoFn
  compName: string
  apiMatcher: SegmentMatcher
}): Set<string> {
  const { files, memo, compName, apiMatcher } = options
  return memo(`ref-api/${compName}/${matcherMemoKey(apiMatcher)}`, () => {
    const comp = files.components[compName]
    const apiKeys = new Set<string>()
    if (comp?.apis) {
      for (const k in comp.apis) {
        const a = comp.apis[k]
        if (
          matchesSegment(k, apiMatcher) ||
          matchesSegment(a?.name, apiMatcher)
        ) {
          apiKeys.add(k)
        }
      }
    }
    return apiKeys
  })
}

function matchApiReference(data: NodeType, token: ReferenceToken): boolean {
  if (data.path[0] !== 'components') {
    return false
  }
  const { segments } = token
  const compMatcher = segments.length >= 2 ? segments[0] : undefined
  const apiMatcher = segments.length >= 2 ? segments[1] : segments[0]

  if (data.nodeType === 'formula') {
    if (
      data.value.type !== 'path' ||
      data.value.path[0] !== 'Apis' ||
      typeof data.value.path[1] !== 'string'
    ) {
      return false
    }
    const currentComp = String(data.path[1])
    if (
      compMatcher !== undefined &&
      !matchesSegment(currentComp, compMatcher)
    ) {
      return false
    }
    const apiKeys = getMemoizedComponentApiKeys({
      files: data.files,
      memo: data.memo,
      compName: currentComp,
      apiMatcher,
    })
    return (
      apiKeys.has(data.value.path[1]) ||
      matchesSegment(data.value.path[1], apiMatcher)
    )
  }

  if (data.nodeType === 'action-model') {
    if (data.value.type !== 'Fetch' && data.value.type !== 'AbortFetch') {
      return false
    }
    const currentComp = String(data.path[1])
    if (
      compMatcher !== undefined &&
      !matchesSegment(currentComp, compMatcher)
    ) {
      return false
    }
    const apiKeys = getMemoizedComponentApiKeys({
      files: data.files,
      memo: data.memo,
      compName: currentComp,
      apiMatcher,
    })
    return (
      apiKeys.has(data.value.api) || matchesSegment(data.value.api, apiMatcher)
    )
  }

  return false
}

function matchApiServiceReference(
  data: NodeType,
  token: ReferenceToken,
): boolean {
  if (
    data.nodeType !== 'component-api' ||
    isLegacyApi(data.value) ||
    typeof data.value.service !== 'string'
  ) {
    return false
  }
  const targetMatcher = token.segments[0]
  const serviceNames = data.memo(
    `ref-svc/${matcherMemoKey(targetMatcher)}`,
    () => {
      const names = new Set<string>()
      for (const key in data.files.services) {
        const s = data.files.services[key]
        if (
          matchesSegment(key, targetMatcher) ||
          matchesSegment(s?.name, targetMatcher)
        ) {
          names.add(key)
          if (s?.name) {
            names.add(s.name)
          }
        }
      }
      return names
    },
  )
  return (
    serviceNames.has(data.value.service) ||
    matchesSegment(data.value.service, targetMatcher)
  )
}

function matchUrlParamReference(
  data: NodeType,
  token: ReferenceToken,
): boolean {
  const { segments } = token
  const compMatcher = segments.length >= 2 ? segments[0] : undefined
  const paramMatcher = segments[segments.length - 1]

  if (data.nodeType === 'formula') {
    if (data.value.type !== 'path') {
      return false
    }
    const root = data.value.path[0]
    if (root !== 'URL parameters' && root !== 'Route parameters') {
      return false
    }
    if (
      compMatcher !== undefined &&
      (data.path[0] !== 'components' ||
        !matchesSegment(data.path[1], compMatcher))
    ) {
      return false
    }
    if (root === 'URL parameters') {
      return matchesSegment(data.value.path[1], paramMatcher)
    }
    return matchesSegment(data.value.path[2], paramMatcher)
  }

  if (data.nodeType === 'action-model') {
    if (
      data.value.type !== 'SetURLParameter' &&
      data.value.type !== 'SetURLParameters'
    ) {
      return false
    }
    if (
      compMatcher !== undefined &&
      (data.path[0] !== 'components' ||
        !matchesSegment(data.path[1], compMatcher))
    ) {
      return false
    }
    if (data.value.type === 'SetURLParameter') {
      return matchesSegment(data.value.parameter, paramMatcher)
    }
    for (const paramKey in data.value.parameters) {
      if (
        isDefined(data.value.parameters[paramKey]) &&
        matchesSegment(paramKey, paramMatcher)
      ) {
        return true
      }
    }
  }

  return false
}

function matchWorkflowParamReference(
  data: NodeType,
  token: ReferenceToken,
): boolean {
  const { segments } = token
  if (segments.length < 2) {
    return false
  }
  const compMatcher = segments.length >= 3 ? segments[0] : undefined
  const wfMatcher = segments.length >= 3 ? segments[1] : segments[0]
  const paramMatcher = segments[segments.length - 1]

  // 1. Inside workflow definition: Parameters.<paramName>
  if (data.nodeType === 'formula') {
    if (
      data.value.type !== 'path' ||
      data.value.path[0] !== 'Parameters' ||
      data.path[0] !== 'components' ||
      data.path[2] !== 'workflows' ||
      typeof data.path[3] !== 'string' ||
      !matchesSegment(data.value.path[1], paramMatcher)
    ) {
      return false
    }
    const compName = String(data.path[1])
    if (compMatcher && !matchesSegment(compName, compMatcher)) {
      return false
    }
    const { keys } = getMemoizedComponentWorkflowKeys({
      files: data.files,
      memo: data.memo,
      componentName: compName,
      workflowMatcher: wfMatcher,
    })
    return keys.has(data.path[3])
  }

  // 2. At TriggerWorkflow call sites passing the parameter
  if (data.nodeType === 'action-model') {
    if (data.value.type !== 'TriggerWorkflow' || !data.value.parameters) {
      return false
    }
    let hasMatchingParam = false
    for (const paramKey in data.value.parameters) {
      if (
        isDefined(data.value.parameters[paramKey]) &&
        matchesSegment(paramKey, paramMatcher)
      ) {
        hasMatchingParam = true
        break
      }
    }
    if (!hasMatchingParam) {
      return false
    }
    return matchComponentWorkflowNode({
      data,
      compMatcher,
      workflowMatcher: wfMatcher,
      includeInternal: true,
    })
  }

  return false
}

function matchSlotReference(data: NodeType, token: ReferenceToken): boolean {
  if (data.nodeType !== 'component-node' || !isDefined(data.value)) {
    return false
  }
  const { segments } = token
  const pkgMatcher = segments.length === 3 ? segments[0] : undefined
  const compMatcher =
    segments.length === 3
      ? segments[1]
      : segments.length === 2
        ? segments[0]
        : undefined
  const slotMatcher = segments[segments.length - 1]
  const node = data.value
  const currentCompName = String(data.path[1] ?? '')
  const nodeId = String(data.path[3] ?? '')

  // 1. Slot node definition inside target component
  if (
    pkgMatcher === undefined &&
    node.type === 'slot' &&
    (compMatcher === undefined ||
      matchesSegment(currentCompName, compMatcher)) &&
    matchesSegment(node.name ?? 'default', slotMatcher)
  ) {
    return true
  }

  // 2. Child node passed into an instance of the target component
  if (!matchesSegment(node.slot ?? 'default', slotMatcher)) {
    return false
  }

  const slottedChildIds = data.memo(
    `ref-slot-children/${currentCompName}/${matcherMemoKey(pkgMatcher)}/${matcherMemoKey(compMatcher)}`,
    () => {
      const childIds = new Set<string>()
      const currentComp = data.files.components[currentCompName]
      for (const k in currentComp?.nodes) {
        const candidateParent = currentComp.nodes[k]
        if (
          candidateParent?.type === 'component' &&
          (compMatcher === undefined ||
            matchesSegment(candidateParent.name, compMatcher)) &&
          (pkgMatcher === undefined
            ? !candidateParent.package
            : matchesSegment(candidateParent.package, pkgMatcher))
        ) {
          for (const cId of candidateParent.children ?? []) {
            childIds.add(cId)
          }
        }
      }
      return childIds
    },
  )

  return slottedChildIds.has(nodeId)
}

function matchesCssVarName(
  actualVar: string,
  matcher: SegmentMatcher,
): boolean {
  if (matchesSegment(actualVar, matcher)) {
    return true
  }
  if (actualVar.startsWith('--') && !matcher.value.startsWith('--')) {
    return matchesSegment(actualVar.slice(2), matcher)
  }
  return false
}

function hasCssVarRef(styleValue: string, matcher: SegmentMatcher): boolean {
  if (!styleValue.includes('var(')) {
    return false
  }
  for (const match of styleValue.matchAll(CSS_VAR_REGEX)) {
    if (matchesCssVarName(match[1], matcher)) {
      return true
    }
  }
  return false
}

function matchCssReference(data: NodeType, token: ReferenceToken): boolean {
  const matcher = token.segments[0]

  if (data.nodeType === 'style-declaration') {
    return (
      typeof data.value.styleValue === 'string' &&
      hasCssVarRef(data.value.styleValue, matcher)
    )
  }

  if (data.nodeType === 'custom-property') {
    return matchesCssVarName(data.value.key, matcher)
  }

  if (data.nodeType === 'project-theme-property') {
    const propDef = data.value.value
    if (
      typeof propDef.initialValue === 'string' &&
      hasCssVarRef(propDef.initialValue, matcher)
    ) {
      return true
    }
    for (const k in propDef.values) {
      const val = propDef.values[k]
      if (typeof val === 'string' && hasCssVarRef(val, matcher)) {
        return true
      }
    }
  }

  return false
}

function matchPackageReference(data: NodeType, token: ReferenceToken): boolean {
  const pkgMatcher = token.segments[0]

  switch (data.nodeType) {
    case 'component-node':
      return (
        data.value?.type === 'component' &&
        matchesSegment(data.value.package, pkgMatcher)
      )
    case 'component-context':
      return matchesSegment(data.value.package, pkgMatcher)
    case 'formula':
      return (
        data.value.type === 'function' &&
        matchesSegment(data.value.package, pkgMatcher)
      )
    case 'action-model':
      return (
        (data.value.type === 'Custom' || data.value.type === undefined) &&
        matchesSegment(data.value.package, pkgMatcher)
      )
    default:
      return false
  }
}

export function matchReferenceToken(
  data: NodeType,
  token: ReferenceToken,
): boolean {
  switch (token.targetKind) {
    case 'component':
      return matchComponentReference(data, token)
    case 'formula':
      return matchFormulaReference(data, token)
    case 'workflow':
      return matchWorkflowReference(data, token)
    case 'context':
      return matchContextReference(data, token)
    case 'action':
      return matchActionReference(data, token)
    case 'variable':
      return matchVariableReference(data, token)
    case 'attribute':
      return matchAttributeReference(data, token)
    case 'event':
      return matchEventReference(data, token)
    case 'api':
      return matchApiReference(data, token)
    case 'api-service':
      return matchApiServiceReference(data, token)
    case 'url-param':
      return matchUrlParamReference(data, token)
    case 'workflow-param':
      return matchWorkflowParamReference(data, token)
    case 'slot':
      return matchSlotReference(data, token)
    case 'css':
      return matchCssReference(data, token)
    case 'package':
      return matchPackageReference(data, token)
  }
}

function componentHasMatchingContext(
  comp: Component,
  compMatcher: SegmentMatcher,
  pkgMatcher?: SegmentMatcher,
): boolean {
  if (!comp.contexts) {
    return false
  }
  for (const ctxKey in comp.contexts) {
    const ctx = comp.contexts[ctxKey]
    if (!ctx) {
      continue
    }
    const providerName = ctx.componentName ?? ctxKey
    const packageName = ctx.package ?? undefined
    if (pkgMatcher) {
      if (!matchesSegment(packageName, pkgMatcher)) {
        continue
      }
    } else if (isDefined(packageName)) {
      continue
    }
    if (matchesSegment(providerName, compMatcher)) {
      return true
    }
  }
  return false
}

export function shouldReferenceTraverseComponentChild(
  parent: NodeType,
  childNodeType: NodeType['nodeType'],
  token: ReferenceToken,
): boolean {
  if (parent.nodeType !== 'component') {
    return true
  }
  const compName = String(parent.path[1] ?? '')
  const comp = parent.value
  const { segments } = token

  switch (token.targetKind) {
    case 'variable':
    case 'api':
    case 'url-param':
      if (segments.length >= 2) {
        return matchesSegment(compName, segments[0])
      }
      return true

    case 'attribute':
      if (childNodeType === 'formula') {
        if (segments.length === 3) {
          return false
        }
        if (segments.length === 2) {
          return matchesSegment(compName, segments[0])
        }
      }
      return true

    case 'event':
      if (childNodeType === 'action-model') {
        if (segments.length === 3) {
          return false
        }
        if (segments.length === 2) {
          return matchesSegment(compName, segments[0])
        }
      }
      return true

    case 'formula':
      if (childNodeType === 'formula') {
        if (segments.length === 2) {
          const firstMatcher = segments[0]
          const matchesAnyPackage = Object.keys(
            parent.files.packages ?? {},
          ).some((p) => matchesSegment(p, firstMatcher))
          if (!matchesAnyPackage) {
            return (
              matchesSegment(compName, firstMatcher) ||
              componentHasMatchingContext(comp, firstMatcher)
            )
          }
        }
        if (segments.length === 3) {
          return componentHasMatchingContext(comp, segments[1], segments[0])
        }
      }
      return true

    case 'workflow':
      if (childNodeType === 'action-model') {
        if (segments.length === 2) {
          return (
            matchesSegment(compName, segments[0]) ||
            componentHasMatchingContext(comp, segments[0])
          )
        }
        if (segments.length === 3) {
          return componentHasMatchingContext(comp, segments[1], segments[0])
        }
      }
      return true

    case 'context':
      if (childNodeType === 'formula' || childNodeType === 'action-model') {
        if (segments.length === 1 || segments.length === 2) {
          return componentHasMatchingContext(comp, segments[0])
        }
        if (segments.length === 3) {
          return componentHasMatchingContext(comp, segments[1], segments[0])
        }
      }
      return true

    case 'workflow-param':
      if (segments.length >= 3) {
        if (childNodeType === 'formula') {
          return matchesSegment(compName, segments[0])
        }
        if (childNodeType === 'action-model') {
          return (
            matchesSegment(compName, segments[0]) ||
            componentHasMatchingContext(comp, segments[0])
          )
        }
      }
      return true

    default:
      return true
  }
}
