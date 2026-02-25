import type { Rule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'
import { projectFormulaIsReferenced } from './projectFormulaIsReferenced.memo'

export const noReferenceProjectFormulaRule: Rule<void> = {
  code: 'no-reference project formula',
  level: 'warning',
  category: 'No References',
  visit: (report, { value, path, files, nodeType, memo }) => {
    if (nodeType !== 'project-formula' || value.exported === true) {
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
