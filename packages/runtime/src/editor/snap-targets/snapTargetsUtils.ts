import {
  DATA_ATTR_COMPONENT,
  DATA_ATTR_ID,
  DATA_ATTR_IS_ROOT_COMPONENT,
  DATA_ATTR_NODE_ID,
  DATA_ATTR_NODE_TYPE,
  DATA_ATTR_VIEWPORT_HEIGHT,
  DATA_NODE_TYPE_TEXT,
  ROOT_NODE_ID,
} from '../const'
import {
  escapeRegex,
  getDOMNodeFromNodeId,
  stripNodeIdRepeatIndices,
} from '../dom'
import {
  getBorderLengths,
  getChain,
  getInlineRect,
  getPaddingLengths,
  getTransformStyles,
} from '../editorUtils'
import type {
  SnapContainingBlock,
  SnapEqualSpacing,
  SnapGap,
  SnapRect,
  SnapTarget,
} from './snapTargets'

const NON_VISUAL_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'LINK',
  'META',
  'HEAD',
  'TITLE',
  'NOSCRIPT',
  'TEMPLATE',
])

export const normalizeZero = (n: number): number => (n === 0 ? 0 : n)

export function toSnapRect(
  rect: Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>,
): SnapRect {
  return {
    top: normalizeZero(rect.top),
    left: normalizeZero(rect.left),
    width: normalizeZero(rect.width),
    height: normalizeZero(rect.height),
  }
}

export function getViewportRect(): SnapRect {
  const width = window.innerWidth || document.documentElement?.clientWidth || 0
  const viewportAttr = document.body?.getAttribute(DATA_ATTR_VIEWPORT_HEIGHT)
  const parsedHeight = viewportAttr ? Number(viewportAttr) : NaN
  const height =
    !Number.isNaN(parsedHeight) && parsedHeight > 0
      ? parsedHeight
      : window.innerHeight || document.documentElement?.clientHeight || 0
  return {
    top: 0,
    left: 0,
    width: normalizeZero(width),
    height: normalizeZero(height),
  }
}

export function getElementSnapRect(
  el: Element,
  style: CSSStyleDeclaration,
): SnapRect {
  return toSnapRect(
    style.display === 'inline' ? getInlineRect(el) : el.getBoundingClientRect(),
  )
}

function isNonIdentityTransformValue(value: string | undefined): boolean {
  return Boolean(
    value &&
    value !== 'none' &&
    value !== 'matrix(1, 0, 0, 1, 0, 0)' &&
    value !== 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
  )
}

function hasOwnTransform(el: Element): boolean {
  const { transform, rotate, scale, translate } = getTransformStyles(el)
  return (
    isNonIdentityTransformValue(transform) ||
    isNonIdentityTransformValue(rotate) ||
    isNonIdentityTransformValue(scale) ||
    isNonIdentityTransformValue(translate)
  )
}

function hasTransformInChain(el: Element): boolean {
  return getChain(el).some(hasOwnTransform)
}

function establishesFixedContainingBlock(
  el: Element,
  style: CSSStyleDeclaration,
): boolean {
  if (hasOwnTransform(el)) {
    return true
  }
  if (style.perspective && style.perspective !== 'none') {
    return true
  }
  if (style.filter && style.filter !== 'none') {
    return true
  }
  if (style.backdropFilter && style.backdropFilter !== 'none') {
    return true
  }
  if (/(layout|paint|strict|content)/.test(style.contain || '')) {
    return true
  }
  if (
    /(transform|perspective|filter|backdrop-filter|contain)/.test(
      style.willChange || '',
    )
  ) {
    return true
  }
  return false
}

function findContainingBlockElement(draggedElement: Element): Element | null {
  const draggedStyle = window.getComputedStyle(draggedElement)
  const isFixed =
    draggedStyle.position === 'fixed' ||
    (draggedElement instanceof HTMLElement &&
      draggedElement.style.position === 'fixed')

  for (
    let curr = draggedElement.parentElement;
    curr &&
    curr !== document.documentElement &&
    curr !== document.body &&
    curr.id !== 'App';
    curr = curr.parentElement
  ) {
    const style = window.getComputedStyle(curr)
    if (isFixed) {
      if (establishesFixedContainingBlock(curr, style)) {
        return curr
      }
    } else {
      const position =
        style.position ||
        (curr instanceof HTMLElement ? curr.style.position : '')
      if (
        (Boolean(position) && position !== 'static') ||
        establishesFixedContainingBlock(curr, style)
      ) {
        return curr
      }
    }
  }
  return null
}

export function resolveNodeId(el: Element): string | null {
  const dataId = el.getAttribute(DATA_ATTR_ID)
  if (dataId) {
    return stripNodeIdRepeatIndices(dataId)
  }
  return el.getAttribute(DATA_ATTR_NODE_ID)
}

