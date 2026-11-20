import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import '../happydom'
import { watchPreviewMedia } from './previewMedia'

const waitForMutations = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('watchPreviewMedia', () => {
  let appElement: HTMLDivElement
  let stopWatching: (() => void) | undefined

  beforeEach(() => {
    document.body.innerHTML =
      '<div id="App"><img id="initial" loading="lazy" alt="" /></div>'
    appElement = document.getElementById('App') as HTMLDivElement
  })

  afterEach(() => {
    stopWatching?.()
    stopWatching = undefined
    document.body.innerHTML = ''
  })

  test('loads lazy images that are already in the page straight away', () => {
    stopWatching = watchPreviewMedia(appElement, () => {})

    expect(document.getElementById('initial')?.getAttribute('loading')).toBe(
      'eager',
    )
  })

  test('loads lazy images and iframes that are added later straight away', async () => {
    stopWatching = watchPreviewMedia(appElement, () => {})

    const container = document.createElement('div')
    container.innerHTML =
      '<img id="nested" loading="lazy" alt="" /><iframe id="frame" loading="lazy"></iframe>'
    const image = document.createElement('img')
    image.id = 'direct'
    image.setAttribute('loading', 'lazy')
    appElement.append(container, image)
    await waitForMutations()

    expect(document.getElementById('nested')?.getAttribute('loading')).toBe(
      'eager',
    )
    expect(document.getElementById('frame')?.getAttribute('loading')).toBe(
      'eager',
    )
    expect(document.getElementById('direct')?.getAttribute('loading')).toBe(
      'eager',
    )
  })

  test('loads images straight away when they are changed to lazy', async () => {
    stopWatching = watchPreviewMedia(appElement, () => {})

    const image = document.getElementById('initial')!
    image.setAttribute('loading', 'lazy')
    await waitForMutations()

    expect(image.getAttribute('loading')).toBe('eager')
  })

  test('calls onMediaLoaded when media in the page loads or fails', () => {
    const onMediaLoaded = mock(() => {})
    stopWatching = watchPreviewMedia(appElement, onMediaLoaded)

    const image = document.getElementById('initial')!
    image.dispatchEvent(new Event('load'))
    image.dispatchEvent(new Event('error'))

    expect(onMediaLoaded).toHaveBeenCalledTimes(2)
  })

  test('ignores load events from elements that are not media', () => {
    const onMediaLoaded = mock(() => {})
    stopWatching = watchPreviewMedia(appElement, onMediaLoaded)

    const div = document.createElement('div')
    appElement.appendChild(div)
    div.dispatchEvent(new Event('load'))

    expect(onMediaLoaded).not.toHaveBeenCalled()
  })

  test('stops watching after cleanup', async () => {
    const onMediaLoaded = mock(() => {})
    watchPreviewMedia(appElement, onMediaLoaded)()

    const image = document.createElement('img')
    image.setAttribute('loading', 'lazy')
    appElement.appendChild(image)
    await waitForMutations()
    image.dispatchEvent(new Event('load'))

    expect(image.getAttribute('loading')).toBe('lazy')
    expect(onMediaLoaded).not.toHaveBeenCalled()
  })
})
