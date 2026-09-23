/* eslint-disable no-console */
/**
 * This function is a web worker that checks for problems in the files.
 */
import { findSearch } from './findSearch'
import type { SearchArgs } from './types'

onmessage = (event: MessageEvent<SearchArgs>) => {
  console.time('search:' + event.data.id)
  findSearch(event.data, (results) => postMessage(results))
    .then(() => {
      console.timeEnd('search:' + event.data.id)
    })
    .catch((error) => {
      postMessage({
        id: event.data.id,
        complete: true,
        cancelled: true,
        cancelReason: `Search failed with error: ${error instanceof Error ? error.message : String(error)}`,
      })
    })
}
