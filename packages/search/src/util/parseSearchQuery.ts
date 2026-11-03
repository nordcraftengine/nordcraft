export type AttributeOperator = '=' | '*=' | '^=' | '$='

export type SegmentMatchType = 'exact' | 'prefix' | 'wildcard' | 'regex'

export interface SegmentMatcher {
  value: string
  matchType: SegmentMatchType
  regex?: RegExp
}

export interface NodeAttributeMatcher {
  namespace?: 'style' | 'event' | 'slot'
  name: string
  operator?: AttributeOperator
  value?: string | RegExp
}

export interface NodeSelectorToken {
  kind: 'selector'
  exclude: boolean
  nodeKind?: 'element' | 'component' | 'slot' | 'text'
  name?: SegmentMatcher
  package?: SegmentMatcher
  id?: SegmentMatcher
  classes: SegmentMatcher[]
  attributes: NodeAttributeMatcher[]
}

export type ReferenceTargetKind =
  | 'component'
  | 'formula'
  | 'workflow'
  | 'workflow-param'
  | 'formula-arg'
  | 'context'
  | 'action'
  | 'variable'
  | 'attribute'
  | 'event'
  | 'api'
  | 'api-input'
  | 'api-service'
  | 'url-param'
  | 'slot'
  | 'css'
  | 'animation'
  | 'package'
  | 'node'

export interface ReferenceToken {
  kind: 'reference'
  exclude: boolean
  targetKind: ReferenceTargetKind
  rootScoped: boolean
  segments: SegmentMatcher[]
}

export interface ScopeToken {
  kind: 'scope'
  exclude: boolean
  segments: SegmentMatcher[]
}

export interface TypeFilterToken {
  kind: 'type'
  exclude: boolean
  value: string
}

export interface FreetextToken {
  kind: 'freetext'
  exclude: boolean
  value: string | RegExp
  exact: boolean
}

export type SearchQueryToken =
  | NodeSelectorToken
  | ReferenceToken
  | ScopeToken
  | TypeFilterToken
  | FreetextToken

const REFERENCE_KIND_ALIASES: Readonly<Record<string, ReferenceTargetKind>> = {
  component: 'component',
  formula: 'formula',
  workflow: 'workflow',
  'workflow-param': 'workflow-param',
  'formula-arg': 'formula-arg',
  'formula-input': 'formula-arg',
  context: 'context',
  action: 'action',
  var: 'variable',
  variable: 'variable',
  attr: 'attribute',
  attribute: 'attribute',
  event: 'event',
  api: 'api',
  'api-input': 'api-input',
  service: 'api-service',
  'api-service': 'api-service',
  'url-param': 'url-param',
  param: 'url-param',
  slot: 'slot',
  css: 'css',
  theme: 'css',
  'style-var': 'css',
  animation: 'animation',
  package: 'package',
  node: 'node',
}

const VALID_TYPE_FILTERS: ReadonlySet<string> = new Set([
  'action',
  'action-custom-model-argument',
  'action-custom-model-event',
  'action-model',
  'animation',
  'api',
  'api-service',
  'attr',
  'attribute',
  'component',
  'component-api',
  'component-api-input',
  'component-attribute',
  'component-context',
  'component-event',
  'component-formula',
  'component-instance',
  'component-node',
  'component-node-attribute',
  'component-variable',
  'component-workflow',
  'context',
  'custom-property',
  'element',
  'event',
  'formula',
  'node',
  'package',
  'page',
  'project-action',
  'project-config',
  'project-formula',
  'project-package',
  'project-route',
  'project-theme',
  'project-theme-property',
  'route',
  'service',
  'slot',
  'style',
  'style-declaration',
  'style-variable',
  'style-variant',
  'text',
  'text-node',
  'theme',
  'var',
  'variable',
  'variant',
  'workflow',
])

