import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { fixProject } from './fixProject'
import { ISSUE_RULES } from './rules/issues/issueRules.index'
import type { FixProblemsArgs, FixProblemsResponse } from './types'
import { diffProjectFiles } from './util/projectFiles'

export const fixProblems = (
  data: FixProblemsArgs & { files: ProjectFiles },
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
  const diff = diffProjectFiles(files, updatedFiles)
  // Send diff + metadata to main thread
  reportResults({
    id: data.id,
    patch: diff,
    fixRule: data.fixRule,
    fixType: data.fixType,
  })
}