export function buildContainingBlock(
  draggedElement: Element,
  viewport: SnapRect,
): SnapContainingBlock {
  const cbElement = findContainingBlockElement(draggedElement)
  if (!cbElement) {
    return {
      nodeId: null,
      rect: { ...viewport },
      paddingRect: { ...viewport },
      border: ['0px', '0px', '0px', '0px'],
      padding: ['0px', '0px', '0px', '0px'],
      scroll: {
        top: normalizeZero(
          window.scrollY || document.documentElement?.scrollTop || 0,
        ),
        left: normalizeZero(
          window.scrollX || document.documentElement?.scrollLeft || 0,
        ),
      },
      hasTransform: false,
    }
  }

  const style = window.getComputedStyle(cbElement)
  const rect = getElementSnapRect(cbElement, style)
  const border = getBorderLengths(style)
  const padding = getPaddingLengths(style)
  const borderTop = parseFloat(border[0]) || 0
  const borderRight = parseFloat(border[1]) || 0
  const borderBottom = parseFloat(border[2]) || 0
  const borderLeft = parseFloat(border[3]) || 0

  const paddingRect: SnapRect = {
    top: normalizeZero(rect.top + borderTop),
    left: normalizeZero(rect.left + borderLeft),
    width: normalizeZero(Math.max(0, rect.width - borderLeft - borderRight)),
    height: normalizeZero(Math.max(0, rect.height - borderTop - borderBottom)),
  }

  return {
    nodeId: resolveNodeId(cbElement),
    rect,
    paddingRect,
    border,
    padding,
    scroll: {
      top: normalizeZero(cbElement.scrollTop || 0),
      left: normalizeZero(cbElement.scrollLeft || 0),
    },
    hasTransform: hasTransformInChain(cbElement),
  }
}

function isComponentInstanceBoundary(el: Element): boolean {
  if (el.hasAttribute(DATA_ATTR_IS_ROOT_COMPONENT)) {
    return false
  }
  const dataId = el.getAttribute(DATA_ATTR_ID)
  if (dataId === '0') {
    return false
  }
  if (el.getAttribute(DATA_ATTR_NODE_ID) === ROOT_NODE_ID && dataId !== null) {
    return true
  }
  if (el.hasAttribute(DATA_ATTR_COMPONENT)) {
    const ancestorComp = el.parentElement?.closest(
      `[${DATA_ATTR_COMPONENT}], [${DATA_ATTR_NODE_ID}="${ROOT_NODE_ID}"]:not([${DATA_ATTR_IS_ROOT_COMPONENT}])`,
    )
    return !ancestorComp
  }
  return false
}

function isRepeatItemBoundary(el: Element): boolean {
  const dataId = el.getAttribute(DATA_ATTR_ID)
  if (!dataId) {
    return false
  }
  if (/\(\d+\)$/.test(dataId)) {
    return true
  }
  const parent = el.parentElement
  if (!parent) {
    return false
  }
  const repeatRegex = new RegExp(`^${escapeRegex(dataId)}\\(\\d+\\)$`)
  return Array.from(parent.children).some((child) => {
    if (child === el) {
      return false
    }
    const childId = child.getAttribute(DATA_ATTR_ID)
    return Boolean(childId && repeatRegex.test(childId))
  })
}

function parseLineHeightPx(options: {
  lineHeight: string | undefined
  fontSize: number
  fallbackHeight: number
}): number {
  const { lineHeight, fontSize, fallbackHeight } = options
  if (!lineHeight || lineHeight === 'normal') {
    return fallbackHeight > 0 && fallbackHeight <= fontSize * 2
      ? fallbackHeight
      : fontSize * 1.2
  }
  if (lineHeight.endsWith('px')) {
    const px = parseFloat(lineHeight)
    return Number.isNaN(px) ? fontSize * 1.2 : px
  }
  if (lineHeight.endsWith('%')) {
    const pct = parseFloat(lineHeight)
    return Number.isNaN(pct) ? fontSize * 1.2 : (pct / 100) * fontSize
  }
  const mult = parseFloat(lineHeight)
  return Number.isNaN(mult) ? fontSize * 1.2 : mult * fontSize
}

function getTextBaseline(style: CSSStyleDeclaration, rect: SnapRect): number {
  const fontSize = parseFloat(style.fontSize) || 16
  const lineHeight = parseLineHeightPx({
    lineHeight: style.lineHeight,
    fontSize,
    fallbackHeight: rect.height,
  })
  const isInline = style.display === 'inline'
  const borderTop = isInline ? 0 : parseFloat(style.borderTopWidth) || 0
  const paddingTop = isInline ? 0 : parseFloat(style.paddingTop) || 0
  const halfLeading = (lineHeight - fontSize) / 2
  const ascent = fontSize * 0.8
  return normalizeZero(
    Math.round(
      (rect.top + borderTop + paddingTop + halfLeading + ascent) * 100,
    ) / 100,
  )
}

export function rectEdgeDistance(a: SnapRect, b: SnapRect): number {
  const dx = Math.max(
    0,
    a.left - (b.left + b.width),
    b.left - (a.left + a.width),
  )
  const dy = Math.max(0, a.top - (b.top + b.height), b.top - (a.top + a.height))
  return Math.hypot(dx, dy)
}

