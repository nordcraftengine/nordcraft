import { omit, set } from '@nordcraft/core'
import type { ProjectFiles } from '@nordcraft/ssr'
import type { FixResult } from '../types'

export const applyFixResult = (files: ProjectFiles, result: FixResult) => {
  if (!result) {
    return files
  }

  const updates = Array.isArray(result) ? result : [result]
  let current = files
  for (const update of updates) {
    if (update.delete) {
      current = omit(current, update.path)
    } else {
      current = set(current, update.path, update.value)
    }
  }
  return current
}
