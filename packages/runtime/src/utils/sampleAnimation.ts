import type { AnimationKeyframe } from '@nordcraft/core/dist/component/component.types'
import { postMessageToEditor } from '../editor/postMessageToEditor'

const POSITION_SAMPLES_PER_STEP = 4

/**
 * Get 101 points along the animation timeline (from 0 to 1 in steps of 0.01).
 * Depending on the rules of the keyframes, the sample includes:
 * - __boundingClientRect: Calculated client rects
 * - Each CSS property (rule) found in the keyframes: Calculated style values
 */
export function sampleAnimation(
  keyframes: Record<string, AnimationKeyframe>,
  element: HTMLElement,
): Record<
  string,
  (
    | number
    | string
    | {
        x: number
        y: number
        width: number
        height: number
        keyframes?: AnimationKeyframe[]
      }
  )[]
> {
  const originalPosition = element.style.getPropertyValue(
    '--editor-timeline-position',
  )

  // Extract unique CSS property names from the keyframes
  const keyframeKeys = Array.from(
    new Set(Object.values(keyframes).map((kf) => kf.key)),
  )
  const keyframeByPosition = Object.values(keyframes).reduce(
    (acc, kf) => {
      const position =
        Math.round(kf.position * POSITION_SAMPLES_PER_STEP * 100) /
        (POSITION_SAMPLES_PER_STEP * 100)
      acc[position] = acc[position] || []
      acc[position].push(kf)
      return acc
    },
    {} as Record<number, AnimationKeyframe[]>,
  )

  const result: Record<string, any[]> = {
    __boundingClientRect: [],
  }

  for (const key of keyframeKeys) {
    result[key] = []
  }

  const computedStyle = window.getComputedStyle(element)

  for (let i = 0; i <= 100 * POSITION_SAMPLES_PER_STEP; i++) {
    const time = i / (100 * POSITION_SAMPLES_PER_STEP)
    element.style.setProperty('--editor-timeline-position', `${time}s`)

    const { x, y, width, height } = element.getBoundingClientRect()
    result.__boundingClientRect.push({
      x,
      y,
      width,
      height,
      keyframes: keyframeByPosition[time],
    })

    // Capture each keyframe property's calculated value
    if (i % POSITION_SAMPLES_PER_STEP === 0) {
      for (const key of keyframeKeys) {
        result[key].push(computedStyle.getPropertyValue(key))
      }
    }
  }

  // Restore original position
  if (originalPosition) {
    element.style.setProperty('--editor-timeline-position', originalPosition)
  } else {
    element.style.removeProperty('--editor-timeline-position')
  }

  return result
}

let animationFrameRequested = false
// Will request the sample on the next animation frame (throttled to once per frame)
export function requestSampleAnimation(
  keyframes: Record<string, AnimationKeyframe>,
  element: HTMLElement,
) {
  if (animationFrameRequested) {
    return
  }
  animationFrameRequested = true
  requestAnimationFrame(() => {
    const animationSample = sampleAnimation(keyframes, element)
    postMessageToEditor({
      type: 'animationSample',
      sample: animationSample,
    })

    animationFrameRequested = false
  })
}
