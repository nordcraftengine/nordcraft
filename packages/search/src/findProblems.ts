import { ISSUE_RULES } from './rules/issues/issueRules.index'
import { searchProject } from './searchProject'
import type { FindProblemsArgs, FindProblemsResponse, Result } from './types'

export const findProblems = (
  data: FindProblemsArgs,
  reportResults: (results: FindProblemsResponse) => void,
) => {
  const { files, options = {} } = data
  const idRespond = (results: Result[]) =>
    reportResults({
      id: data.id,
      results,
    })
  const rules = ISSUE_RULES.filter(
    (rule) =>
      (!options.categories || options.categories.includes(rule.category)) &&
      (!options.levels || options.levels.includes(rule.level)) &&
      !options.rulesToExclude?.includes(rule.code),
  )

  let batch: Result[] = []
  let fileType: string | number | undefined
  let fileName: string | number | undefined
  for (const problem of searchProject({
    files,
    rules,
    pathsToVisit: options.pathsToVisit,
    useExactPaths: options.useExactPaths,
    state: options.state,
  })) {
    switch (options.batchSize) {
      case 'all': {
        batch.push(problem)
        break
      }
      case 'per-file': {
        if (fileType !== problem.path[0] || fileName !== problem.path[1]) {
          if (batch.length > 0) {
            idRespond(batch)
          }
          batch = []
          fileType = problem.path[0]
          fileName = problem.path[1]
        }

        batch.push(problem)
        break
      }

      default: {
        batch.push(problem)
        if (batch.length >= (options.batchSize ?? 1)) {
          idRespond(batch)
          batch = []
        }
        break
      }
    }
  }

  // Send the remaining results
  idRespond(batch)
}
