/**
 * Matches a string against a wildcard pattern (case-insensitive).
 * Standard wildcard `*` matches any character sequence.
 */
export function matchWildcard(str: string, pattern: string): boolean {
  const regexStr =
    '^' +
    pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, (ch) =>
      ch === '*' ? '.*' : '\\' + ch,
    ) +
    '$'
  const rx = new RegExp(regexStr, 'i')
  return rx.test(str)
}

export interface SplitResult {
  before: string
  matched: string
  after: string
}

/**
 * Matches a string against a wildcard pattern (case-insensitive) and splits
 * the string into before, matched, and after contexts based on wildcard positions.
 */
export function matchAndSplitWildcard(
  str: string,
  pattern: string,
): SplitResult | null {
  const trimmedPattern = pattern.trim()

  if (trimmedPattern === '') {
    if (str === '') {
      return { before: '', matched: '', after: '' }
    }
    return null
  }

  // If pattern is only wildcards (e.g. *, **, etc)
  if (/^\*+$/.test(trimmedPattern)) {
    return { before: '', matched: str, after: '' }
  }

  // Detect leading and trailing wildcards
  const hasLeading = trimmedPattern.startsWith('*')
  const hasTrailing = trimmedPattern.endsWith('*')

  // Core pattern: strip leading and trailing stars
  let core = trimmedPattern
  if (hasLeading) {
    core = core.slice(1)
  }
  if (hasTrailing) {
    core = core.slice(0, -1)
  }

  // Escape regex special characters in core, but map '*' to '.*'
  const coreRegexStr = core.replace(/[-\/\\^$*+?.()|[\]{}]/g, (ch) =>
    ch === '*' ? '.*' : '\\' + ch,
  )

  // Build the full regexp with captures
  // capture 1 (if leading): anything before the core pattern starts (non-greedy)
  // capture 2: the core pattern itself
  // capture 3 (if trailing): anything after the core pattern ends (greedy)
  const prefixPart = hasLeading ? '^(.*?)' : '^'
  const suffixPart = hasTrailing ? '(.*)$' : '$'
  const fullRegex = new RegExp(
    `${prefixPart}(${coreRegexStr})${suffixPart}`,
    'i',
  )

  const match = str.match(fullRegex)
  if (!match) {
    return null
  }

  let before = ''
  let matched = ''
  let after = ''

  if (hasLeading && hasTrailing) {
    before = match[1]
    matched = match[2]
    after = match[3]
  } else if (hasLeading) {
    before = match[1]
    matched = match[2]
  } else if (hasTrailing) {
    matched = match[1]
    after = match[2]
  } else {
    matched = match[1]
  }

  return { before, matched, after }
}
