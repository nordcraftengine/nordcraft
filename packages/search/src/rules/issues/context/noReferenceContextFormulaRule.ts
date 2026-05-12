import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { ComponentContext, IssueRule, NodeType } from '../../../types'
import { removeContextFormulaSubscription } from './noReferenceContextFormulaRule.fix'

/**
 * Rule for checking if a component's context formula is used anywhere in the component.
 */
export const noReferenceContextFormulaRule: IssueRule<
  {
    providerName: string
    formulaName: string
  },
  ComponentContext
> = {
  code: 'no-reference context formula',
  level: 'warning',
  category: 'No References',
  visit: (report, { path, files, value, nodeType, memo }) => {
    if ((nodeType as NodeType['nodeType']) !== 'component-context') {
      return
    }

    if (Object.keys(value.formulas).length === 0) {
      return
    }

    const [_fileType, componentName, _contexts, contextComponentName] =
      path as string[]
    const componentFile = files.components[componentName]
    if (!componentFile) {
      return
    }

    const usedContextFormulas = memo(
      `${componentName}-used-context-formulas`,
      () => {
        const component = new ToddleComponent<string>({
          component: componentFile,
          packageName: undefined,
          getComponent: (name) => files.components[name],
          globalFormulas: {
            formulas: files.formulas,
            packages: files.packages,
          },
        })

        const used = new Set<string>()
        for (const { formula } of component.formulasInComponent()) {
          if (
            formula.type === 'path' &&
            formula.path[0] === 'Contexts' &&
            typeof formula.path[1] === 'string' &&
            typeof formula.path[2] === 'string'
          ) {
            // Store as "providerName/formulaName"
            used.add(`${formula.path[1]}/${formula.path[2]}`)
          }
        }
        return used
      },
    )

    value.formulas.forEach((formulaName) => {
      if (!usedContextFormulas.has(`${contextComponentName}/${formulaName}`)) {
        const formulaDisplayName =
          files.components[contextComponentName]?.formulas?.[formulaName]
            ?.name ?? formulaName
        report({
          path,
          info: {
            title: 'Unused context formula',
            description: `Context formula **${formulaDisplayName}** from **${contextComponentName}** is not used in this component.`,
          },
          details: {
            providerName: contextComponentName,
            formulaName,
          },
          fixes: ['remove-context-formula-subscription'],
        })
      }
    })
  },
  fixes: {
    'remove-context-formula-subscription': removeContextFormulaSubscription,
  },
}

export type NoReferenceContextFormulaRuleFix =
  'remove-context-formula-subscription'