function isQuoted(str: string): boolean {
  return (
    str.length >= 2 &&
    ((str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'")))
  )
}

function unquote(str: string): string {
  const trimmed = str.trim()
  if (isQuoted(trimmed)) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function tryParseRegexLiteral(str: string): RegExp | null {
  if (!str.startsWith('/') || str.length < 2) {
    return null
  }
  const lastSlashIndex = str.lastIndexOf('/')
  if (lastSlashIndex <= 0) {
    return null
  }
  const pattern = str.slice(1, lastSlashIndex)
  const flags = str.slice(lastSlashIndex + 1)
  if (!/^[gimsuy]*$/.test(flags)) {
    return null
  }
  try {
    return new RegExp(pattern, flags || undefined)
  } catch {
    return null
  }
}

export function createSegmentMatcher(
  raw: string,
  defaultMatchType: 'prefix' | 'exact' = 'prefix',
): SegmentMatcher | null {
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  if (isQuoted(trimmed)) {
    const inner = trimmed.slice(1, -1)
    return inner.length > 0 ? { value: inner, matchType: 'exact' } : null
  }

  const regexLiteral = tryParseRegexLiteral(trimmed)
  if (regexLiteral) {
    return {
      value: trimmed,
      matchType: 'regex',
      regex: regexLiteral,
    }
  }

  if (trimmed.includes('*')) {
    const pattern = trimmed.split('*').map(escapeRegex).join('.*')
    return {
      value: trimmed,
      matchType: 'wildcard',
      regex: new RegExp(`^${pattern}$`, 'i'),
    }
  }

  return {
    value: trimmed,
    matchType: defaultMatchType,
  }
}

export function matchesSegment(
  actual: string | number | undefined | null,
  matcher: SegmentMatcher,
): boolean {
  if (actual === undefined || actual === null) {
    return false
  }
  const str = String(actual)
  if (str.length === 0) {
    return false
  }

  switch (matcher.matchType) {
    case 'exact':
      return str.toLowerCase() === matcher.value.toLowerCase()
    case 'prefix':
      return str.toLowerCase().startsWith(matcher.value.toLowerCase())
    case 'wildcard':
    case 'regex':
      return Boolean(matcher.regex?.test(str))
  }
}

function splitPathSegmentMatchers(
  raw: string,
  defaultMatchType: 'prefix' | 'exact' = 'prefix',
): {
  rootScoped: boolean
  segments: SegmentMatcher[]
} {
  // If the entire path is wrapped in a single pair of quotes and contains `/`, e.g. `"Broadcaster/Emit event"`,
  // treat each segment inside as exact-quoted.
  const wholeQuotedWithSlash =
    isQuoted(raw) &&
    !raw.slice(1, -1).includes(raw[0]) &&
    raw.slice(1, -1).includes('/')

  const effectiveRaw = wholeQuotedWithSlash ? raw.slice(1, -1) : raw
  const effectiveDefault = wholeQuotedWithSlash ? 'exact' : defaultMatchType

  const rootScoped = effectiveRaw.startsWith('/')
  const target = rootScoped ? effectiveRaw.slice(1) : effectiveRaw

  const rawSegments: string[] = []
  let current = ''
  let quoteChar: string | null = null

  for (let i = 0; i < target.length; i++) {
    const ch = target[i]
    if (quoteChar) {
      current += ch
      if (ch === quoteChar) {
        quoteChar = null
      }
    } else if (ch === '"' || ch === "'") {
      quoteChar = ch
      current += ch
    } else if (ch === '/') {
      rawSegments.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }

  if (current.trim().length > 0) {
    rawSegments.push(current.trim())
  }

  const segments: SegmentMatcher[] = []
  for (const seg of rawSegments) {
    const matcher = createSegmentMatcher(seg, effectiveDefault)
    if (matcher) {
      segments.push(matcher)
    }
  }

  return {
    rootScoped,
    segments,
  }
}

function parseAttributeBlock(
  rawAttr: string,
  nodeKind: NodeSelectorToken['nodeKind'],
): NodeAttributeMatcher | null {
  const content = rawAttr.trim()
  if (!content) {
    return null
  }

  let quoteChar: string | null = null
  let operator: AttributeOperator | undefined
  let opIndex = -1
  let opLength = 0

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (quoteChar) {
      if (ch === quoteChar) {
        quoteChar = null
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      quoteChar = ch
      continue
    }
    const twoChar = content.slice(i, i + 2)
    if (twoChar === '*=' || twoChar === '^=' || twoChar === '$=') {
      operator = twoChar
      opIndex = i
      opLength = 2
      break
    }
    if (ch === '=') {
      operator = '='
      opIndex = i
      opLength = 1
      break
    }
  }

  const keyPart =
    opIndex !== -1 ? content.slice(0, opIndex).trim() : content.trim()
  const rawValPart =
    opIndex !== -1 ? content.slice(opIndex + opLength).trim() : undefined

  if (!keyPart) {
    return null
  }

  let namespace: NodeAttributeMatcher['namespace']
  let name = keyPart

  if (keyPart.startsWith('style:')) {
    namespace = 'style'
    name = keyPart.slice('style:'.length).trim()
  } else if (keyPart.startsWith('event:')) {
    namespace = 'event'
    name = keyPart.slice('event:'.length).trim()
  } else if (keyPart === 'slot' && nodeKind !== 'slot') {
    namespace = 'slot'
    name = 'slot'
  } else {
    name = unquote(keyPart)
  }

  if (!name) {
    return null
  }

  const matcher: NodeAttributeMatcher = { name }
  if (namespace) {
    matcher.namespace = namespace
  }
  if (operator && rawValPart !== undefined) {
    matcher.operator = operator
    const unquotedVal = unquote(rawValPart)
    const regexVal = tryParseRegexLiteral(unquotedVal)
    matcher.value = regexVal ?? unquotedVal
  }

  return matcher
}

function parseSelectorToken(
  inner: string,
  exclude: boolean,
): NodeSelectorToken | null {
  const trimmed = inner.trim()
  if (!trimmed) {
    return null
  }

  let pos = 0
  let quoteChar: string | null = null
  while (pos < trimmed.length) {
    const ch = trimmed[pos]
    if (quoteChar) {
      if (ch === quoteChar) {
        quoteChar = null
      }
      pos++
      continue
    }
    if (ch === '"' || ch === "'") {
      quoteChar = ch
      pos++
      continue
    }
    if (ch === '#' || ch === '.' || ch === '[') {
      break
    }
    pos++
  }

  const head = trimmed.slice(0, pos).trim()
  let nodeKind: NodeSelectorToken['nodeKind']
  let name: SegmentMatcher | undefined
  let pkg: SegmentMatcher | undefined

  if (head.length > 0) {
    if (head.startsWith('component:')) {
      nodeKind = 'component'
      const compTarget = head.slice('component:'.length).trim()
      const { segments } = splitPathSegmentMatchers(compTarget, 'prefix')
      if (segments.length === 2) {
        pkg = segments[0]
        name = segments[1]
      } else if (segments.length === 1) {
        name = segments[0]
      } else {
        return null
      }
    } else if (head.startsWith('element:')) {
      nodeKind = 'element'
      const elemMatcher = createSegmentMatcher(
        head.slice('element:'.length),
        'exact',
      )
      if (!elemMatcher) {
        return null
      }
      name = elemMatcher
    } else if (head === 'slot') {
      nodeKind = 'slot'
    } else if (head === 'text') {
      nodeKind = 'text'
    } else if (head.includes('/')) {
      const { segments } = splitPathSegmentMatchers(head, 'prefix')
      if (segments.length === 2) {
        nodeKind = 'component'
        pkg = segments[0]
        name = segments[1]
      } else {
        return null
      }
    } else {
      const unquotedHead = unquote(head)
      if (!/^[\w*-]+$/.test(unquotedHead)) {
        return null
      }
      const headMatcher = createSegmentMatcher(head, 'exact')
      if (!headMatcher) {
        return null
      }
      if (/^[A-Z]/.test(unquotedHead)) {
        nodeKind = 'component'
        name = headMatcher
      } else {
        nodeKind = 'element'
        name = headMatcher
      }
    }
  }

  let id: SegmentMatcher | undefined
  const classes: SegmentMatcher[] = []
  const attributes: NodeAttributeMatcher[] = []

  while (pos < trimmed.length) {
    const ch = trimmed[pos]
    if (ch === '#' || ch === '.') {
      pos++
      const start = pos
      let q: string | null = null
      while (pos < trimmed.length) {
        const c = trimmed[pos]
        if (q) {
          if (c === q) {
            q = null
          }
          pos++
          continue
        }
        if (c === '"' || c === "'") {
          q = c
          pos++
          continue
        }
        if (c === '#' || c === '.' || c === '[') {
          break
        }
        pos++
      }
      const rawIdent = trimmed.slice(start, pos)
      const identMatcher = createSegmentMatcher(rawIdent, 'exact')
      if (!identMatcher) {
        return null
      }
      if (ch === '#') {
        id = identMatcher
      } else {
        classes.push(identMatcher)
      }
    } else if (ch === '[') {
      pos++
      const start = pos
      let q: string | null = null
      let foundClose = false
      while (pos < trimmed.length) {
        const c = trimmed[pos]
        if (q) {
          if (c === q) {
            q = null
          }
          pos++
          continue
        }
        if (c === '"' || c === "'") {
          q = c
          pos++
          continue
        }
        if (c === ']') {
          foundClose = true
          break
        }
        pos++
      }
      if (!foundClose) {
        return null
      }
      const attrContent = trimmed.slice(start, pos)
      pos++ // skip ']'
      const attrMatcher = parseAttributeBlock(attrContent, nodeKind)
      if (!attrMatcher) {
        return null
      }
      attributes.push(attrMatcher)
    } else {
      return null
    }
  }

  const token: NodeSelectorToken = {
    kind: 'selector',
    exclude,
    classes,
    attributes,
  }
  if (nodeKind !== undefined) {
    token.nodeKind = nodeKind
  }
  if (pkg !== undefined) {
    token.package = pkg
  }
  if (name !== undefined) {
    token.name = name
  }
  if (id !== undefined) {
    token.id = id
  }

  return token
}

function tokenizeRawQuery(query: string): string[] {
  const rawTokens: string[] = []
  let current = ''
  let quoteChar: string | null = null
  let angleDepth = 0
  let bracketDepth = 0

  for (let i = 0; i < query.length; i++) {
    const ch = query[i]

    if (quoteChar) {
      current += ch
      if (ch === quoteChar) {
        quoteChar = null
      }
      continue
    }

    if (ch === '"' || ch === "'") {
      quoteChar = ch
      current += ch
      continue
    }

    if (ch === '<' && (current === '' || current === '-')) {
      angleDepth = 1
      current += ch
      continue
    }

    if (angleDepth > 0) {
      current += ch
      if (ch === '[') {
        bracketDepth++
      } else if (ch === ']' && bracketDepth > 0) {
        bracketDepth--
      } else if (ch === '>' && bracketDepth === 0) {
        angleDepth = 0
      }
      continue
    }

    if (/\s/.test(ch)) {
      if (current.length > 0) {
        rawTokens.push(current)
        current = ''
      }
      continue
    }

    current += ch
  }

  if (current.length > 0) {
    rawTokens.push(current)
  }

  return rawTokens
}

function tryParseStructuralToken(raw: string): SearchQueryToken | null {
  const exclude = raw.startsWith('-') && raw.length > 1
  const body = exclude ? raw.slice(1) : raw

  // 1. Selector <...>
  if (body.startsWith('<') && body.endsWith('>') && body.length >= 2) {
    const parsedSelector = parseSelectorToken(body.slice(1, -1), exclude)
    if (parsedSelector) {
      return parsedSelector
    }
  }

  // 2. Reference @<kind>:<target> or ref:<kind>:<target>
  if (body.startsWith('@') || body.toLowerCase().startsWith('ref:')) {
    const rest = body.startsWith('@') ? body.slice(1) : body.slice(4)
    const colonIdx = rest.indexOf(':')
    if (colonIdx > 0) {
      const rawKind = rest.slice(0, colonIdx).toLowerCase()
      const targetKind = REFERENCE_KIND_ALIASES[rawKind]
      const targetStr = rest.slice(colonIdx + 1)
      if (targetKind && targetStr.length > 0) {
        const { rootScoped, segments } = splitPathSegmentMatchers(
          targetStr,
          'prefix',
        )
        if (segments.length > 0) {
          return {
            kind: 'reference',
            exclude,
            targetKind,
            rootScoped,
            segments,
          }
        }
      }
    }
  }

  // 3. Scope in:<target>
  if (body.toLowerCase().startsWith('in:') && body.length > 3) {
    const targetStr = body.slice(3)
    const { segments } = splitPathSegmentMatchers(targetStr, 'prefix')
    if (segments.length > 0) {
      return {
        kind: 'scope',
        exclude,
        segments,
      }
    }
  }

  // 4. Entity type is:<type> or type:<type>
  if (
    body.toLowerCase().startsWith('is:') ||
    body.toLowerCase().startsWith('type:')
  ) {
    const colonIdx = body.indexOf(':')
    const typeValue = unquote(body.slice(colonIdx + 1)).toLowerCase()
    if (VALID_TYPE_FILTERS.has(typeValue)) {
      return {
        kind: 'type',
        exclude,
        value: typeValue,
      }
    }
  }

  // 5. Quoted exact freetext token ("..." or '...')
  if (isQuoted(body)) {
    return {
      kind: 'freetext',
      exclude,
      value: body.slice(1, -1),
      exact: true,
    }
  }

  // 6. Regex token (/.../)
  const regex = tryParseRegexLiteral(body)
  if (regex) {
    return {
      kind: 'freetext',
      exclude,
      value: regex,
      exact: false,
    }
  }

  return null
}

/**
 * Parses a search query string into structured and freetext tokens.
 */
export function parseSearchQuery(query: string): SearchQueryToken[] {
  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  // Check if the entire query is a regex literal (e.g. `/some string/i`)
  const wholeRegex = tryParseRegexLiteral(trimmed)
  if (wholeRegex) {
    return [
      {
        kind: 'freetext',
        exclude: false,
        value: wholeRegex,
        exact: false,
      },
    ]
  }

  // Check if the entire query is a single quoted string (e.g. `"Some string"`)
  if (isQuoted(trimmed) && !trimmed.slice(1, -1).includes(trimmed[0])) {
    return [
      {
        kind: 'freetext',
        exclude: false,
        value: trimmed.slice(1, -1),
        exact: true,
      },
    ]
  }

  const rawTokens = tokenizeRawQuery(trimmed)
  const tokens: SearchQueryToken[] = []
  let pendingFreetextParts: string[] = []

  const flushFreetext = () => {
    if (pendingFreetextParts.length > 0) {
      tokens.push({
        kind: 'freetext',
        exclude: false,
        value: pendingFreetextParts.join(' '),
        exact: false,
      })
      pendingFreetextParts = []
    }
  }

  for (const raw of rawTokens) {
    const structural = tryParseStructuralToken(raw)
    if (structural) {
      flushFreetext()
      tokens.push(structural)
    } else {
      pendingFreetextParts.push(raw)
    }
  }

  flushFreetext()
  return tokens
}
