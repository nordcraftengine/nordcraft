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
    } else if (
      Object.values(entry.attrs ?? {}).some((a) => a?.type !== 'value')
    ) {
      dynamicMetaEntries[key] = entry
    }
  }
  return dynamicMetaEntries
}
