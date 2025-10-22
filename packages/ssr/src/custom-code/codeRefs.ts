import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { Component } from '@nordcraft/core/dist/component/component.types'
import { isToddleFormula } from '@nordcraft/core/dist/formula/formula'
import type {
  CodeFormula,
  PluginFormula,
} from '@nordcraft/core/dist/formula/formulaTypes'
import type { PluginAction } from '@nordcraft/core/dist/types'
import { filterObject, mapObject } from '@nordcraft/core/dist/utils/collections'
import { safeFunctionName } from '@nordcraft/core/dist/utils/handlerUtils'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ProjectFiles, ToddleProject } from '../ssr.types'

export function takeReferencedFormulasAndActions({
  component,
  files,
}: {
  component: Component | undefined
  files: ProjectFiles
}): {
  __PROJECT__: {
    actions: Record<string, PluginAction & { packageName?: string }>
    formulas: Record<string, PluginFormula<string> & { packageName?: string }>
  }
  [packageName: string]: {
    actions: Record<string, PluginAction & { packageName?: string }>
    formulas: Record<string, PluginFormula<string> & { packageName?: string }>
  }
} {
  // If no entry file is specified or found, return all actions and formulas
  if (!isDefined(component)) {
    return {
      __PROJECT__: {
        actions: {
          ...(files.actions ?? {}),
        },
        formulas: {
          ...(files.formulas ?? {}),
        },
      },
      ...mapObject(files.packages ?? {}, ([packageName, p]) => [
        packageName,
        {
          actions: p?.actions ?? {},
          formulas: p?.formulas ?? {},
        },
      ]),
    }
  }

  // Return only the actions and formulas that are referenced by the entry file
  const actionRefs = new Set<string>()
  const formulaRefs = new Set<string>()
  const toddleComponent = new ToddleComponent({
    component: component,
    getComponent: (name, packageName) => {
      const nodeLookupKey = [packageName, name].filter(isDefined).join('/')
      const component = packageName
        ? files.packages?.[packageName]?.components[name]
        : files.components[name]
      if (!component) {
        // eslint-disable-next-line no-console
        console.warn(
          `Unable to find component "${nodeLookupKey}" for package "${packageName}"`,
        )
        return undefined
      }
      return component
    },
    packageName: undefined,
    globalFormulas: {
      formulas: files.formulas,
      packages: files.packages,
    },
  })
  toddleComponent.actionReferences.forEach((ref) => actionRefs.add(ref))
  toddleComponent.formulaReferences.forEach((ref) => formulaRefs.add(ref))
  toddleComponent.uniqueSubComponents.forEach((c) => {
    c.actionReferences.forEach((ref) =>
      actionRefs.add([c.packageName, ref].filter(isDefined).join('/')),
    )
    c.formulaReferences.forEach((ref) =>
      formulaRefs.add([c.packageName, ref].filter(isDefined).join('/')),
    )
  })
  return {
    ...mapObject(
      // Only include packages that have referenced actions or formulas
      filterObject(
        files.packages ?? {},
        ([packageName, p]) =>
          Object.values(p?.actions ?? {}).some((a) =>
            actionRefs.has(`${packageName}/${a.name}`),
          ) ||
          Object.values(p?.formulas ?? {}).some((f) =>
            formulaRefs.has(`${packageName}/${f.name}`),
          ),
      ),
      // Only include the actions and formulas that are referenced
      ([packageName, p]) => [
        packageName,
        {
          actions: filterObject(
            p?.actions ?? {},
            ([_, a]) =>
              typeof a.name === 'string' &&
              actionRefs.has(`${packageName}/${a.name}`),
          ),
          formulas: filterObject(
            p?.formulas ?? {},
            ([_, f]) =>
              typeof f.name === 'string' &&
              formulaRefs.has(`${packageName}/${f.name}`),
          ),
        },
      ],
    ),
    __PROJECT__: {
      actions: {
        ...Object.fromEntries(
          Object.entries(files.actions ?? {}).filter(([key]) =>
            actionRefs.has(key),
          ),
        ),
      },
      formulas: {
        ...Object.fromEntries(
          Object.entries(files.formulas ?? {}).filter(([key]) =>
            formulaRefs.has(key),
          ),
        ),
      },
    },
  }
}

