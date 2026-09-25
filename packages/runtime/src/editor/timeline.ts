import type { AnimationKeyframe } from '@nordcraft/core/dist/component/component.types'
import { clamp, toSeconds } from '../utils/helpers'
import {
  DATA_ATTR_ANIMATING,
  DATA_ATTR_ID,
  DATA_ATTR_MODE,
  DATA_ATTR_TIMELINE_KEYFRAMES,
  DATA_ID_PREVIEW_ANIMATION_STYLES,
  SELECTOR_PREVIEW_ANIMATION_STYLES,
} from './const'
import { getDOMNodeFromNodeId } from './dom'
import { postMessageToEditor } from './postMessageToEditor'

export interface AnimationState {
  animatedElementId: string | null
  time: number | null
  timingFunction?: string
  fillMode?: string
  repeatedElementsValues: Array<{ delay: string; duration: string }>
  timelineTime: { delay: string; duration: string }
  iterationCount: string
}

export const handleGetComputedStyle = (
  selectedNodeId: string | null,
  styles: string[] | undefined,
  animationState: AnimationState | null,
) => {
  const selectedNode = getDOMNodeFromNodeId(selectedNodeId)
  if (!selectedNode) {
    return
  }

  const computedStyle = window.getComputedStyle(selectedNode)

  postMessageToEditor({
    type: 'computedStyle',
    computedStyle: Object.fromEntries(
      (styles ?? []).map((style) => {
        const input = computedStyle.getPropertyValue(style)

        const allValues = input.split(' ')

        const result = allValues
          .map((value) => {
            // If it is a float or float with unit we want to round to 2 decimal
            if (value.match(/^(-?\d+)\.\d+([a-z]*|%?)$/)) {
              const split = value.match(/([0-9.]+)\s*(.*)/) ?? ''

              const number = split[1]
              const unit = split[2]

              const roundNumber = Number(Number(number).toFixed(2))
              const rounded = roundNumber.toString() + unit

              return rounded
            } else {
              return value
            }
          })
          .join(' ')

        return [style, result]
      }),
    ),
    repeatedItemsValues: animationState?.repeatedElementsValues ?? [],
    timelineTime: animationState?.timelineTime ?? {
      delay: '0s',
      duration: '0s',
    },
  })
}

export const handleSetTimelineKeyframes = (
  keyframes: Record<string, AnimationKeyframe> | null | undefined,
  syncOverlayRects: () => void,
) => {
  document.head.querySelector(`[${DATA_ATTR_TIMELINE_KEYFRAMES}]`)?.remove()
  if (!keyframes) {
    return
  }

  const styleElem = document.createElement('style')
  styleElem.appendChild(
    document.createTextNode(`
@keyframes preview_timeline {
  ${Object.values(keyframes)
    .map(
      ({ key, value, position, easing }) =>
        `${Number(position) * 100}% {
          ${key}: ${value};
          ${easing ? `animation-timing-function: ${easing};` : ''}
        }`,
    )
    .join('\n')}
}`),
  )
  styleElem.setAttribute(DATA_ATTR_TIMELINE_KEYFRAMES, '')
  document.head.appendChild(styleElem)
  syncOverlayRects()
}

