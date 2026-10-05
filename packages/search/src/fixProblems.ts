import { create } from 'jsondiffpatch'
import { fixProjectSteps } from './fixProject'
import { ISSUE_RULES } from './rules/issues/issueRules.index'
import type { FixProblemsArgs, FixProblemsResponse } from './types'

/**
 * The loop yields to the event loop (same 10ms budget as `findSearch`) so a
 * `CancelFixArgs` message can be processed midway.
 */
export const fixProblems = async (
  data: FixProblemsArgs,
  reportResults: (results: FixProblemsResponse) => void,
  shouldCancel: () => boolean = () => false,
): Promise<void> => {
  const { files, options = {}, fixRule } = data
  const rule = ISSUE_RULES.find((r) => r.code === fixRule)
  if (!rule) {
    throw new Error(`Unknown fix rule: ${data.fixRule}`)
  }

  const steps = fixProjectSteps({
    files,
    rule,
    fixType: data.fixType,
    pathsToVisit: options.pathsToVisit,
    useExactPaths: options.useExactPaths,
    state: options.state,
    shouldCancel,
  })
  let lastYield = performance.now()
  let next = steps.next()
  while (!next.done) {
    const step = next.value
    reportResults({
      id: data.id,
      fixRule: data.fixRule,
      fixType: data.fixType,
      fixed: step.fixed,
      total: step.total,
      path: step.path,
      nextPath: step.nextPath,
    })
    // Yield so a cancel message can be processed mid-run
    if (performance.now() - lastYield > 10) {
      await new Promise((resolve) => setTimeout(resolve))
      lastYield = performance.now()
    }
    next = steps.next()
  }
  const { files: updatedFiles, fixed, total, cancelled } = next.value
  // Calculate diff
  const jsonDiffPatch = create({ omitRemovedValues: true })
  const diff = jsonDiffPatch.diff(files, updatedFiles)
  // Send diff + metadata to main thread
  reportResults({
    id: data.id,
    patch: diff,
    fixRule: data.fixRule,
    fixType: data.fixType,
    fixed,
    total,
    complete: true,
    ...(cancelled
      ? {
          cancelled: true as const,
          cancelReason: `Fix ${data.id} cancelled after ${fixed}/${total} fixes`,
        }
      : {}),
  })
}
