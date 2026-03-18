import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { createFieldSearchRule } from './rules/search/fieldSearchRule'
import { searchProject } from './searchProject'
import type {
  SearchArgs,
  SearchResponse,
  SearchResult,
  SearchRule,
} from './types'

export interface SearchTask {
  id: string
  cancelled: boolean
}

let currentTask: SearchTask | undefined = undefined
let files: ProjectFiles | undefined = undefined

export async function findSearch(
  data: SearchArgs,
  reportResults: (results: SearchResponse) => void,
) {
  const { files: _files, id, query, options = {} } = data

  if (currentTask) {
    currentTask.cancelled = true
  }

  const task: SearchTask = { id, cancelled: false }
  currentTask = task

  files = _files ?? files
  if (!files) {
    reportResults({
      id,
      results: [],
      complete: true,
      cancelled: true,
      cancelReason: 'No files provided for search',
    })
    return
  }

  const rules: SearchRule[] = []
  rules.push(
    createFieldSearchRule({
      query,
      withDetails: options.withDetails ?? true,
      skippedFields:
        (query.startsWith('<') && query.includes('>')) ||
        (query.startsWith('"') && query.endsWith('"'))
          ? {}
          : {
              // Random generated ids are disabled for non-programmatic or exact matching
              'component-node': ['children'],
            },
    }),
  )

  let batch: SearchResult[] = []
  let fileType: string | number | undefined
  let fileName: string | number | undefined
  let lastYield = performance.now()

  for (const result of searchProject({
    ...options,
    files,
    rules,
    pathsToVisit: options.pathsToVisit ?? [],
    useExactPaths: options.useExactPaths ?? false,
    withDetails: options.withDetails ?? true,
  })) {
    if (task.cancelled) {
      return
    }

    // Every 10ms we yield to the event loop to allow new messages to be processed
    if (performance.now() - lastYield > 10) {
      await new Promise((resolve) => setTimeout(resolve as any))
      lastYield = performance.now()
      if (task.cancelled) {
        // eslint-disable-next-line no-console
        console.warn(
          `Search with id ${id} cancelled after yielding to event loop`,
        )
        return
      }
    }

    switch (options.batchSize) {
      case 'all': {
        batch.push(result)
        break
      }
      case 'per-file': {
        if (fileType !== result.path[0] || fileName !== result.path[1]) {
          if (batch.length > 0) {
            reportResults({
              id,
              results: batch,
            })
          }
          batch = []
          fileType = result.path[0]
          fileName = result.path[1]
        }

        batch.push(result)
        break
      }

      default: {
        batch.push(result)
        if (batch.length >= (options.batchSize ?? 1)) {
          reportResults({
            id,
            results: batch,
          })
          batch = []
        }
        break
      }
    }
  }

  // Send the remaining results and mark the search as complete
  if (!task.cancelled) {
    reportResults({
      id,
      results: batch,
      complete: true,
    })
  }
}