export const hasCustomCode = (component: Component, files: ProjectFiles) => {
  const code = takeReferencedFormulasAndActions({ component, files })
  return Object.values(code).some(
    (c) =>
      Object.keys(c.actions).length > 0 || Object.keys(c.formulas).length > 0,
  )
}

export const generateCustomCodeFile = ({
  code,
  componentName,
  projectId,
}: {
  code: ReturnType<typeof takeReferencedFormulasAndActions>
  componentName?: string
  projectId: ToddleProject['short_id']
}) => {
  const v2ActionCode = mapObject(
    filterObject(code, ([_, c]) =>
      Object.values(c.actions).some((a) => a.version === 2),
    ),
    ([packageName, c]) => [
      // A small hack to group project actions/formulas under the project short id
      // TS doesn't let us index an object by a generic, hence this hack
      packageName === '__PROJECT__' ? projectId : packageName,
      c,
    ],
  )
  const v2FormulaCode = mapObject(
    filterObject(code, ([_, c]) =>
      Object.values(c.formulas).some(
        // Ignore legacy code formulas
        (f) => isToddleFormula(f) || f.version === 2,
      ),
    ),
    ([packageName, c]) => [
      // A small hack to group project actions/formulas under the project short id
      // TS doesn't let us index an object by a generic, hence this hack
      packageName === '__PROJECT__' ? projectId : packageName,
      c,
    ],
  )
  return `/*
 * This file is autogenerated by Nordcraft and should not be edited manually.
 *
 * ${
   typeof componentName === 'string'
     ? `Entry file: ${componentName}`
     : 'No entry file specified'
 }
 */

export const project = "${projectId}";

export const loadCustomCode = () => {
  ${
    // We assume that packages don't have legacy actions/formulas
    // Therefore we only load code from the actual project
    Object.values(code.__PROJECT__.actions)
      .filter((a) => typeof a.name === 'string' && a.version === undefined)
      .map((action) => action.handler)
      .join('\n')
  }
  ${Object.values(code.__PROJECT__.formulas)
    .filter(
      (a) =>
        !isToddleFormula(a) &&
        typeof a.name === 'string' &&
        a.version === undefined,
    )
    .map((formula) => (formula as CodeFormula<string>).handler)
    .join('\n')}
}

export const actions = {
  ${Object.entries(v2ActionCode)
    .map(
      ([packageName, { actions }]) => `"${packageName}": {
    ${Object.values(actions)
      .filter((a) => a.version === 2)
      .map(
        (a) => `"${a.name}": {
      arguments: ${JSON.stringify(a.arguments)},
      handler: (args, ctx) => {
        ${a.handler}
        return ${safeFunctionName(a.name)}(args, ctx)
      }
    }`,
      )
      .join(',\n')}
  }`,
    )
    .join(',\n')}
}

export const formulas = {
  ${Object.entries(v2FormulaCode)
    .map(
      ([packageName, { formulas }]) => `"${packageName}": {
    ${Object.values(formulas)
      .filter((f) => isToddleFormula(f) || f.version === 2)
      .map((f) =>
        isToddleFormula(f)
          ? `"${f.name}": {
      arguments: ${JSON.stringify(f.arguments)},
      formula: ${JSON.stringify(f.formula)}
    }`
          : `"${f.name}": {
      arguments: ${JSON.stringify(f.arguments)},
      handler: (args, ctx) => {
        ${f.handler}
        return ${safeFunctionName(f.name)}(args, ctx)
      }
    }`,
      )
      .join(',\n')}
  }`,
    )
    .join(',\n')}
}`
}
