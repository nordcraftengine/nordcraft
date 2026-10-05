import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { AllRuleTypes } from './rules/issues/issueRules.index'
import { type CollectedFix, searchProject } from './searchProject'
import type { ApplicationState, FixType, MemoFn } from './types'
import { applyFixResult } from './util/applyFix'

const isPrefixPath = (
  prefix: (string | number)[],
  path: (string | number)[],
): boolean =>
  prefix.length <= path.length &&
  prefix.every((segment, index) => segment === path[index])

/**
 * @returns The updated files, or undefined when the fix makes no change.
 */
const applyCollectedFix = ({
  collected,
  files,
  fixType,
  state,
}: {
  collected: CollectedFix
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  fixType: FixType
  state?: ApplicationState
}) => {
  const { path, details, data, rule } = collected
  const fix = rule.fixes?.[fixType]
  if (!fix) {
    return undefined
  }
  const memo: MemoFn = ((key: string | string[], fn: () => any) =>
    fn()) as MemoFn
  const freshData = {
    ...data,
    files,
    // The report path, not the visit path: fixes operate on what they
    // reported, which is often a subpath of the visited node
    path,
    memo,
    component:
      'component' in data && path[0] === 'components'
        ? new ToddleComponent({
            component: (files.components as Record<string, any>)[
              path[1] as string
            ],
            packageName: undefined,
            getComponent: (name: string) =>
              (files.components as Record<string, any>)[name],
            globalFormulas: {
              formulas: files.formulas,
              packages: files.packages,
            },
          })
        : (data as Record<string, unknown>)['component'],
  }
  const fixResult = (fix as (...args: any[]) => any)({
    data: freshData,
    details,
    state,
  })
  if (!fixResult) {
    return undefined
  }
  return applyFixResult(files, fixResult)
}

/**
 * A single unit of batch-fix progress: the initial total of a pass, or one
 * applied fix. `path` is the issue just fixed (undefined on the initial
 * 0/N event), `nextPath` the next queued fix in this pass (undefined when
 * the pass has no more candidates - a later pass may still add more).
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

/**
 * Suspendable core of {@link fixProject}: yields a {@link FixProgressStep}
 * for the initial total of each pass and after every applied fix, and
 * returns the updated files plus counters.
 *
 * Each pass collects every fixable issue in a single traversal and applies
 * all fixes on disjoint paths (shallowest first, so a removed parent covers
 * its children), then re-searches for cascading fixes until a pass applies
 * nothing. `shouldCancel` is checked at every pass and fix boundary so
 * async drivers can stop the run midway and keep the partial result.
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
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rule: AllRuleTypes
  fixType: FixType
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
  shouldCancel?: () => boolean
}): Generator<FixProgressStep, FixProjectResult> {
  let updatedFiles = files
  let passes = 0
  const maxPasses = 100
  let fixed = 0
  let total = 0
  let cancelled = false
  // Each pass fixes everything it can; passes repeat only for cascading
  // fixes (a fix revealing new issues), so this loop is short in practice.
  while (passes++ < maxPasses) {
    if (shouldCancel?.()) {
      cancelled = true
      break
    }
    const collected: CollectedFix[] = []
    // Drain the traversal so every fixable issue is collected
    for (const _ of searchProject({
      files: updatedFiles,
      rules: [rule],
      fixOptions: { mode: 'COLLECT', fixType, collected },
      pathsToVisit,
      useExactPaths,
      state,
    })) {
      // No yields in COLLECT mode - exhaust generator
    }
    if (collected.length === 0) {
      // No more fixes to apply
      break
    }
    // Shallowest first: a fix closer to the root covers everything below it,
    // so descendants of an applied fix are correctly skipped as already gone.
    collected.sort((a, b) => a.path.length - b.path.length)
    total += collected.length
    // Report the new total (fixed/total) before applying this pass, so
    // consumers can show e.g. "Fixing 0/25 issues" right away
    yield { fixed, total, nextPath: collected[0]?.path }
    const appliedPaths: (string | number)[][] = []
    let applied = 0
    for (const [index, candidate] of collected.entries()) {
      if (shouldCancel?.()) {
        cancelled = true
        break
      }
      if (
        appliedPaths.some(
          (appliedPath) =>
            isPrefixPath(appliedPath, candidate.path) ||
            isPrefixPath(candidate.path, appliedPath),
        )
      ) {
        // Overlaps an applied fix - defer to the next pass on fresh files
        continue
      }
      const result = applyCollectedFix({
        collected: candidate,
        files: updatedFiles,
        fixType,
        state,
      })
      if (result) {
        updatedFiles = result
        appliedPaths.push(candidate.path)
        applied += 1
        fixed += 1
        yield {
          fixed,
          total,
          path: candidate.path,
          nextPath: collected[index + 1]?.path,
        }
      }
    }
    if (cancelled) {
      break
    }
    if (applied === 0) {
      // Fixes reported but none applicable - avoid looping forever
      break
    }
  }
  return { files: updatedFiles, fixed, total, cancelled }
}

/**
 * Uses searchProject to apply fixes in batch. Each pass collects every
 * fixable issue in a single traversal and applies all fixes on disjoint
 * paths (shallowest first, so a removed parent covers its children), then
 * re-searches for cascading fixes until a pass applies nothing.
 *
 * @returns ProjectFiles - updated files after fixes have been applied (if any)
 */
export const fixProject = ({
  files,
  rule,
  fixType,
  pathsToVisit = [],
  useExactPaths = false,
  state,
  onFixApplied,
}: {
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>
  rule: AllRuleTypes
  fixType: FixType
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
  onFixApplied?: (step: FixProgressStep) => void
}) => {
  const steps = fixProjectSteps({
    files,
    rule,
    fixType,
    pathsToVisit,
    useExactPaths,
    state,
  })
  let next = steps.next()
  while (!next.done) {
    onFixApplied?.(next.value)
    next = steps.next()
  }
  return next.value.files
}