export function rectCenterDistance(a: SnapRect, b: SnapRect): number {
  const ax = a.left + a.width / 2
  const ay = a.top + a.height / 2
  const bx = b.left + b.width / 2
  const by = b.top + b.height / 2
  return Math.hypot(ax - bx, ay - by)
}

export type CandidateSnapTarget = {
  target: SnapTarget
  hierarchyDistance: number
}

function getHierarchyDistance(draggedChain: Element[], el: Element): number {
  const elChain = getChain(el)
  for (let i = 0; i < elChain.length; i++) {
    const ancestorIndex = draggedChain.indexOf(elChain[i]!)
    if (ancestorIndex !== -1) {
      return i + ancestorIndex
    }
  }
  return elChain.length + draggedChain.length
}

export function compareTargetsByProximity(
  draggedRect: SnapRect,
  a: CandidateSnapTarget,
  b: CandidateSnapTarget,
): number {
  const edgeDiff =
    rectEdgeDistance(draggedRect, a.target.rect) -
    rectEdgeDistance(draggedRect, b.target.rect)
  if (edgeDiff !== 0) {
    return edgeDiff
  }
  const hierarchyDiff = a.hierarchyDistance - b.hierarchyDistance
  if (hierarchyDiff !== 0) {
    return hierarchyDiff
  }
  return (
    rectCenterDistance(draggedRect, a.target.rect) -
    rectCenterDistance(draggedRect, b.target.rect)
  )
}

export function collectCandidateTargets(
  root: Element,
  draggedElement: Element,
): CandidateSnapTarget[] {
  const candidates: CandidateSnapTarget[] = []
  const draggedChain = getChain(draggedElement)

  const visit = (el: Element) => {
    if (NON_VISUAL_TAGS.has(el.tagName)) {
      return
    }
    if (el === draggedElement) {
      return
    }

    const style = window.getComputedStyle(el)
    if (style.display === 'none') {
      return
    }

    const isAncestor = el.contains(draggedElement)
    const isSibling =
      el.parentElement !== null &&
      el.parentElement === draggedElement.parentElement

    const nodeId = resolveNodeId(el)
    const isVisible =
      style.visibility !== 'hidden' && style.visibility !== 'collapse'

    if (nodeId && isVisible) {
      const rect = getElementSnapRect(el, style)
      if (rect.width > 0 && rect.height > 0) {
        const isTextNode =
          el.getAttribute(DATA_ATTR_NODE_TYPE) === DATA_NODE_TYPE_TEXT
        const target: SnapTarget = {
          nodeId,
          rect,
          isSibling,
          isAncestor,
          ...(isTextNode && { baseline: getTextBaseline(style, rect) }),
        }
        candidates.push({
          target,
          hierarchyDistance: getHierarchyDistance(draggedChain, el),
        })
      }
    }

    // Do not descend into component instances or repeated items unless they contain the dragged element
    if (
      !isAncestor &&
      (isComponentInstanceBoundary(el) || isRepeatItemBoundary(el))
    ) {
      return
    }

    for (const child of Array.from(el.children)) {
      visit(child)
    }
  }

  for (const child of Array.from(root.children)) {
    visit(child)
  }

  return candidates
}

export function computeEqualSpacing(siblings: SnapTarget[]): SnapEqualSpacing {
  const xGaps: SnapGap[] = []
  const yGaps: SnapGap[] = []

  if (siblings.length < 2) {
    return { x: xGaps, y: yGaps }
  }

  const sortedX = [...siblings].sort(
    (a, b) => a.rect.left - b.rect.left || a.rect.top - b.rect.top,
  )
  for (let i = 0; i < sortedX.length - 1; i++) {
    const prev = sortedX[i]!
    const next = sortedX[i + 1]!
    const start = normalizeZero(prev.rect.left + prev.rect.width)
    const end = normalizeZero(next.rect.left)
    const gap = normalizeZero(end - start)
    if (gap > 0) {
      xGaps.push({
        gap,
        start,
        end,
        fromNodeId: prev.nodeId,
        toNodeId: next.nodeId,
      })
    }
  }

  const sortedY = [...siblings].sort(
    (a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left,
  )
  for (let i = 0; i < sortedY.length - 1; i++) {
    const prev = sortedY[i]!
    const next = sortedY[i + 1]!
    const start = normalizeZero(prev.rect.top + prev.rect.height)
    const end = normalizeZero(next.rect.top)
    const gap = normalizeZero(end - start)
    if (gap > 0) {
      yGaps.push({
        gap,
        start,
        end,
        fromNodeId: prev.nodeId,
        toNodeId: next.nodeId,
      })
    }
  }

  return { x: xGaps, y: yGaps }
}

export function findDraggedElement(nodeId: string): Element | null {
  return (
    getDOMNodeFromNodeId(nodeId, false, true) ??
    getDOMNodeFromNodeId(nodeId) ??
    getDOMNodeFromNodeId(nodeId, true, true) ??
    getDOMNodeFromNodeId(nodeId, true, false) ??
    document.querySelector(
      `[${DATA_ATTR_NODE_ID}="${nodeId}"]:not([${DATA_ATTR_COMPONENT}])`,
    )
  )
}
