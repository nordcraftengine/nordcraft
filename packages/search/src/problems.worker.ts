import { create } from 'jsondiffpatch'
import { findProblems } from './findProblems'
import { fixProblems } from './fixProblems'
import type {
  CancelFixArgs,
  FindProblemsArgs,
  FindProblemsResponse,
  FixProblemsArgs,
  FixProblemsResponse,
} from './types'

type Message = FindProblemsArgs | FixProblemsArgs | CancelFixArgs

type Response = FindProblemsResponse | FixProblemsResponse

/**
 * The active fix, if any. A cancel message flips `cancelled`, which
 * the async fix loop checks between fixes.
 */
let currentFixTask: { id: string; cancelled: boolean } | undefined = undefined

const respond = (data: Response) => postMessage(data)

/**
 * This function is a web worker that checks for problems in the files.
 *
 * Fix protocol: post `FixProblemsArgs` to start a fix (progress messages
 * stream back, ending with a `complete` message carrying the patch). Post
 * `{ type: 'cancel-fix', id }` with the fix request id to stop it midway -
 * the final message then has `cancelled: true` and a partial patch of the
 * fixes applied so far. Only apply the patch when the message has
 * `complete: true` (or `'patch' in msg`); the rest are counter updates
 * (`Fixing ${fixed}/${total}` plus `path`/`nextPath` for what is being
 * worked on).
 */
onmessage = (event: MessageEvent<Message>) => {
  const data = event.data
  // Only cancel-fix has `type` defined for now
  if ('type' in data) {
    if (currentFixTask?.id === data.id) {
      currentFixTask.cancelled = true
    }
    return
  }
  if ('fixRule' in data) {
    if (currentFixTask) {
      // Requesting a new fix will cancel the currently active one and
      // immediately start the new request in the same thread.
      currentFixTask.cancelled = true
    }
    const task = { id: data.id, cancelled: false }
    currentFixTask = task
    fixProblems(data, respond, () => task.cancelled)
      .catch((error) => {
        const jsonDiffPatch = create({ omitRemovedValues: true })
        respond({
          id: data.id,
          patch: jsonDiffPatch.diff(data.files, data.files),
          fixRule: data.fixRule,
          fixType: data.fixType,
          fixed: 0,
          total: 0,
          complete: true,
          cancelled: true,
          cancelReason: `Fix failed: ${error instanceof Error ? error.message : String(error)}`,
        })
      })
      .finally(() => {
        if (currentFixTask === task) {
          currentFixTask = undefined
        }
      })
    return
  }
  findProblems(data, respond)
}
