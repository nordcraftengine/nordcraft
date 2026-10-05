import type { IssueRule, ProjectFormulaNode } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'
import { projectFormulaIsReferenced } from './projectFormulaIsReferenced.memo'

export const noReferenceProjectFormulaRule: IssueRule<
  void,
  ProjectFormulaNode
> = {
  code: 'no-reference project formula',
  level: 'warning',
  category: 'No References',
  nodeTypes: 'project-formula',
  visit: (report, { value, path, files, memo }) => {
    if (value.exported === true) {
      return
    }

    if (projectFormulaIsReferenced(files, memo)(value.name)) {
      return
    }

    report({
      path,
      info: {
        title: 'Unused global formula',
        description: `Global formula is never used by any formula. Consider removing it.`,
      },
      fixes: ['delete-project-formula'],
    })
  },
  fixes: {
    'delete-project-formula': removeFromPathFix,
  },
}

export type NoReferenceProjectFormulaRuleFix = 'delete-project-formula'
