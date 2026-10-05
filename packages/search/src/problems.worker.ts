import { findProblems } from './findProblems'
import { fixProblems } from './fixProblems'
import type {
  FindProblemsArgs,
  FindProblemsResponse,
  FixProblemsArgs,
  FixProblemsResponse,
} from './types'

type Message = FindProblemsArgs | FixProblemsArgs

type Response = FindProblemsResponse | FixProblemsResponse

const respond = (data: Response) => postMessage(data)

/**
 * This function is a web worker that checks for problems in the files.
 */
onmessage = (event: MessageEvent<Message>) => {
  if ('fixRule' in event.data) {
    fixProblems(event.data, respond)
  } else {
    findProblems(event.data, respond)
  }
}
