import { postMessageToEditor } from '../postMessageToEditor'
import type { CandidateSnapTarget } from './snapTargetsUtils'
import {
  buildContainingBlock,
  collectCandidateTargets,
  compareTargetsByProximity,
  computeEqualSpacing,
  findDraggedElement,
  getElementSnapRect,
  getViewportRect,
} from './snapTargetsUtils'

export const DEFAULT_MAX_SNAP_TARGETS = 20

export type SnapRect = {
  top: number
  left: number
  width: number
  height: number
}

export type SnapTarget = {
  nodeId: string
  rect: SnapRect
  isSibling: boolean
  isAncestor: boolean
  baseline?: number
}

export type SnapContainingBlock = {
  nodeId: string | null
  rect: SnapRect
  paddingRect: SnapRect
  border: [string, string, string, string]
  padding: [string, string, string, string]
  scroll: {
    top: number
    left: number
  }
  hasTransform: boolean
}

export type SnapGap = {
  gap: number
  start: number
  end: number
  fromNodeId: string
  toNodeId: string
}

export type SnapEqualSpacing = {
  x: SnapGap[]
  y: SnapGap[]
}

export type GetSnapTargetsMessage = {
  type: 'getSnapTargets'
  nodeId: string | null
  maxTargets?: number
}

export type SnapTargetsMessage = {
  type: 'snapTargets'
  nodeId: string
  targets: SnapTarget[]
  containingBlock: SnapContainingBlock | null
  viewport: SnapRect
  equalSpacing: SnapEqualSpacing
}

export function getSnapTargetsData(options: {
  nodeId: string
  maxTargets?: number
}): SnapTargetsMessage {
  const { nodeId, maxTargets = DEFAULT_MAX_SNAP_TARGETS } = options
  const viewport = getViewportRect()
  const draggedElement = findDraggedElement(nodeId)

  if (!draggedElement) {
    return {
      type: 'snapTargets',
      nodeId,
      targets: [],
      containingBlock: null,
      viewport,
      equalSpacing: { x: [], y: [] },
    }
  }

  const root = document.getElementById('App') ?? document.body
  const draggedStyle = window.getComputedStyle(draggedElement)
  const draggedRect = getElementSnapRect(draggedElement, draggedStyle)
  const containingBlock = buildContainingBlock(draggedElement, viewport)

  const candidates = collectCandidateTargets(root, draggedElement)
  const siblings: CandidateSnapTarget[] = []
  const ancestors: CandidateSnapTarget[] = []
  const others: CandidateSnapTarget[] = []

  for (const candidate of candidates) {
    if (candidate.target.isSibling) {
      siblings.push(candidate)
    } else if (candidate.target.isAncestor) {
      ancestors.push(candidate)
    } else {
      others.push(candidate)
    }
  }

  siblings.sort((a, b) => compareTargetsByProximity(draggedRect, a, b))
  ancestors.sort(
    (a, b) =>
      a.hierarchyDistance - b.hierarchyDistance ||
      compareTargetsByProximity(draggedRect, a, b),
  )
  others.sort((a, b) => compareTargetsByProximity(draggedRect, a, b))

  const equalSpacing = computeEqualSpacing(siblings.map((c) => c.target))
  const limit = Math.max(0, maxTargets)
  const targets = [...siblings, ...ancestors, ...others]
    .slice(0, limit)
    .map((c) => c.target)

  return {
    type: 'snapTargets',
    nodeId,
    targets,
    containingBlock,
    viewport,
    equalSpacing,
  }
}

export function createSnapTargetsController(options?: {
  postMessage?: (message: SnapTargetsMessage) => void
}) {
  const send = options?.postMessage ?? postMessageToEditor
  let activeRequest: { nodeId: string; maxTargets?: number } | null = null
  let pendingRaf: number | null = null

  const flush = () => {
    if (!activeRequest) {
      return
    }
    send(getSnapTargetsData(activeRequest))
  }

  const scheduleUpdate = () => {
    if (!activeRequest) {
      return
    }
    if (typeof requestAnimationFrame === 'undefined') {
      flush()
      return
    }
    if (pendingRaf !== null) {
      return
    }
    pendingRaf = requestAnimationFrame(() => {
      pendingRaf = null
      flush()
    })
  }

  const stop = () => {
    if (pendingRaf !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(pendingRaf)
      pendingRaf = null
    }
    if (activeRequest !== null) {
      activeRequest = null
      window.removeEventListener('scroll', scheduleUpdate, true)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }

  const start = (request: { nodeId: string | null; maxTargets?: number }) => {
    stop()
    if (!request.nodeId) {
      return
    }
    activeRequest = {
      nodeId: request.nodeId,
      maxTargets: request.maxTargets,
    }
    flush()
    window.addEventListener('scroll', scheduleUpdate, {
      capture: true,
      passive: true,
    })
    window.addEventListener('resize', scheduleUpdate)
  }

  return {
    start,
    stop,
  }
}
