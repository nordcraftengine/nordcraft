const fileCache = new Map<string, any>()

export const loadJsFile = async <T>(path: string): Promise<T | undefined> => {
  if (fileCache.has(path)) {
    return fileCache.get(path) as T
  }
  try {
    const content = await import(path.toLowerCase())
    const parsed = content.default as T
    fileCache.set(path, parsed)
    return parsed
  } catch (e) {
    // Avoid future attempts to load the file
    fileCache.set(path, undefined)
    // eslint-disable-next-line no-console
    console.error(`Unable to load ${path}`, e instanceof Error ? e.message : e)
  }
}
