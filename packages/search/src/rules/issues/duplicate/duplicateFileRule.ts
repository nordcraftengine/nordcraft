import type {
  ComponentNode,
  IssueRule,
  ProjectActionNode,
  ProjectFormulaNode,
} from '../../../types'

type DuplicateEntry = { name: string; type: 'component' | 'formula' | 'action' }

const METADATA_KEY = '@nordcraft/metadata'

// TODO: Make autofix for automatically remove current file and move any reference to the existing duplicate.

// TODO: Make autofix for automatically remove current file and move any reference to the existing duplicate.
const normalizeForComparison = (
  value: unknown,
  isTopLevel = false,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((v) => normalizeForComparison(v, false))
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => {
        if (key === METADATA_KEY) {
          return false
        }
        // Top-level `name` is the file key and should not affect equality.
        // Nested `name`s (e.g. argument names) are significant and kept.
        if (isTopLevel && key === 'name') {
          return false
        }
        return true
      })
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, v]) => [key, normalizeForComparison(v, false)] as const)
    return Object.fromEntries(entries)
  }
  if (typeof value === 'function') {
    return `__function__:${(value as Function).toString()}`
  }
  return value
}

const hashValue = (value: unknown): string | null => {
  try {
    return JSON.stringify(normalizeForComparison(value, true)) ?? 'undefined'
  } catch {
    // Unserializable values (e.g. circular) can never match - treat as unique
    return null
  }
}

export const duplicateFileRule: IssueRule<
  {
    name: string
    type: DuplicateEntry['type']
    duplicates: DuplicateEntry[]
  },
  ComponentNode | ProjectFormulaNode | ProjectActionNode
> = {
  code: 'duplicate-file',
  level: 'warning',
  category: 'Quality',
  nodeTypes: ['component', 'project-formula', 'project-action'],
  visit: (report, { nodeType, value, files, memo, path }) => {
    if (
      nodeType !== 'component' &&
      nodeType !== 'project-formula' &&
      nodeType !== 'project-action'
    ) {
      return
    }
    let current: DuplicateEntry | null = null
    if (nodeType === 'component') {
      const name = (value as { name?: string }).name ?? String(path[1] ?? '')
      current = { name, type: 'component' }
    } else if (nodeType === 'project-formula') {
      const name = String(path[1] ?? '')
      current = { name, type: 'formula' }
    } else {
      const name = String(path[1] ?? '')
      current = { name, type: 'action' }
    }

    // The file hashes are computed once per search and reused for every
    // visit. Previously the current file was re-hashed (full deep normalize
    // + JSON.stringify) on each visit even though its hash was already known
    // from building the index below - by far the hottest cost in profiling.
    const { hashToEntries, hashByKey } = memo('duplicateFiles', () => {
      const hashToEntries = new Map<string, DuplicateEntry[]>()
      const hashByKey = new Map<string, string>()
      const push = (hash: string | null, entry: DuplicateEntry) => {
        // Unhashable files can never match anything - skip them
        if (hash === null) {
          return
        }
        const existing = hashToEntries.get(hash)
        if (existing) {
          existing.push(entry)
        } else {
          hashToEntries.set(hash, [entry])
        }
        hashByKey.set(`${entry.type}:${entry.name}`, hash)
      }
      for (const [name, component] of Object.entries(files.components ?? {})) {
        if (component) {
          push(hashValue(component), { name, type: 'component' })
        }
      }
      for (const [name, formula] of Object.entries(files.formulas ?? {})) {
        if (formula) {
          push(hashValue(formula), { name, type: 'formula' })
        }
      }
      for (const [name, action] of Object.entries(files.actions ?? {})) {
        if (action) {
          push(hashValue(action), { name, type: 'action' })
        }
      }
      return { hashToEntries, hashByKey }
    }) as {
      hashToEntries: Map<string, DuplicateEntry[]>
      hashByKey: Map<string, string>
    }

    const currentHash =
      hashByKey.get(`${current.type}:${String(path[1] ?? current.name)}`) ??
      // Fallback for files not present under their visited path (e.g. the
      // component was renamed): hash on demand as before.
      hashValue(value)
    const match = (currentHash !== null && hashToEntries.get(currentHash)) || []
    if (match.length <= 1) {
      return
    }
    const duplicates = match.filter(
      (m) => m.name !== current!.name || m.type !== current!.type,
    )
    if (duplicates.length === 0) {
      return
    }
    report({
      path,
      info: {
        title: 'Duplicate file',
        description: `This **${current.type}** is a duplicate of ${duplicates
          .map((d) => `**${d.name}** (${d.type})`)
          .join(', ')}. Consider removing one of them.`,
      },
      details: {
        name: current.name,
        type: current.type,
        duplicates,
      },
    })
  },
}
