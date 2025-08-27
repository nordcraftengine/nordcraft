import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { searchProject } from './searchProject'
import type { ApplicationState, FixType, Rule } from './types'

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
  rule: Rule
  fixType: FixType
  pathsToVisit?: string[][]
  useExactPaths?: boolean
  state?: ApplicationState
}) => {
  let updatedFiles = files
  let iterations = 0
  const maxIterations = 100
  // Apply 1 fix per iteration for ${maxIterations} iterations
  // After every fix, the updated files are used for the next iteration
  while (iterations < maxIterations) {
    iterations++
    const suggestedFiles = searchProject({
      files: updatedFiles,
      rules: [rule],
      options: { mode: 'FIX', fixType },
      pathsToVisit,
      useExactPaths,
      state,
    }).next()
    if (suggestedFiles.value) {
      updatedFiles = suggestedFiles.value
    } else {
      // No more fixes could be applied
      break
    }
  }
  return updatedFiles
}
