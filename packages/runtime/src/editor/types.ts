import type {
  AnimationKeyframe,
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import type { PluginFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import type { OldTheme, Theme } from '@nordcraft/core/dist/styling/theme'
import type {
  FormulaHandlerV2,
  PluginAction,
  PluginActionV2,
} from '@nordcraft/core/dist/types'
import type { getRectData } from './overlay'

export type NordcraftPreviewEvent =
  | {
      type: 'style_variant_changed'
      variantIndex: number | null
    }
  | {
      type: 'component'
      component: Component
    }
  | { type: 'components'; components: Component[] }
  | {
      type: 'packages'
      packages: Record<
        string,
        {
          components: Record<string, Component>
          formulas: Record<
            string,
            PluginFormula<FormulaHandlerV2> | PluginFormula<string>
          >
          actions: Record<string, PluginActionV2 | PluginAction>
          manifest: {
            name: string
            // commit represents the commit hash (version) of the package
            commit: string
          }
        }
      >
    }
  | {
      type: 'global_formulas'
      formulas: Record<
        string,
        PluginFormula<FormulaHandlerV2> | PluginFormula<string>
      >
    }
  | {
      type: 'global_actions'
      actions: Record<string, PluginActionV2 | PluginAction>
    }
  | { type: 'theme'; theme: Record<string, OldTheme | Theme> }
  | { type: 'mode'; mode: 'design' | 'test' }
  | { type: 'attrs'; attrs: Record<string, unknown> }
  | { type: 'selection'; selectedNodeId: string | null }
  | { type: 'highlight'; highlightedNodeId: string | null }
  | {
      type: 'click' | 'mousemove' | 'dblclick'
      metaKey: boolean
      x: number
      y: number
    }
  | { type: 'report_document_scroll_size' }
  | { type: 'update_inner_text'; innerText: string }
  | { type: 'reload' }
  | { type: 'fetch_api'; apiKey: string }
  | { type: 'introspect_qraphql_api'; apiKey: string }
  | { type: 'drag-started'; x: number; y: number }
  | { type: 'drag-ended'; canceled?: true }
  | { type: 'keydown'; key: string; altKey: boolean; metaKey: boolean }
  | { type: 'keyup'; key: string; altKey: boolean; metaKey: boolean }
  | {
      type: 'get_computed_style'
      styles?: string[]
    }
  | {
      type: 'set_timeline_keyframes'
      keyframes: Record<string, AnimationKeyframe> | null
    }
  | {
      type: 'set_timeline_time'
      time: number | null
      timingFunction:
        | 'linear'
        | 'ease'
        | 'ease-in'
        | 'ease-out'
        | 'ease-in-out'
        | 'step-start'
        | 'step-end'
        | string
        | undefined
      fillMode: 'none' | 'forwards' | 'backwards' | 'both' | undefined
    }
  | {
      type: 'preview_style'
      styles: Record<string, string> | null
      theme?: {
        key: string
        value: Theme
      }
    }
  | {
      type: 'preview_theme'
      theme: string | null
    }

export type EditorPostMessageType =
  | {
      type: 'textComputedStyle'
      computedStyle: Record<string, string>
    }
  | {
      type: 'selection'
      selectedNodeId: string | null
    }
  | {
      type: 'highlight'
      highlightedNodeId: string | null
    }
  | {
      type: 'navigate'
      name: string
    }
  | {
      type: 'documentScrollSize'
      scrollHeight: number
      scrollWidth: number
    }
  | {
      type: 'nodeMoved'
      copy: boolean
      parent?: string | null
      index?: number
    }
  | {
      type: 'computedStyle'
      computedStyle: Record<string, string>
    }
  | {
      type: 'style'
      time: string
    }
  | {
      type: 'component event'
      event: any
      time: string
      data: any
    }
  | {
      type: 'keydown'
      event: {
        key: string
        metaKey: boolean
        shiftKey: boolean
        altKey: boolean
      }
    }
  | {
      type: 'keyup'
      event: {
        key: string
        metaKey: boolean
        shiftKey: boolean
        altKey: boolean
      }
    }
  | {
      type: 'keypress'
      event: {
        key: string
        metaKey: boolean
        shiftKey: boolean
        altKey: boolean
      }
    }
  | { type: 'data'; data: ComponentData }
  | {
      type: 'selectionRect'
      rect: ReturnType<typeof getRectData>
    }
  | {
      type: 'highlightRect'
      rect: ReturnType<typeof getRectData>
    }
  | {
      type: 'introspectionResult'
      data: any
      apiKey: string
    }

export type DragState = {
  /**
   * Dragging elements within the initial container is a reorder operation while dragging elements outside the initial container is an insert operation.
   * While they share some common properties, we need to differentiate between the two to handle them differently.
   */
  mode: 'reorder' | 'insert'
  elementType: 'element' | 'component' | 'text'
  copy?: HTMLElement
  element: HTMLElement
  repeatedNodes: HTMLElement[]
  offset: Point
  lastCursorPosition: Point
  initialContainer: HTMLElement
  initialNextSibling: Element | null
  initialRect: DOMRect
  reorderPermutations: Array<{
    nextSibling: Node | null
    rect: DOMRect
  }>
  isTransitioning: boolean
  selectedInsertAreaIndex?: number
  insertAreas?: Array<InsertArea>
  destroying: boolean
}

export type InsertArea = {
  layout: 'block' | 'inline'
  parent: Element
  index: number
  center: Point
  size: number
  direction: 1 | -1
}

export type Point = { x: number; y: number }
export type Line = { x1: number; y1: number; x2: number; y2: number }

/**
 * Styles required for rendering the same exact text again somewhere else (on a overlay rect in the editor)
 */
export enum TextNodeComputedStyles {
  // Caret color is important as it is the only visible part of the text node (when text is not highlighted)
  CARET_COLOR = 'caret-color',
  DISPLAY = 'display',
  FONT_FAMILY = 'font-family',
  FONT_SIZE = 'font-size',
  FONT_WEIGHT = 'font-weight',
  FONT_STYLE = 'font-style',
  FONT_VARIANT = 'font-variant',
  FONT_STRETCH = 'font-stretch',
  LINE_HEIGHT = 'line-height',
  TEXT_ALIGN = 'text-align',
  TEXT_TRANSFORM = 'text-transform',
  LETTER_SPACING = 'letter-spacing',
  WHITE_SPACE = 'white-space',
  WORD_SPACING = 'word-spacing',
  TEXT_INDENT = 'text-indent',
  TEXT_OVERFLOW = 'text-overflow',
  TEXT_RENDERING = 'text-rendering',
  WORD_BREAK = 'word-break',
  WORD_WRAP = 'word-wrap',
  DIRECTION = 'direction',
  UNICODE_BIDI = 'unicode-bidi',
  VERTICAL_ALIGN = 'vertical-align',
  FONT_KERNING = 'font-kerning',
  FONT_FEATURE_SETTINGS = 'font-feature-settings',
  FONT_VARIATION_SETTINGS = 'font-variation-settings',
  FONT_SMOOTHING = '-webkit-font-smoothing',
  ANTI_ALIASING = '-moz-osx-font-smoothing',
  FONT_OPTICAL_SIZING = 'font-optical-sizing',
  TAB_SIZE = 'tab-size',
  HYPHENS = 'hyphens',
  TEXT_ORIENTATION = 'text-orientation',
  WRITING_MODE = 'writing-mode',
  LINE_BREAK = 'line-break',
  OVERFLOW_WRAP = 'overflow-wrap',
}
