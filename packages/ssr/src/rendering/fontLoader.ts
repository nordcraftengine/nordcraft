/**
 * Browser-side script that injects the theme font stylesheets into <head>.
 * Bundled and minified via esbuild in scripts/build.ts for custom elements.
 */
declare const __FONT_URLS__: string[]

const loadFontStylesheets = (fontUrls: string[]) => {
  /*
   * Font loading in shadow DOM is not supported (@font-face inside a shadow root
   * is ignored), so the stylesheet has to live in the document <head>.
   *
   * To avoid text flashing to a fallback font and back, we must never add a second
   * @font-face for a face the page already declares. We therefore compare on the
   * actual faces (family + style + weight) and only request the missing ones.
   * Injected links stay in <head>, so later runs find them and skip them.
   */
  interface ParsedSpec {
    name: string
    axes: string[]
    tuples: string[][]
  }
  interface FontVariant {
    tuple: string[] | null
    style: 'italic' | 'normal'
    weight: string
  }
  interface ExistingEntry {
    all: boolean
    faces: Array<{ style: 'italic' | 'normal'; weight: string }>
  }

  const normalize = (s: string) =>
    s
      .replace(/^['"]|['"]$/g, '')
      .trim()
      .toLowerCase()
  const toWeight = (w = '400') => {
    const v = String(w).trim().toLowerCase().replace('..', ' ')
    return v === 'normal' || v === '' ? '400' : v === 'bold' ? '700' : v
  }
  const toStyle = (s = ''): 'italic' | 'normal' =>
    /^(italic|oblique)/.test(String(s).trim().toLowerCase())
      ? 'italic'
      : 'normal'
  const toRange = (w: string): [number, number] => {
    const [first = 400, second = first] = w.split(' ').map(Number)
    return [first, second]
  }

  // Legacy API: "Roboto:400,700|Open+Sans" or "Roboto:400,700" (no "@")
  const isLegacy = (spec: string) =>
    spec.includes('|') || (spec.includes(':') && !spec.includes('@'))
  const legacyNames = (spec: string) =>
    spec.split('|').map((p) => normalize(p.split(':')[0] ?? ''))

  // CSS2 API: "Inter", "Inter:wght@400;700", "Inter:ital,wght@0,400;1,700"
  const parseSpec = (spec: string): ParsedSpec => {
    const at = spec.indexOf('@')
    const head = at === -1 ? spec : spec.slice(0, at)
    const colon = head.indexOf(':')
    return {
      name: (colon === -1 ? head : head.slice(0, colon)).trim(),
      axes:
        colon === -1
          ? []
          : head
              .slice(colon + 1)
              .split(',')
              .map((a) => a.trim()),
      tuples:
        at === -1
          ? []
          : spec
              .slice(at + 1)
              .split(';')
              .map((t) => t.split(',')),
    }
  }
  const variantsOf = (p: ParsedSpec): FontVariant[] => {
    if (p.tuples.length === 0) {
      return [{ tuple: null, style: 'normal', weight: '400' }]
    }
    const wi = p.axes.indexOf('wght')
    const ii = p.axes.indexOf('ital')
    return p.tuples.map((t) => ({
      tuple: t,
      style: ii !== -1 && t[ii] === '1' ? 'italic' : 'normal',
      weight: toWeight(wi !== -1 ? t[wi] : '400'),
    }))
  }

  const existing = new Map<string, ExistingEntry>()
  const entry = (name: string): ExistingEntry => {
    let e = existing.get(name)
    if (!e) {
      e = { all: false, faces: [] }
      existing.set(name, e)
    }
    return e
  }
  const addFace = (name: string, style: 'italic' | 'normal', weight?: string) =>
    entry(name).faces.push({ style, weight: toWeight(weight) })
  const addFamily = (name: string) => {
    entry(name).all = true
  }
  const isCovered = (name: string, v: FontVariant) => {
    const e = existing.get(name)
    if (!e) {
      return false
    }
    if (e.all) {
      return true
    }
    const [min, max] = toRange(v.weight)
    return e.faces.some((f) => {
      if (f.style !== v.style) {
        return false
      }
      const [a, b] = toRange(f.weight)
      return a <= min && b >= max
    })
  }

  // 1. Faces the browser already knows about
  if ('fonts' in document) {
    for (const f of Array.from(document.fonts)) {
      addFace(normalize(f.family), toStyle(f.style), f.weight)
    }
  }
  // 2. Stylesheets that may still be loading (page-provided or injected earlier)
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    try {
      const url = new URL(link.getAttribute('href') ?? '', document.baseURI)
      for (const spec of url.searchParams.getAll('family')) {
        if (isLegacy(spec)) {
          legacyNames(spec).forEach(addFamily)
          continue
        }
        const p = parseSpec(spec)
        for (const v of variantsOf(p)) {
          addFace(normalize(p.name), v.style, v.weight)
        }
      }
    } catch {
      /* unparsable href, ignore */
    }
  }

  for (const rawUrl of fontUrls) {
    let fontUrl: URL
    try {
      fontUrl = new URL(rawUrl)
    } catch {
      continue // one bad URL must not stop the others
    }
    const wanted: string[] = []
    for (const spec of new Set(fontUrl.searchParams.getAll('family'))) {
      if (isLegacy(spec)) {
        const names = legacyNames(spec)
        if (!names.every((n) => existing.has(n))) {
          wanted.push(spec)
        }
        names.forEach(addFamily)
        continue
      }
      const p = parseSpec(spec)
      const name = normalize(p.name)
      const all = variantsOf(p)
      const missing = all.filter((v) => !isCovered(name, v))
      if (missing.length === 0) {
        continue
      }
      if (missing.length === all.length || p.tuples.length === 0) {
        wanted.push(spec)
      } else {
        // Only request the faces that are missing, existing ones are left untouched
        wanted.push(
          `${p.name}:${p.axes.join(',')}@${missing
            .map((v) => (v.tuple ?? []).join(','))
            .join(';')}`,
        )
      }
      for (const v of missing) {
        addFace(name, v.style, v.weight)
      }
    }
    if (wanted.length === 0) {
      continue
    }
    fontUrl.searchParams.delete('family')
    for (const spec of wanted) {
      fontUrl.searchParams.append('family', spec)
    }
    const linkElem = document.createElement('link')
    linkElem.setAttribute('rel', 'stylesheet')
    linkElem.setAttribute('href', fontUrl.toString())
    linkElem.setAttribute('data-nordcraft-font', '')
    document.head.prepend(linkElem)
  }
}

loadFontStylesheets(__FONT_URLS__)

export {}
