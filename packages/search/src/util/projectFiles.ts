import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { Delta } from 'jsondiffpatch'
import { create } from 'jsondiffpatch'
import type { ProjectFilesUpdate } from '../types'

/**
 * Removed values are omitted from the diffs, as they are only needed to revert
 * a diff - not to apply it.
 */
const jsonDiffPatch = create({ omitRemovedValues: true })

/**
 * Find the changes between two versions of the project files.
 *
 * @returns A `jsondiffpatch` delta describing the changes.
 */
export const diffProjectFiles = (
  prevFiles: ProjectFiles,
  nextFiles: ProjectFiles,
) => jsonDiffPatch.diff(prevFiles, nextFiles)

/**
 * Apply changes to the project files.
 *
 * @param files The files to apply the changes to. These are modified in place.
 * @param patch The changes to apply, created by `diffProjectFiles`.
 */
export const patchProjectFiles = (files: ProjectFiles, patch: Delta) =>
  jsonDiffPatch.patch(files, patch) as ProjectFiles

/**
 * Resolve the project files described by a message sent to a worker.
 *
 * The full files only have to be sent once per worker, as all following
 * messages can contain a `patch` with the changes to the files the worker
 * already received.
 *
 * @param update The files and/or changes included in the message.
 * @param currentFiles The files the worker received last.
 * @returns The updated files or `undefined` if the message contained changes to files the worker never received.
 */
export const updateProjectFiles = (
  update: ProjectFilesUpdate,
  currentFiles?: ProjectFiles,
) => {
  const files = update.files ?? currentFiles
  if (!files) {
    return undefined
  }

  return update.patch ? patchProjectFiles(files, update.patch) : files
}
