import type { MetaEntry, Nullable } from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'

export const getDynamicMetaEntries = (
  meta?: Nullable<Record<string, MetaEntry>>,
): Record<string, MetaEntry> => {
  if (!meta) {
    return {}
  }
  const dynamicMetaEntries: Record<string, MetaEntry> = {}
  for (const key in meta) {
    const entry = meta[key]
    if (isDefined(entry.content) && entry.content.type !== 'value') {
      dynamicMetaEntries[key] = entry
    } else if (entry.attrs) {
      for (const attrKey in entry.attrs) {
        if (entry.attrs[attrKey]?.type !== 'value') {
          dynamicMetaEntries[key] = entry
          break
        }
      }
    }
  }
  return dynamicMetaEntries
}
