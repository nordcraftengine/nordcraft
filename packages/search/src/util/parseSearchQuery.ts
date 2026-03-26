import type { NodeType } from '../types'

export type SearchQueryPart = {
  nodeType?: NodeType['nodeType']
  fields?: Record<string, string | RegExp> | string | RegExp
  exclude?: boolean // -key:value or -value
}

/**
 * Takes a string query and return a search query object.
 *
 * Query format examples:
 * - `Some string` - will match exactly "some string" (case insensitive) in a field
 * - `/some string/i` - same as the above
 * - `/Some string/` - same as the above, but case sensitive (any regex allowed)
 * - `Variable,my-var` - will match formula path nodes, as Arrays and objects are stringified when possible.
 *
 * Programmatic search only (WIP, may change):
 * All starts with "<" and contains one ">".
 *
 * - `<>tag:"div"` - will return fields with key "tag" and value exactly "div"
 * - `<component-node>tag:"img"` - same as above, but will only return nodes of type "component-node"
 * - `<>tag:"img" attrs.alt:"/.+/"` - has field tag equals "img" and any value in field "alt" of object "attrs" on the same element.
 * - `<formula>type:"path" path:Variable,my-var` - precisely match a formula with type "path" and path ["Variable", "my-var"] (note that arrays and objects are stringified when possible, so we can use the same syntax as the literal search for exact matches on them)
 */
export function parseSearchQuery(query: string): SearchQueryPart[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  // Check for programmatic search: <nodeType>field:"value" ...
  const closingBracketIndex = trimmed.startsWith('<')
    ? trimmed.indexOf('>')
    : -1
  if (closingBracketIndex > 0) {
    const nodeTypeStr = trimmed.slice(1, closingBracketIndex).trim()
    const fieldsPart = trimmed.slice(closingBracketIndex + 1).trim()

    const nodeType = nodeTypeStr
      ? (nodeTypeStr as NodeType['nodeType'])
      : undefined
    const fields: Record<string, string | RegExp> = {}

    // Regex to match field:"value" or field:"/regex/flags"
    // Modified to swallow quotes around /regex/
    const fieldRegex =
      /\s*([^:]+?)\s*:(?:"\/([^/]*)\/([gimuy]*)"|(?:"([^"]*)"))/gi
    let match: RegExpExecArray | null
    while ((match = fieldRegex.exec(fieldsPart)) !== null) {
      const fieldName = match[1]
      const regexPattern = match[2]
      const regexFlags = match[3]
      const quotedValue = match[4]

      if (regexPattern !== undefined) {
        try {
          fields[fieldName] = new RegExp(regexPattern, regexFlags || undefined)
        } catch {
          fields[fieldName] = `/${regexPattern}/${regexFlags}`
        }
      } else if (quotedValue !== undefined) {
        // Keep the quotes to indicate "exact match" in the rule
        fields[fieldName] = `"${quotedValue}"`
      }
    }

    return [{ nodeType, fields }]
  }

  // Regular text search
  // Regex match?
  if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
    const lastSlashIndex = trimmed.lastIndexOf('/')
    const pattern = trimmed.slice(1, lastSlashIndex)
    const flags = trimmed.slice(lastSlashIndex + 1)
    try {
      // If no flags provided, don't default to 'i' if user specifically provided /.../
      // The requirement says /Some string/ is case sensitive, /some string/i is case insensitive.
      return [{ fields: new RegExp(pattern, flags || undefined) }]
    } catch {
      // Fallback
    }
  }

  // Default: literal case-insensitive match (as a regex for simple consistency with rule)
  // The user says matches exactly "some string" (case insensitive)
  // We use the raw string here because we want to match it exactly (not as a regex)
  return [
    {
      fields: trimmed,
    },
  ]
}
