import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import '../happydom'
import {
  getBorderLengths,
  getChain,
  getElementComputedStyles,
  getPaddingLengths,
  getTransformStyles,
  handleGetComputedStyle,
  roundCssValue,
} from './editorUtils'
import type { EditorPostMessageType } from './types'

describe('editorUtils', () => {
  const originalPostMessage = window.parent.postMessage
  let postedMessages: EditorPostMessageType[] = []

  beforeEach(() => {
    postedMessages = []
    window.parent.postMessage = ((msg: EditorPostMessageType) => {
      postedMessages.push(msg)
    }) as typeof window.parent.postMessage
  })

  afterEach(() => {
    window.parent.postMessage = originalPostMessage
    document.body.innerHTML = ''
  })

  test('roundCssValue preserves negative signs and rounds fractional values to 2 decimals', () => {
    expect({
      negativePx: roundCssValue('-42.567px'),
      negativeHalf: roundCssValue('-10.5px'),
      positivePx: roundCssValue('15.234px'),
      negativeInt: roundCssValue('-80px'),
      multiValue: roundCssValue('-5.5px 10.126px -0.25px 0px'),
      percentage: roundCssValue('-33.333%'),
      keyword: roundCssValue('auto'),
    }).toEqual({
      negativePx: '-42.57px',
      negativeHalf: '-10.5px',
      positivePx: '15.23px',
      negativeInt: '-80px',
      multiValue: '-5.5px 10.13px -0.25px 0px',
      percentage: '-33.33%',
      keyword: 'auto',
    })
  })

  test('getElementComputedStyles and handleGetComputedStyle preserve negative fractional pixel values', () => {
    document.body.innerHTML = `
      <div id="App">
        <div
          data-id="0.0"
          style="
            position: absolute;
            left: -42.567px;
            top: -10.5px;
            right: 15.234px;
            bottom: -80px;
            margin: -5.5px 10.126px -0.25px 0px;
          "
        ></div>
      </div>
    `
    const el = document.querySelector('[data-id="0.0"]')!
    const styles = ['left', 'top', 'right', 'bottom', 'margin']

    const directStyles = getElementComputedStyles(el, styles)
    handleGetComputedStyle('0.0', styles, null)

    expect({
      directStyles,
      postedMessages,
    }).toEqual({
      directStyles: {
        left: '-42.57px',
        top: '-10.5px',
        right: '15.23px',
        bottom: '-80px',
        margin: '-5.5px 10.13px -0.25px 0px',
      },
      postedMessages: [
        {
          type: 'computedStyle',
          computedStyle: {
            left: '-42.57px',
            top: '-10.5px',
            right: '15.23px',
            bottom: '-80px',
            margin: '-5.5px 10.13px -0.25px 0px',
          },
          repeatedItemsValues: [],
          timelineTime: {
            delay: '0s',
            duration: '0s',
          },
        },
      ] satisfies EditorPostMessageType[],
    })
  })

  test('getBorderLengths, getPaddingLengths, getTransformStyles, and getChain extract DOM style and ancestry metadata', () => {
    document.body.innerHTML = `
      <div id="App">
        <div
          data-id="0"
          style="
            border-top-width: 1px;
            border-right-width: 2px;
            border-bottom-width: 3px;
            border-left-width: 4px;
            padding-top: 5px;
            padding-right: 6px;
            padding-bottom: 7px;
            padding-left: 8px;
            transform: rotate(10deg);
          "
        >
          <div data-id="0.0"></div>
        </div>
      </div>
    `
    const parent = document.querySelector('[data-id="0"]')!
    const child = document.querySelector('[data-id="0.0"]')!
    const style = window.getComputedStyle(parent)

    expect({
      border: getBorderLengths(style),
      padding: getPaddingLengths(style),
      transforms: getTransformStyles(parent),
      chainIds: getChain(child).map(
        (el) => el.getAttribute('data-id') || el.id || el.tagName.toLowerCase(),
      ),
    }).toEqual({
      border: ['1px', '2px', '3px', '4px'],
      padding: ['5px', '6px', '7px', '8px'],
      transforms: {
        transform: 'rotate(10deg)',
        rotate: 'none',
        scale: 'none',
        translate: 'none',
      },
      chainIds: ['0.0', '0', 'App', 'body'],
    })
  })
})
