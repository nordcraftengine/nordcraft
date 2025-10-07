import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { Delta } from 'jsondiffpatch'
import { create } from 'jsondiffpatch'
import { fixProject } from './fixProject'
import { ISSUE_RULES } from './rules/issues/issueRules.index'
import { searchProject } from './searchProject'
import type {
  ApplicationState,
  Category,
  Code,
  FixType,
  Level,
  Result,
} from './types'

export type Options = {
  /**
   * Useful for running search on a subset or a single file.
   */
  pathsToVisit?: string[][]
  /**
   * Whether to match the paths exactly (including length) or just the beginning.
   */
  useExactPaths?: boolean
  /**
   * Search only rules with these specific categories. If empty, all categories are shown.
   */
  categories?: Category[]
  /**
   * Search only rules with the specific levels. If empty, all levels are shown.
   */
  levels?: Level[]
  /**
   * The number of reports to send per message.
   * @default 1
   */
  batchSize?: number | 'all' | 'per-file'
  /**
   * Dynamic data that is used by some rules.
   */
  state?: ApplicationState
  /**
   * Do not run rules with these codes. Useful for feature flagged rules
   */
  rulesToExclude?: Code[]
}

interface FindProblemsArgs {
  id: string
  files: ProjectFiles
  options?: Options
}

interface FixProblemsArgs {
  id: string
  files: ProjectFiles
  options?: Options
  fixRule: Code
  fixType: FixType
}

type Message = FindProblemsArgs | FixProblemsArgs

interface FindProblemsResponse {
  id: string
  results: Result[]
}

interface FixProblemsResponse {
  id: string
  patch: Delta
  fixRule: Code
  fixType: FixType
}

type Response = FindProblemsResponse | FixProblemsResponse

const respond = (data: Response) => postMessage(data)

const findProblems = (data: FindProblemsArgs) => {
  const { files, options = {} } = data
  const idRespond = (results: Result[]) =>
    respond({
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

const fixProblems = (data: FixProblemsArgs) => {
  const { files, options = {}, fixRule } = data
  const rule = ISSUE_RULES.find((r) => r.code === fixRule)
  if (!rule) {
    throw new Error(`Unknown fix rule: ${data.fixRule}`)
  }

  const updatedFiles = fixProject({
    files,
    rule,
    fixType: data.fixType,
    pathsToVisit: options.pathsToVisit,
    useExactPaths: options.useExactPaths,
    state: options.state,
  })
  // Calculate diff
  const jsonDiffPatch = create({ omitRemovedValues: true })
  const diff = jsonDiffPatch.diff(files, updatedFiles)
  // Send diff + metadata to main thread
  respond({
    id: data.id,
    patch: diff,
    fixRule: data.fixRule,
    fixType: data.fixType,
  })
}

/**
 * This function is a web worker that checks for problems in the files.
 */
onmessage = (event: MessageEvent<Message>) => {
  if ('fixRule' in event.data) {
    fixProblems(event.data)
  } else {
    findProblems(event.data)
  }
}
