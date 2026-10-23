import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { findProblems } from './findProblems'
import { fixProblems } from './fixProblems'
import type {
  FindProblemsArgs,
  FindProblemsResponse,
  FixProblemsArgs,
  FixProblemsResponse,
} from './types'
import { updateProjectFiles } from './util/projectFiles'

type Message = FindProblemsArgs | FixProblemsArgs

type Response = FindProblemsResponse | FixProblemsResponse

/**
 * The files last received by the worker.
 *
 * Messages only have to include the changes to these files, instead of all files.
 */
let files: ProjectFiles | undefined

const respond = (data: Response) => postMessage(data)

/**
 * This function is a web worker that checks for problems in the files.
 */
onmessage = (event: MessageEvent<Message>) => {
  const data = event.data
  files = updateProjectFiles(data, files)

  if ('fixRule' in data) {
    if (files) {
      fixProblems({ ...data, files }, respond)
    }
  } else if (files) {
    findProblems({ ...data, files }, respond)
  } else {
    // Messages can contain just the changes to the files, so we cannot report
    // problems before the full files have been received at least once
    respond({ id: data.id, results: [], complete: true })
  }
}
