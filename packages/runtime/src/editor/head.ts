import {
  HeadTagTypes,
  type MetaEntry,
} from '@nordcraft/core/dist/component/component.types'
import {
  applyFormula,
  type FormulaContext,
} from '@nordcraft/core/dist/formula/formula'
import { DATA_ATTR_META_ID } from './const'

const insertOrReplaceHeadNode = (id: string, node: Node) => {
  const existing = document.head.querySelector(`[${DATA_ATTR_META_ID}="${id}"]`)
  if (existing) {
    existing.replaceWith(node)
  } else {
    document.head.appendChild(node)
  }
}

export const insertHeadTags = (
  entries: Record<string, MetaEntry>,
  context: FormulaContext,
) => {
  // Remove all tags that has a data-meta-id attribute that is not in the entries
  Array.from(document.head.querySelectorAll(`[${DATA_ATTR_META_ID}]`))
    .filter((elem) => !entries[elem.getAttribute(DATA_ATTR_META_ID)!])
    .forEach((elem) => elem.remove())

  const renderAttrs = (attrs?: MetaEntry['attrs'], jsonPathPrefix?: string) =>
    Object.entries(attrs ?? {})
      .map(
        ([key, value]) =>
          `${key}="${applyFormula(value, context, jsonPathPrefix ? [jsonPathPrefix, 'attrs', key] : undefined)}"`,
      )
      .join(' ')

  // Skip anything that is not <link>, <style> or <script> tags, as they don't have any influence on the preview
  Object.entries(entries).forEach(([id, entry]) => {
    let html: string | undefined
    switch (entry.tag) {
      case HeadTagTypes.Link:
        html = `<link ${DATA_ATTR_META_ID}="${id}" ${renderAttrs(entry.attrs, id)} />`
        break
      case HeadTagTypes.Script:
        html = `<script ${DATA_ATTR_META_ID}="${id}" ${renderAttrs(entry.attrs, id)}>${applyFormula(entry.content ?? '', context)}</script>`
        break
      case HeadTagTypes.Style:
        html = `<style ${DATA_ATTR_META_ID}="${id}" ${renderAttrs(entry.attrs)}>${applyFormula(entry.content ?? '', context)}</style>`
        break
      default:
        return
    }
    insertOrReplaceHeadNode(
      id,
      document.createRange().createContextualFragment(html),
    )
  })
}
