import { create } from 'jsondiffpatch'
import { fixProject } from './fixProject'
import { ISSUE_RULES } from './rules/issues/issueRules.index'
import type { FixProblemsArgs, FixProblemsResponse } from './types'

export const fixProblems = (
  data: FixProblemsArgs,
  reportResults: (results: FixProblemsResponse) => void,
) => {
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
  reportResults({
    id: data.id,
    patch: diff,
    fixRule: data.fixRule,
    fixType: data.fixType,
  })
}
