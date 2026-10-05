import type { Component } from '@nordcraft/core/dist/component/component.types'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ComponentNode, IssueRule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'
import { removeFromPathFix } from '../../../util/removeUnused.fix'
import { componentIsReferenced } from './componentIsReferenced.memo'

export const noReferenceComponentRule: IssueRule<void, ComponentNode> = {
  code: 'no-reference component',
  level: 'warning',
  category: 'No References',
  nodeTypes: 'component',
  visit: (report, { files, value, path, memo }, state) => {
    if (
      isPage(value) ||
      (state?.projectDetails?.type === 'package' && value.exported === true) ||
      contextlessEvaluateFormula(value.customElement?.enabled).result ===
        true ||
      componentIsReferenced(files, memo)(value.name)
    ) {
      return
    }

    report({
      path,
      info: {
        title: 'Unused component',
        description:
          '**Component** is never used by any page or component. Consider removing it.',
      },
      fixes: ['delete-component'],
    })
  },
  fixes: {
    'delete-component': removeFromPathFix,
  },
}

export type NoReferenceComponentRuleFix = 'delete-component'

const isPage = (
  value: Component,
): value is Component & { route: Required<Component['route']> } =>
  isDefined(value.route)