export const handleSetTimelineTime = (options: {
  data: {
    time: number | null
    timingFunction?: string
    fillMode?: string
  }
  selectedNodeId: string | null
  currentAnimationState: AnimationState | null
  update: () => void
  syncOverlayRects: () => void
}): AnimationState | null => {
  const { time, timingFunction, fillMode } = options.data
  const selectedNodeId = options.selectedNodeId
  const animatedElementChanged =
    options.currentAnimationState?.animatedElementId !== selectedNodeId

  const animationState: AnimationState = {
    animatedElementId: time !== null ? selectedNodeId : null,
    time,
    timingFunction,
    fillMode,
    repeatedElementsValues: options.currentAnimationState
      ?.repeatedElementsValues ?? [{ delay: '0s', duration: '0s' }],
    timelineTime: options.currentAnimationState?.timelineTime ?? {
      delay: '0s',
      duration: '1s',
    },
    iterationCount: options.currentAnimationState?.iterationCount ?? '1',
  }

  // Cleanup on null
  if (time === null) {
    document.head.querySelector(SELECTOR_PREVIEW_ANIMATION_STYLES)?.remove()

    const style = document.body.style

    // Remove all the properties that starts with --editor-timeline
    for (const prop of style) {
      if (prop.startsWith('--editor-timeline')) {
        style.removeProperty(prop)
      }
    }
    document.body.removeAttribute(DATA_ATTR_ANIMATING)
    options.update()
    return animationState
  }

  document.body.setAttribute(DATA_ATTR_ANIMATING, 'true')

  document.body.style.setProperty(
    '--editor-timeline-timing-function',
    timingFunction ?? 'ease',
  )
  document.body.style.setProperty(
    '--editor-timeline-fill-mode',
    fillMode ?? 'none',
  )

  const selectedNode = getDOMNodeFromNodeId(animationState.animatedElementId)

  let repeatedNodes: HTMLElement[] = []

  if (selectedNode) {
    if (selectedNode.parentElement) {
      repeatedNodes = Array.from(selectedNode.parentElement.children).filter(
        (node) =>
          node instanceof HTMLElement &&
          node.getAttribute('data-id')?.startsWith(selectedNodeId + '('),
      ) as HTMLElement[]
    }
    if (animatedElementChanged) {
      const computedStyle = window.getComputedStyle(selectedNode)
      animationState.iterationCount = computedStyle.animationIterationCount

      animationState.repeatedElementsValues = [
        {
          delay: `${toSeconds(computedStyle.animationDelay)}s`,
          duration: `${toSeconds(computedStyle.animationDuration)}s`,
        },
      ]
      animationState.timelineTime = {
        delay: `${toSeconds(computedStyle.animationDelay)}s`,
        duration: `${toSeconds(computedStyle.animationDuration)}s`,
      }

      repeatedNodes.forEach((node) => {
        const nodeComputedStyle = window.getComputedStyle(node)
        animationState.repeatedElementsValues.push({
          delay: `${toSeconds(nodeComputedStyle.animationDelay)}s`,
          duration: `${toSeconds(nodeComputedStyle.animationDuration)}s`,
        })
      })
    }
  }

  const timelineTime =
    parseFloat(animationState.timelineTime.delay) +
    parseFloat(animationState.timelineTime.duration)
  const timelinePosition = time * timelineTime

  const setTimelineVariables = (
    index: number,
    delay: number,
    duration: number,
  ) => {
    const calculatedDelay = timelinePosition - delay
    const progressTime = clamp(calculatedDelay, 0, delay + duration)
    document.body.style.setProperty(
      `--editor-timeline-position-${index}`,
      `${progressTime}s`,
    )
    document.body.style.setProperty(
      `--editor-timeline-duration-${index}`,
      `${duration}s`,
    )
  }

  setTimelineVariables(
    0,
    parseFloat(animationState.repeatedElementsValues[0].delay),
    parseFloat(animationState.repeatedElementsValues[0].duration),
  )

  repeatedNodes.forEach((_, index) => {
    const delay = parseFloat(
      animationState.repeatedElementsValues[index + 1]?.delay ?? '0',
    )
    const duration = parseFloat(
      animationState.repeatedElementsValues[index + 1]?.duration ?? '1',
    )
    setTimelineVariables(index + 1, delay, duration)
  })

  if (animatedElementChanged && animationState.animatedElementId) {
    let styleTag = document.head.querySelector(
      SELECTOR_PREVIEW_ANIMATION_STYLES,
    )
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.setAttribute(DATA_ATTR_ID, DATA_ID_PREVIEW_ANIMATION_STYLES)
      document.head.appendChild(styleTag)
    }
    const getTimelineRule = (
      nodeId: string,
      index: number,
      iterationCount: string | number,
    ) => `body[${DATA_ATTR_MODE}="design"] [${DATA_ATTR_ID}="${nodeId}"] {
  animation: preview_timeline var(--editor-timeline-duration-${index}) paused normal !important;
  animation-fill-mode: var(--editor-timeline-fill-mode) !important;
  animation-timing-function: var(--editor-timeline-timing-function) !important;
  animation-delay: calc(0s - var(--editor-timeline-position-${index})) !important;
  animation-play-state: paused !important;
  animation-iteration-count: ${iterationCount} !important;
}`

    const rules = [
      getTimelineRule(
        animationState.animatedElementId,
        0,
        animationState.iterationCount,
      ),
      ...repeatedNodes.map((node, index) =>
        getTimelineRule(
          node.getAttribute('data-id') ?? '',
          index + 1,
          animationState.iterationCount,
        ),
      ),
    ]
    styleTag.innerHTML = rules.join('\n')
  }
  options.syncOverlayRects()
  return animationState
}
