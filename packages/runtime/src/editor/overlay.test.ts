import { describe, expect, test } from 'bun:test'
import '../happydom'
import { getRectData } from './overlay'

describe('getRectData()', () => {
  test('it returns null if node is null', () => {
    expect(getRectData(null)).toBeNull()
  })

  test('it returns rect data for standard block elements', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    // Mock getBoundingClientRect
    el.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      right: 110,
      bottom: 70,
      width: 100,
      height: 50,
      x: 10,
      y: 20,
      toJSON: () => {},
    })

    const data = getRectData(el)
    expect(data).not.toBeNull()
    expect(data!.width).toBe(100)
    expect(data!.height).toBe(50)
    expect(data!.left).toBe(10)
    expect(data!.top).toBe(20)

    document.body.removeChild(el)
  })

  test('it uses Range bounding box for span (inline) elements containing text', () => {
    const span = document.createElement('span')
    span.textContent = 'Hello world'
    span.style.display = 'inline'
    document.body.appendChild(span)

    // Mock getBoundingClientRect for range
    const mockRangeRect = {
      left: 15,
      top: 25,
      right: 95,
      bottom: 45,
      width: 80,
      height: 20,
      x: 15,
      y: 25,
      toJSON: () => {},
    }

    // Mock Range object
    const originalCreateRange = document.createRange
    document.createRange = () => {
      const range = originalCreateRange.call(document)
      range.getBoundingClientRect = () => mockRangeRect
      return range
    }

    const data = getRectData(span)
    expect(data).not.toBeNull()
    expect(data!.width).toBe(80)
    expect(data!.height).toBe(20)
    expect(data!.left).toBe(15)
    expect(data!.top).toBe(25)

    // Restore Range mock
    document.createRange = originalCreateRange
    document.body.removeChild(span)
  })

  test('it correctly positions elements with rotation using inverse matrix representation', () => {
    const parent = document.createElement('div')
    const child = document.createElement('span')
    parent.appendChild(child)
    document.body.appendChild(parent)

    // Let's mock getComputedStyle for parent to return a rotated state
    const originalGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = (el) => {
      if (el === parent) {
        return {
          ...originalGetComputedStyle(el),
          transform: 'matrix(0.866025, 0.5, -0.5, 0.866025, 0, 0)', // cos(30) = 0.866025, sin(30) = 0.5
          rotate: 'none',
        } as any
      }
      return originalGetComputedStyle(el)
    }

    // Let's mock getBoundingClientRect of child as the rotated box of some unrotated 100x50 element
    // Rotated by 30 degrees, unrotated center is at (100, 100).
    // So unrotated box is 50 to 150 on X, 75 to 125 on Y.
    // The rotated bounding box will be wider and taller. Let's calculate its rotated bounds:
    // cx = 100, cy = 100
    // width_unrotated = 100, height_unrotated = 50
    // w = 100, h = 50
    // W = w * cos(30) + h * sin(30) = 100 * 0.866025 + 50 * 0.5 = 86.6025 + 25 = 111.6025
    // H = w * sin(30) + h * cos(30) = 100 * 0.5 + 50 * 0.866025 = 50 + 43.30125 = 93.30125
    child.getBoundingClientRect = () => ({
      left: 100 - 111.6025 / 2, // 100 - 55.80125 = 44.19875
      top: 100 - 93.30125 / 2, // 100 - 46.650625 = 53.349375
      right: 100 + 111.6025 / 2,
      bottom: 100 + 93.30125 / 2,
      width: 111.6025,
      height: 93.30125,
      x: 100 - 111.6025 / 2,
      y: 100 - 93.30125 / 2,
      toJSON: () => {},
    })

    const data = getRectData(child)

    // Restore mock
    window.getComputedStyle = originalGetComputedStyle
    document.body.removeChild(parent)

    expect(data).not.toBeNull()
    // The calculated unrotated box width and height should be extremely close to 100 and 50 respectively
    expect(Math.abs(data!.width - 100)).toBeLessThan(0.1)
    expect(Math.abs(data!.height - 50)).toBeLessThan(0.1)
    expect(Math.abs(data!.left - 50)).toBeLessThan(0.1)
    expect(Math.abs(data!.top - 75)).toBeLessThan(0.1)
  })
})
