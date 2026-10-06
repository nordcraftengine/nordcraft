import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { AllRuleTypes } from './rules/issues/issueRules.index'
import { searchProject } from './searchProject'
import type { ApplicationState, FixType, IssueResult } from './types'

/**
 * Uses searchProject to apply 1 fix at a time. Finally ends up with the resulting
 * ProjectFiles that are returned.
 * @returns ProjectFiles - updated files after fixes have been applied (if any)
 */
export const fixProject = ({
  files,
  rule,
  fixType,
  pathsToVisit = [],
  useExactPaths = false,
  state,
}: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rule: AllRuleTypes
  fixType: FixType
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
}) => {
  let updatedFiles = files
  // Apply 1 fix per iteration until no more fixes can be applied.
  // After every fix, the updated files are used for the next iteration.
  // There is intentionally no cap on the number of fixes: every iteration
  // either applies a fix or terminates the loop, so all issues get fixed
  // no matter how many there are.
  while (true) {
    const { value: suggestedFiles } = searchProject({
      files: updatedFiles,
      rules: [rule],
      fixOptions: { mode: 'FIX', fixType },
      pathsToVisit,
      useExactPaths,
      state,
    }).next()
    if (suggestedFiles) {
      updatedFiles = suggestedFiles
    } else {
      // No more fixes could be applied
      break
    }
  }
  return updatedFiles
}

/**
 * A single unit of fix progress: the initial total of a run, or one applied
 * fix. `path` is the issue just fixed (undefined on the initial 0/N event),
 * `nextPath` the next queued fix (undefined when unknown - single-fix mode
 * only knows the issue it just fixed, not what comes next).
 */
export interface FixProgressStep {
  fixed: number
  total: number
  path?: (string | number)[]
  nextPath?: (string | number)[]
}

export interface FixProjectResult {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  fixed: number
  total: number
  /** True when `shouldCancel` stopped the run; `files` holds partial fixes. */
  cancelled: boolean
}

type FixProjectFiles = Omit<ProjectFiles, 'config'> &
  Partial<Pick<ProjectFiles, 'config'>>

/**
 * Counts fixable issues up front so progress consumers can show
 * e.g. "Fixing 0/25 issues" right away. Costs one extra traversal.
 */
const countFixableIssues = ({
  files,
  rule,
  fixType,
  pathsToVisit = [],
  useExactPaths = false,
  state,
}: {
  files: FixProjectFiles
  rule: AllRuleTypes
  fixType: FixType
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
}): number => {
  if (!rule.fixes?.[fixType as keyof typeof rule.fixes]) {
    return 0
  }
  let count = 0
  const results = searchProject({
    files,
    rules: [rule],
    pathsToVisit,
    useExactPaths,
    state,
  }) as Generator<IssueResult>
  for (const result of results) {
    if (result.fixes?.includes(fixType)) {
      count += 1
    }
  }
  return count
}

/**
 * Suspendable core of {@link fixProject}: yields a {@link FixProgressStep}
 * for the initial total and after every applied fix, and returns the updated
 * files plus counters.
 *
 * Applies 1 fix at a time like {@link fixProject} (no batching): after every
 * fix, the updated files are used for the next iteration, so cascading fixes
 * are picked up naturally. `shouldCancel` is checked at every fix boundary
 * so async drivers can stop the run midway and keep the partial result.
 */
export function* fixProjectSteps({
  files,
  rule,
  fixType,
  pathsToVisit = [],
  useExactPaths = false,
  state,
  shouldCancel,
}: {
  files: FixProjectFiles
  rule: AllRuleTypes
  fixType: FixType
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
  shouldCancel?: () => boolean
}): Generator<FixProgressStep, FixProjectResult> {
  let updatedFiles = files
  let fixed = 0
  let cancelled = false
  let total = countFixableIssues({
    files,
    rule,
    fixType,
    pathsToVisit,
    useExactPaths,
    state,
  })
  if (total > 0) {
    // Report the total (fixed/total) before applying anything, so consumers
    // can show e.g. "Fixing 0/25 issues" right away
    yield { fixed, total }
  }
  // Apply 1 fix per iteration until no more fixes can be applied (or
  // cancelled). After every fix, the updated files are used for the next
  // iteration. There is intentionally no cap on the number of fixes: every
  // iteration either applies a fix, observes cancellation, or terminates
  // the loop, so all issues get fixed no matter how many there are.
  while (true) {
    if (shouldCancel?.()) {
      cancelled = true
      break
    }
    const { value: suggestedFiles } = searchProject({
      files: updatedFiles,
      rules: [rule],
      fixOptions: { mode: 'FIX', fixType },
      pathsToVisit,
      useExactPaths,
      state,
    }).next()
    if (!suggestedFiles) {
      // No more fixes could be applied
      break
    }
    updatedFiles = suggestedFiles
    fixed += 1
    if (fixed > total) {
      // A fix revealed new (cascading) issues - keep the counter sane
      total = fixed
    }
    yield { fixed, total }
  }
  return { files: updatedFiles, fixed, total, cancelled }
}
