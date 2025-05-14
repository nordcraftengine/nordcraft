/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable no-case-declarations */
/* eslint-disable no-fallthrough */
import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type {
  AnimationKeyframe,
  Component,
  ComponentData,
  MetaEntry,
} from '@nordcraft/core/dist/component/component.types'
import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import type {
  FormulaContext,
  ToddleEnv,
} from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import type { PluginFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { getClassName } from '@nordcraft/core/dist/styling/className'
import type { OldTheme, Theme } from '@nordcraft/core/dist/styling/theme'
import { getThemeCss } from '@nordcraft/core/dist/styling/theme'
import { theme } from '@nordcraft/core/dist/styling/theme.const'
import type {
  ActionHandler,
  ArgumentInputDataFunction,
  FormulaHandler,
  FormulaHandlerV2,
  PluginActionV2,
  Toddle,
} from '@nordcraft/core/dist/types'
import { mapObject, omitKeys } from '@nordcraft/core/dist/utils/collections'
import * as libActions from '@nordcraft/std-lib/dist/actions'
import * as libFormulas from '@nordcraft/std-lib/dist/formulas'
import fastDeepEqual from 'fast-deep-equal'
import { createLegacyAPI } from './api/createAPI'
import { createAPI } from './api/createAPIv2'
import { createNode } from './components/createNode'
import { isContextProvider } from './context/isContextProvider'
import { dragEnded } from './editor/drag-drop/dragEnded'
import { dragMove } from './editor/drag-drop/dragMove'
import { dragReorder } from './editor/drag-drop/dragReorder'
import { dragStarted } from './editor/drag-drop/dragStarted'
import type { DragState } from './editor/types'
import { handleAction } from './events/handleAction'
import type { Signal } from './signal/signal'
import { signal } from './signal/signal'
import { insertStyles, styleToCss } from './styles/style'
import type {
  ComponentContext,
  LocationSignal,
  PreviewShowSignal,
} from './types'
import { createFormulaCache } from './utils/createFormulaCache'
import { getNodeAndAncestors, isNodeOrAncestorConditional } from './utils/nodes'
import { omitSubnodeStyleForComponent } from './utils/omitStyle'
import { rectHasPoint } from './utils/rectHasPoint'

type ToddlePreviewEvent =
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
          manifest: {
            name: string
            // commit represents the commit hash (version) of the package
            commit: string
          }
        }
      >
    }
  | { type: 'theme'; theme: Theme | OldTheme }
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
  | { type: 'drag-started'; x: number; y: number }
  | { type: 'drag-ended'; canceled?: true }
  | { type: 'keydown'; key: string; altKey: boolean; metaKey: boolean }
  | { type: 'keyup'; key: string; altKey: boolean; metaKey: boolean }
  | {
      type: 'get_computed_style'
      styles: string[]
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
  | { type: 'preview_style'; styles: Record<string, string> | null }

/**
 * Styles required for rendering the same exact text again somewhere else (on a overlay rect in the editor)
 */
enum TextNodeComputedStyles {
  // Caret color is important as it is the only visible part of the text node (when text is not highlighted)
  CARET_COLOR = 'caret-color',
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
}

let env: ToddleEnv

export const initGlobalObject = ({
  formulas,
  actions,
}: {
  formulas: Record<string, Record<string, PluginFormula<FormulaHandlerV2>>>
  actions: Record<string, Record<string, PluginActionV2>>
}) => {
  env = {
    isServer: false,
    branchName: window.__toddle.branch,
    request: undefined,
    runtime: 'preview',
    logErrors: true,
  }
  window.toddle = (() => {
    const legacyActions: Record<string, ActionHandler> = {}
    const legacyFormulas: Record<string, FormulaHandler> = {}
    const argumentInputDataList: Record<string, ArgumentInputDataFunction> = {}
    const toddle: Toddle<LocationSignal, PreviewShowSignal> = {
      isEqual: fastDeepEqual,
      errors: [],
      formulas,
      actions,
      registerAction: (name, handler) => {
        if (legacyActions[name]) {
          console.error('There already exists an action with the name ', name)
          return
        }
        legacyActions[name] = handler
      },
      getAction: (name) => legacyActions[name],
      registerFormula: (name, handler, getArgumentInputData) => {
        if (legacyFormulas[name]) {
          console.error('There already exists a formula with the name ', name)
          return
        }
        legacyFormulas[name] = handler
        if (getArgumentInputData) {
          argumentInputDataList[name] = getArgumentInputData
        }
      },
      getFormula: (name) => legacyFormulas[name],
      getCustomAction: (name, packageName) => {
        return (
          toddle.actions[packageName ?? window.__toddle.project]?.[name] ??
          toddle.actions[window.__toddle.project]?.[name]
        )
      },
      getCustomFormula: (name, packageName) => {
        return (
          toddle.formulas[packageName ?? window.__toddle.project]?.[name] ??
          toddle.formulas[window.__toddle.project]?.[name]
        )
      },
      // eslint-disable-next-line max-params
      getArgumentInputData: (formulaName, args, argIndex, data) =>
        argumentInputDataList[formulaName]?.(args, argIndex, data) || data,
      data: {},
      eventLog: [],
      project: window.__toddle.project,
      branch: window.__toddle.branch,
      commit: window.__toddle.commit,
      components: window.__toddle.components,
      pageState: window.__toddle.pageState,
      locationSignal: signal<any>({
        query: {},
        params: {},
      }),
      env,
    }
    return toddle
  })()

  // load default formulas and actions
  Object.entries(libFormulas).forEach(([name, module]) =>
    window.toddle.registerFormula(
      '@toddle/' + name,
      module.default as FormulaHandler,
      'getArgumentInputData' in module
        ? module.getArgumentInputData
        : undefined,
    ),
  )
  Object.entries(libActions).forEach(([name, module]) =>
    window.toddle.registerAction('@toddle/' + name, module.default),
  )
}

// imported by "/.toddle/preview" (see worker/src/preview.ts)
export const createRoot = (
  domNode: HTMLElement | null = document.getElementById('App'),
) => {
  if (!domNode) {
    throw new Error('Cant find root domNode')
  }
  const isInputTarget = (event: Event) => {
    const target = event.target
    if (target instanceof HTMLElement) {
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'STYLE-EDITOR'
      ) {
        return true
      }
      if (target.contentEditable?.toLocaleLowerCase() === 'true') {
        return true
      }
    }
    return false
  }

  insertTheme(document.head, theme)
  const dataSignal = signal<ComponentData>({
    Location: {
      query: {},
      params: {},
      page: '/',
      path: '/',
      hash: '',
    },
    Attributes: {},
    Variables: {},
  })
  let ctxDataSignal: Signal<ComponentData> | undefined

  let ctx: ComponentContext | null = null
  let mode: 'design' | 'test' = 'design'
  // Signal for overriding conditional elements when they're
  // selected in design mode and for reverting back to normal
  // in test mode
  const showSignal = signal<{ displayedNodes: string[]; testMode: boolean }>({
    displayedNodes: [],
    testMode: false,
  })
  window.toddle._preview = { showSignal }
  document.body.setAttribute('data-mode', 'design')
  let components: Component[] | null = null
  let packageComponents: Component[] | null = null
  const getAllComponents = () => [
    ...(components ?? []),
    ...(packageComponents ?? []),
  ]
  let component: Component | null = null
  let selectedNodeId: string | null = null
  let highlightedNodeId: string | null = null
  let styleVariantSelection: {
    nodeId: string
    styleVariantIndex: number
  } | null = null
  let routeSignal: Signal<any> | null = null
  let dragState: DragState | null = null
  let animationState: {
    animatedElementId: string | null
    time: number | null
    timingFunction?: string
    fillMode?: string
  } | null = null
  let altKey = false
  let metaKey = false
  let previewStyleAnimationFrame = -1
  let timelineTimeAnimationFrame = -1

  /**
   * Modifies all link nodes on a component
   * NOTE: alters in place
   */
  const updateComponentLinks = (component: Component) => {
    // Find all links and add target="_blank" to them
    Object.entries(component.nodes ?? {}).forEach(([_, node]) => {
      if (node.type === 'element' && node.tag === 'a') {
        node.attrs['target'] = valueFormula('_blank')
      }
    })
    return component
  }

  window.addEventListener(
    'message',
    (message: MessageEvent<ToddlePreviewEvent>) => {
      if (!message.isTrusted) {
        console.error('UNTRUSTED MESSAGE')
      }
      switch (message.data?.type) {
        case 'component': {
          if (!message.data.component) {
            return
          }
          if (message.data.component.name != component?.name) {
            showSignal.cleanSubscribers()
          }

          component = updateComponentLinks(message.data.component)

          if (components && packageComponents && ctx) {
            // Since we're not receiving the current component in
            // "components" updates (see `SetupCanvas` action)
            // we need to manually update the component in components
            const componentIndex = components.findIndex(
              (c) => c.name === component!.name,
            )
            if (componentIndex !== -1) {
              components[componentIndex] = component
            } else {
              components.push(component)
            }
            ctx.components = getAllComponents()
          }

          dataSignal.update((data) => {
            const newData: ComponentData = {
              ...data,
              Location: data.Location
                ? {
                    ...data.Location,
                    path: component?.page ?? '',
                  }
                : undefined,
              // Ensure that URL parameters are only available for pages and not components
              'URL parameters': component?.route
                ? data['URL parameters']
                : undefined,
            }
            return newData
          })

          update()

          if (selectedNodeId) {
            if (styleVariantSelection) {
              updateSelectedStyleVariant(
                styleVariantSelection.styleVariantIndex,
              )
            }
          }

          break
        }
        case 'components': {
          if (Array.isArray(message.data.components)) {
            components = (message.data.components as Component[]).map(
              updateComponentLinks,
            )
            const allComponents = getAllComponents()
            if (ctx) {
              ctx.components = allComponents
            }

            updateStyle()
            update()
          }

          break
        }
        case 'packages': {
          if (message.data.packages) {
            packageComponents = Object.values(message.data.packages ?? {})
              .flatMap((p) =>
                Object.values(p.components).map((c) => ({
                  ...c,
                  name: `${p.manifest.name}/${c.name}`,
                })),
              )
              .map(updateComponentLinks)

            const allComponents = getAllComponents()
            if (ctx) {
              ctx.components = allComponents
            }

            updateStyle()
            update()
          }

          break
        }
        case 'theme': {
          insertTheme(document.head, message.data.theme)
          break
        }
        case 'mode': {
          mode = message.data.mode
          document.body.setAttribute('data-mode', message.data.mode)
          updateConditionalElements()
          break
        }
        case 'attrs': {
          if (
            message.data.attrs &&
            fastDeepEqual(message.data.attrs, dataSignal.get().Attributes) ===
              false
          ) {
            const attrs = message.data.attrs
            dataSignal.update((data) => {
              // TODO: We should figure out if "Props" is used anywhere and get rid of it if it's not
              const newData: ComponentData & {
                Props: Record<string, unknown>
              } = {
                ...data,
                Location:
                  data.Location && component?.page
                    ? {
                        ...data.Location,
                        query: attrs as Record<string, string>,
                      }
                    : data.Location,
                Props: attrs ?? {},
              }
              return newData
            })
          }
          break
        }
        case 'selection': {
          if (selectedNodeId !== message.data.selectedNodeId) {
            selectedNodeId = message.data.selectedNodeId ?? null
            clearSelectedStyleVariant()

            updateConditionalElements()

            const node = getDOMNodeFromNodeId(selectedNodeId)
            const element =
              component?.nodes[node?.getAttribute('data-node-id') ?? '']
            if (
              node &&
              element &&
              element.type === 'text' &&
              element.value.type === 'value'
            ) {
              const computedStyle = window.getComputedStyle(node)
              window.parent?.postMessage(
                {
                  type: 'textComputedStyle',
                  computedStyle: Object.fromEntries(
                    Object.values(TextNodeComputedStyles).map((style) => [
                      style,
                      computedStyle.getPropertyValue(style),
                    ]),
                  ),
                },
                '*',
              )
            } else if (node && node.getAttribute('data-node-type') !== 'text') {
              // Reset computed style on blur
              window.parent?.postMessage(
                {
                  type: 'textComputedStyle',
                  computedStyle: {},
                },
                '*',
              )
            }
          }
          return
        }
        case 'update_inner_text': {
          const { innerText } = message.data
          const selectedNode = getDOMNodeFromNodeId(selectedNodeId)
          if (
            selectedNode &&
            selectedNode.getAttribute('data-node-type') === 'text'
          ) {
            ;(selectedNode as HTMLElement).innerText = innerText
          }
          return
        }
        case 'highlight': {
          highlightedNodeId = message.data.highlightedNodeId ?? null
          return
        }
        case 'mousemove':
          if (dragState && !dragState.destroying) {
            const { x, y } = message.data
            dragState.lastCursorPosition = { x, y }
            const draggingInsideContainer = rectHasPoint(
              dragState.initialContainer.getBoundingClientRect(),
              { x, y },
            )

            // Move the element towards the cursor when out of bounds
            const rect = dragState.element.getBoundingClientRect()
            if (!rectHasPoint(rect, { x, y })) {
              dragState.offset.x -= (x - (rect.left + rect.width / 2)) * 0.1
              dragState.offset.y -= (y - (rect.top + rect.height / 2)) * 0.1
            }

            if (draggingInsideContainer && !metaKey) {
              dragReorder(dragState)
            } else {
              dragMove(
                dragState,
                metaKey
                  ? [dragState.element]
                  : [dragState.element, dragState.initialContainer],
              )
            }
            dragState.element.style.setProperty(
              'translate',
              `${x - dragState.offset.x}px ${y - dragState.offset.y}px`,
            )
            return
          }
        case 'click':
        case 'dblclick':
          if (mode === 'test' || !component) {
            return
          }
          const { x, y, type } = message.data
          const elementsAtPoint = document.elementsFromPoint(x, y)
          let element = elementsAtPoint.find((elem) => {
            const id = elem.getAttribute('data-id')
            if (
              typeof id !== 'string' ||
              component === null ||
              elem.getAttribute('data-component')
            ) {
              return false
            }
            const nodeId = getNodeId(component, id.split('.').slice(1))
            const node = nodeId ? component?.nodes[nodeId] : undefined
            if (!node) {
              return false
            }
            if (elem.getAttribute('data-node-type') === 'text') {
              return (
                // Select text nodes if the meta key is pressed or the text node is double-clicked
                metaKey ||
                type === 'dblclick' ||
                // Select text nodes if the selected node is a text node. This is useful as the user is likely in a text editing mode
                getDOMNodeFromNodeId(selectedNodeId)?.getAttribute(
                  'data-node-type',
                ) === 'text'
              )
            }
            return true
          })

          // Bubble selection to the topmost parent that has the exact same size as the element.
          // This is important for drag and drop as you are often left with childless parents after dragging.
          while (
            element?.parentElement &&
            element.getAttribute('data-node-id') !== 'root' &&
            fastDeepEqual(
              element.getBoundingClientRect().toJSON(),
              element.parentElement.getBoundingClientRect().toJSON(),
            ) &&
            element.getAttribute('data-node-type') !== 'text'
          ) {
            element = element.parentElement
          }

          const id = element?.getAttribute('data-id') ?? null
          if (type === 'click' && id !== selectedNodeId) {
            if (message.data.metaKey) {
              // Figure out if the clicked element is a text element
              // or if one of its descendants is a text element
              const root = component.nodes.root
              if (root && id) {
                const nodeLookup = getNodeAndAncestors(component, root, id)
                if (nodeLookup?.node.type === 'text') {
                  window.parent?.postMessage(
                    {
                      type: 'selection',
                      selectedNodeId: id,
                    },
                    '*',
                  )
                } else {
                  const firstTextChild =
                    nodeLookup?.node.type === 'element'
                      ? nodeLookup.node.children.find(
                          (c) => component?.nodes[c]?.type === 'text',
                        )
                      : undefined
                  if (firstTextChild) {
                    window.parent?.postMessage(
                      {
                        type: 'selection',
                        selectedNodeId: `${id}.0`,
                      },
                      '*',
                    )
                  }
                }
              }
            } else {
              window.parent?.postMessage(
                {
                  type: 'selection',
                  selectedNodeId: id,
                },
                '*',
              )
            }
          } else if (type === 'mousemove' && id !== highlightedNodeId) {
            window.parent?.postMessage(
              {
                type: 'highlight',
                highlightedNodeId: id,
              },
              '*',
            )
          } else if (
            type === 'dblclick' &&
            id &&
            // We only allow dblclick --> navigation if we're not in test mode
            mode === 'design'
          ) {
            // Figure out if the clicked element is a component
            const root = component.nodes.root
            if (root) {
              const nodeLookup = getNodeAndAncestors(component, root, id)
              if (
                nodeLookup?.node.type === 'component' &&
                nodeLookup.node.name
              ) {
                window.parent?.postMessage(
                  {
                    type: 'navigate',
                    name: nodeLookup.node.name,
                  },
                  '*',
                )
              }
              // Double click on text node should select the text node for editing
              else if (nodeLookup?.node.type === 'text') {
                window.parent?.postMessage(
                  {
                    type: 'selection',
                    selectedNodeId: id,
                  },
                  '*',
                )
              }
            }
          }
          break
        case 'style_variant_changed':
          const { variantIndex } = message.data
          updateSelectedStyleVariant(variantIndex)
          break
        // We request manually instead of automatic to avoid mutation observer spam.
        // Also, reporting automatically proved unreliable when elements' height was in %
        case 'report_document_scroll_size':
          window.parent?.postMessage(
            {
              type: 'documentScrollSize',
              scrollHeight: domNode.scrollHeight,
              scrollWidth: domNode.scrollWidth,
            },
            '*',
          )
          break
        case 'reload':
          window.location.reload()
          break
        case 'fetch_api':
          const { apiKey } = message.data
          dataSignal.update((data) => ({
            ...data,
            Apis: {
              ...data.Apis,
              [apiKey]: {
                isLoading: true,
                data: null,
                error: null,
              },
            },
          }))
          ctx?.apis[apiKey]?.fetch({})
          break
        case 'drag-started':
          const draggedElement = getDOMNodeFromNodeId(selectedNodeId)
          if (!draggedElement || !draggedElement.parentElement) {
            return
          }
          const repeatedNodes = Array.from(
            draggedElement.parentElement.children,
          ).filter(
            (node) =>
              node instanceof HTMLElement &&
              node.getAttribute('data-id')?.startsWith(selectedNodeId + '('),
          ) as HTMLElement[]
          dragState = dragStarted({
            element: draggedElement as HTMLElement,
            lastCursorPosition: { x: message.data.x, y: message.data.y },
            repeatedNodes,
            asCopy: altKey,
          })
          if (altKey) {
            const nextRect = dragState.element.getBoundingClientRect()
            dragState.offset.x += nextRect.left - dragState.initialRect.left
            dragState.offset.y += nextRect.top - dragState.initialRect.top
          }

          break
        case 'drag-ended':
          switch (dragState?.mode) {
            case 'reorder':
              const parentDataId =
                dragState?.initialContainer.getAttribute('data-id')
              const parentNodeId =
                dragState?.initialContainer.getAttribute('data-node-id')
              if (!parentDataId || !parentNodeId) {
                return
              }

              const nextSibling = dragState?.element.nextElementSibling
              const nextSiblingId = parseInt(
                nextSibling?.getAttribute('data-id')?.split('.').at(-1) ?? '',
              )

              const rect = dragState?.element?.getBoundingClientRect()
              if (
                rect &&
                !message.data.canceled &&
                (nextSibling !== dragState?.initialNextSibling ||
                  dragState?.copy)
              ) {
                void dragEnded(dragState, false).then(() => {
                  window.parent?.postMessage(
                    {
                      type: 'nodeMoved',
                      copy: Boolean(dragState?.copy),
                      parent: parentDataId,
                      index: !isNaN(nextSiblingId)
                        ? nextSiblingId
                        : component?.nodes[parentNodeId]?.children?.length,
                    },
                    '*',
                  )
                  dragState = null
                })
              } else {
                void dragEnded(dragState, true).then(() => {
                  dragState = null
                })
              }
              break
            case 'insert':
              const selectedPermutation =
                dragState?.insertAreas?.[
                  dragState?.selectedInsertAreaIndex ?? -1
                ]
              if (selectedPermutation && !message.data.canceled) {
                void dragEnded(dragState, false).then(() => {
                  window.parent?.postMessage(
                    {
                      type: 'nodeMoved',
                      copy: Boolean(dragState?.copy),
                      parent:
                        selectedPermutation?.parent.getAttribute('data-id'),
                      index: selectedPermutation?.index,
                    },
                    '*',
                  )
                  dragState = null
                })
              } else {
                void dragEnded(dragState, true).then(() => {
                  dragState = null
                })
              }
              break
          }
          break
        case 'keydown':
        case 'keyup':
          // If the `altKey` is pressed/released and the user is currently dragging, then restart the drag with/without a copy.
          if (
            dragState &&
            !dragState.destroying &&
            message.data.altKey !== altKey
          ) {
            const asCopy = message.data.altKey
            const prevRect = dragState.element.getBoundingClientRect()
            void dragEnded(dragState, true).then(() => {
              if (!dragState) return
              dragState = dragStarted({
                element: dragState.element,
                lastCursorPosition: dragState.lastCursorPosition,
                repeatedNodes: dragState.repeatedNodes,
                asCopy,
                initialContainer: dragState.initialContainer,
                initialNextSibling: dragState.initialNextSibling,
              })
              const nextRect = dragState.element.getBoundingClientRect()
              dragState.offset.x += nextRect.left - prevRect.left
              dragState.offset.y += nextRect.top - prevRect.top
            })
          }
          altKey = message.data.altKey
          metaKey = message.data.metaKey
          break

        case 'get_computed_style':
          const selectedNode = getDOMNodeFromNodeId(selectedNodeId)
          if (!selectedNode) {
            return
          }

          const { styles } = message.data
          const computedStyle = window.getComputedStyle(selectedNode)
          window.parent?.postMessage(
            {
              type: 'computedStyle',
              computedStyle: Object.fromEntries(
                styles.map((style) => [
                  style,
                  computedStyle.getPropertyValue(style),
                ]),
              ),
            },
            '*',
          )
          break

        case 'set_timeline_keyframes':
          const { keyframes } = message.data
          document.head.querySelector('[data-timeline-keyframes]')?.remove()
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
        `${position * 100}% {
          ${key}: ${value};
          ${easing ? `animation-timing-function: ${easing};` : ''}
        }`,
    )
    .join('\n')}
}`),
          )
          styleElem.setAttribute('data-timeline-keyframes', '')
          document.head.appendChild(styleElem)
          break

        case 'set_timeline_time':
          const { time, timingFunction, fillMode } = message.data
          cancelAnimationFrame(timelineTimeAnimationFrame)
          timelineTimeAnimationFrame = requestAnimationFrame(() => {
            const animatedElementChanged =
              animationState?.animatedElementId !== selectedNodeId
            animationState = {
              animatedElementId: time !== null ? selectedNodeId : null,
              time,
              timingFunction,
              fillMode,
            }

            // Cleanup on null
            if (time === null) {
              document.head
                .querySelector('[data-id="preview-animation-styles"]')
                ?.remove()
              document.body.style.removeProperty('--editor-timeline-position')
              document.body.style.removeProperty(
                '--editor-timeline-timing-function',
              )
              document.body.style.removeProperty('--editor-timeline-fill-mode')
              update()
              return
            }

            document.body.style.setProperty(
              '--editor-timeline-position',
              `${time}s`,
            )
            document.body.style.setProperty(
              '--editor-timeline-timing-function',
              timingFunction ?? 'ease',
            )
            document.body.style.setProperty(
              '--editor-timeline-fill-mode',
              fillMode ?? 'none',
            )

            if (animatedElementChanged) {
              let styleTag = document.head.querySelector(
                '[data-id="preview-animation-styles"]',
              )
              if (!styleTag) {
                styleTag = document.createElement('style')
                styleTag.setAttribute('data-id', 'preview-animation-styles')
                document.head.appendChild(styleTag)
              }

              // Set the animation styles for self and repeated nodes, but pause for all others
              // TODO: Consider if we should set all other animations to follow the current timeline time, by setting animation-delay with paused
              styleTag.innerHTML = `
[data-id] {
  animation-play-state: paused !important;
}
[data-id="${animationState.animatedElementId}"], [data-id="${animationState.animatedElementId}"] ~ [data-id^="${animationState.animatedElementId}("] {
  animation: preview_timeline 1s paused normal !important;
  animation-fill-mode: var(--editor-timeline-fill-mode) !important;
  animation-timing-function: var(--editor-timeline-timing-function) !important;
  animation-delay: calc(0s - var(--editor-timeline-position)) !important;
}`
            }
          })
          break
        case 'preview_style':
          const { styles: previewStyleStyles } = message.data
          cancelAnimationFrame(previewStyleAnimationFrame)
          previewStyleAnimationFrame = requestAnimationFrame(() => {
            // Update or create a new style tag and set the given styles with important priority
            let styleTag = document.head.querySelector(
              '[data-id="selected-node-styles"]',
            )

            // Cleanup when null styles are sent
            if (!previewStyleStyles) {
              styleTag?.remove()
              return
            }

            if (!styleTag) {
              styleTag = document.createElement('style')
              styleTag.setAttribute('data-id', 'selected-node-styles')
              document.head.appendChild(styleTag)
            }

            const previewStyles = Object.entries(previewStyleStyles)
              .map(([key, value]) => `${key}: ${value} !important;`)
              .join('\n')
            styleTag.innerHTML = `[data-id="${selectedNodeId}"], [data-id="${selectedNodeId}"] ~ [data-id^="${selectedNodeId}("] {
    ${previewStyles}
    transition: none !important;
  }`
          })
          break
      }
    },
  )

  const updateStyle = () => {
    if (component) {
      insertStyles(document.head, component, getAllComponents())
    }
  }

  /**
   * Get the current representation of the component, but with
   * updated conditions based on selectedNodeId and updated
   * styling based on styleVariantSelection
   */
  const getCurrentComponent = (): Component | null => {
    const _component = structuredClone(component)
    if (!_component) {
      return null
    }
    if (mode === 'design') {
      if (selectedNodeId !== null) {
        const root = _component?.nodes.root
        if (root) {
          const nodeLookup = getNodeAndAncestors(
            _component,
            root,
            selectedNodeId,
          )
          if (nodeLookup) {
            if (isNodeOrAncestorConditional(nodeLookup)) {
              // Show the selected node and all its ancestors by
              // removing their "show" condition
              nodeLookup.node.condition = undefined
              nodeLookup.ancestors.forEach((a) => (a.condition = undefined))
            }
          }
        }
      }
    }
    return _component
  }

  const updateSelectedStyleVariant = (variantIndex: number | null) => {
    clearSelectedStyleVariant()
    if (selectedNodeId !== null && typeof variantIndex === 'number') {
      styleVariantSelection = {
        nodeId: selectedNodeId,
        styleVariantIndex: variantIndex,
      }
      const root = component?.nodes.root
      if (root && component) {
        const nodeLookup = getNodeAndAncestors(component, root, selectedNodeId)
        if (nodeLookup) {
          if (
            styleVariantSelection?.nodeId === selectedNodeId &&
            (nodeLookup.node.type === 'element' ||
              nodeLookup.node.type === 'component')
          ) {
            const selectedStyleVariant = nodeLookup.node.variants?.[
              styleVariantSelection.styleVariantIndex
            ] ?? { style: {} }
            // Add a style element specific to the selected element which
            // is only applied when the preview is in design mode
            const styleElem = document.createElement('style')
            styleElem.setAttribute('data-hash', selectedNodeId)
            styleElem.appendChild(
              document.createTextNode(`
                        body[data-mode="design"] [data-id="${selectedNodeId}"] {
                          ${styleToCss({
                            ...nodeLookup.node.style,
                            ...selectedStyleVariant.style,
                          })}
                        }
                      `),
            )
            const existingStyleElement = document.head.querySelector(
              `[data-hash="${selectedNodeId}"]`,
            )
            if (existingStyleElement) {
              document.head.removeChild(existingStyleElement)
            }
            document.head.appendChild(styleElem)
          }
        }
      }
    }
  }

  const update = () => {
    const _component = getCurrentComponent()
    if (!_component || !components || !packageComponents) {
      return
    }

    let { Attributes, Variables, Contexts } = dataSignal.get()
    if (
      fastDeepEqual(ctx?.component.attributes, _component.attributes) === false
    ) {
      Attributes = mapObject(_component.attributes, ([name, { testValue }]) => [
        name,
        testValue,
      ])
    }
    if (
      _component.route &&
      fastDeepEqual(ctx?.component.route, _component.route) === false
    ) {
      // Subscribe to the route signal so we can preview URL parameter changes in the editor
      routeSignal?.destroy()
      if (_component.route) {
        // Populate initial URL parameters with test data
        window.toddle.locationSignal.update((location) => {
          if (!_component.route) return location

          return {
            ...location,
            route: _component.route,
            params: Object.fromEntries(
              _component.route.path
                .filter((p) => p.type === 'param')
                .map((p) => [p.name, p.testValue]),
            ),
            query: mapObject(
              _component.route.query,
              ([name, { testValue }]: [string, { testValue: string }]) => [
                name,
                testValue,
              ],
            ),
          }
        })

        routeSignal = window.toddle.locationSignal.map(({ query, params }) => {
          return { ...query, ...params }
        })

        routeSignal.subscribe((route) =>
          dataSignal.update((data) => ({
            ...data,
            'URL parameters': route,
            Attributes: route,
          })),
        )
      }

      Attributes = mapObject(_component.attributes, ([name, { testValue }]) => [
        name,
        testValue,
      ])
    }
    if (
      fastDeepEqual(
        ctx?.component.route?.info?.meta,
        _component.route?.info?.meta,
      ) === false
    ) {
      insertHeadTags(_component.route?.info?.meta ?? {}, {
        component: _component,
        data: { Attributes },
        root: document,
        package: ctx?.package,
        toddle: window.toddle,
        env,
      })
    }
    if (fastDeepEqual(_component.contexts, ctx?.component.contexts) === false) {
      Contexts = (function createStaticContextFromComponent(
        component: Component,
        contextProvidersCreated?: Set<string>,
      ) {
        contextProvidersCreated?.add(component.name)
        return mapObject(
          component.contexts ?? {},
          ([providerName, context]) => {
            if (contextProvidersCreated?.has(providerName)) {
              // Circular dependency detected in context-providers (ie. A -> B -> A -> ...), stop recursion
              return [providerName, {}]
            }

            const providerComponent = getAllComponents().find(
              (c) => c.name === providerName,
            )
            if (!providerComponent) {
              console.warn(
                `Could not find a provider-component named "${providerName}" in files`,
              )
              return [providerName, {}]
            }

            // TODO: Should we also run APIs for the provider?
            const formulaContext: FormulaContext = {
              data: {
                Attributes: mapObject(
                  providerComponent.attributes,
                  ([name, attr]) => [name, attr.testValue],
                ),
                // Recursively resolve contexts providers before their children to build up the fake context tree in preview mode
                Contexts: createStaticContextFromComponent(
                  providerComponent,
                  contextProvidersCreated ?? new Set(),
                ),
              },
              component: providerComponent,
              root: ctx?.root,
              formulaCache: {},
              package: ctx?.package,
              toddle: window.toddle,
              env,
            }

            // Pages can also be context-providers!
            // Exposed formulas can derive their preview output from URL data,
            // so we must populate Url parameters with their test data
            if (providerComponent.route) {
              formulaContext.data['URL parameters'] = {
                ...Object.fromEntries(
                  providerComponent.route.path
                    .filter((p) => p.type === 'param')
                    .map((p) => [p.name, p.testValue]),
                ),
                ...mapObject(
                  providerComponent.route.query,
                  ([name, { testValue }]) => [name, testValue],
                ),
              }
            }
            formulaContext.data.Variables = mapObject(
              providerComponent.variables,
              ([name, variable]) => [
                name,
                applyFormula(variable.initialValue, formulaContext),
              ],
            )

            return [
              providerName,
              Object.fromEntries(
                context.formulas.map((formulaName) => {
                  const formula = providerComponent.formulas?.[formulaName]
                  if (!formula) {
                    console.warn(
                      `Could not find formula "${formulaName}" in component "${providerName}"`,
                    )
                    return [formulaName, null]
                  }

                  return [
                    formulaName,
                    applyFormula(formula.formula, formulaContext),
                  ]
                }),
              ),
            ]
          },
        )
      })(_component)
    }
    if (
      fastDeepEqual(_component.variables, ctx?.component.variables) === false
    ) {
      Variables = mapObject(
        _component.variables,
        ([name, { initialValue }]) => [
          name,
          applyFormula(initialValue, {
            data: { Attributes, Contexts },
            component: _component!,
            root: document,
            package: ctx?.package,
            toddle: window.toddle,
            env,
          }),
        ],
      )
    }

    dataSignal.update((data) => {
      return {
        ...data,
        'URL parameters':
          component && isPageComponent(component)
            ? ({
                ...window.toddle.locationSignal.get().query,
                ...window.toddle.locationSignal.get().params,
              } as Record<string, string>)
            : {},
        Attributes,
        Variables,
        Contexts,
      }
    })
    const newCtx: ComponentContext = {
      ...(ctx ?? createContext(_component, getAllComponents())),
      component: _component,
    }

    for (const api in newCtx.component.apis) {
      // check if the api has changed (ignoring onCompleted and onFailed).
      const apiInstance = newCtx.component.apis[api]
      const previousApiInstance = ctx?.component.apis[api]
      if (isLegacyApi(apiInstance)) {
        if (
          fastDeepEqual(
            omitKeys(apiInstance, ['onCompleted', 'onFailed']),
            previousApiInstance && isLegacyApi(previousApiInstance)
              ? omitKeys(previousApiInstance, ['onCompleted', 'onFailed'])
              : (previousApiInstance ?? {}),
          ) === false
        ) {
          newCtx.apis[api]?.destroy()
          dataSignal.update((data) => {
            return {
              ...data,
              Apis: omitKeys(data.Apis ?? {}, [
                ...Object.keys(data.Apis ?? {}).filter(
                  // remove any data from an api that is not part of the component
                  (key) => !newCtx.component.apis[key],
                ),
                api,
              ]),
            }
          })
          newCtx.apis[api] = createLegacyAPI(apiInstance, newCtx)
        }
      } else {
        if (!newCtx.apis[api]) {
          newCtx.apis[api] = createAPI(apiInstance, newCtx)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          newCtx.apis[api].update && newCtx.apis[api].update(apiInstance)
        }
      }
    }

    if (
      fastDeepEqual(newCtx.component.nodes, ctx?.component?.nodes) === false
    ) {
      updateStyle()

      // Remove preview styles automatically when the component changes
      document.head.querySelector('[data-id="selected-node-styles"]')?.remove()
      if (
        fastDeepEqual(
          omitSubnodeStyleForComponent(newCtx.component),
          omitSubnodeStyleForComponent(ctx?.component),
        )
      ) {
        // If we're in here, then the latest update was only a style change, so we should try some optimistic updates
        Object.keys(newCtx.component.nodes).forEach((nodeId) => {
          const newNode = newCtx.component.nodes[nodeId]
          const oldNode = ctx?.component.nodes[nodeId]
          if (
            (newNode.type === 'element' || newNode.type === 'component') &&
            (oldNode?.type === 'element' || oldNode?.type === 'component') &&
            (!fastDeepEqual(newNode.style, oldNode.style) ||
              !fastDeepEqual(newNode.variants, oldNode.variants))
          ) {
            document
              .querySelectorAll(`[data-node-id="${nodeId}"]`)
              .forEach((nodeInstance) => {
                nodeInstance.classList.remove(
                  getClassName([oldNode.style, oldNode.variants]),
                )
                nodeInstance.classList.add(
                  getClassName([newNode.style, newNode.variants]),
                )
              })
          }
        })
      } else {
        Array.from(domNode.children).forEach((child) => {
          if (child.tagName !== 'SCRIPT') {
            child.remove()
          }
        })

        // Clear old root signal and create a new one to not keep old signals with previous root around
        ctxDataSignal?.destroy()
        ctxDataSignal = dataSignal.map((data) => data)
        const rootElem = createNode({
          id: 'root',
          path: '0',
          dataSignal: ctxDataSignal,
          ctx: newCtx,
          parentElement: domNode,
          instance: { [newCtx.component.name]: 'root' },
        })
        newCtx.component.onLoad?.actions.forEach((action) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          handleAction(action, dataSignal.get(), newCtx)
        })
        rootElem.forEach((elem) => domNode.appendChild(elem))
        window.parent?.postMessage(
          {
            type: 'style',
            time: new Intl.DateTimeFormat('en-GB', {
              timeStyle: 'long',
            }).format(new Date()),
          },
          '*',
        )
      }
    }

    ctx = newCtx
  }

  const createContext = (
    component: Component,
    components: Component[],
  ): ComponentContext => {
    const ctx: ComponentContext = {
      component,
      components,
      triggerEvent: (event, data) => {
        window.parent?.postMessage(
          {
            type: 'component event',
            event,
            time: new Intl.DateTimeFormat('en-GB', {
              timeStyle: 'long',
            }).format(new Date()),
            data,
          },
          '*',
        )
      },
      dataSignal,
      root: document,
      isRootComponent: true,
      apis: {},
      children: {},
      abortSignal: new AbortController().signal,
      formulaCache: createFormulaCache(component),
      providers: {},
      package: undefined,
      toddle: window.toddle,
      env,
    }

    if (isContextProvider(component)) {
      // Subscribe to exposed formulas and update the component's data signal
      const formulaDataSignals = Object.fromEntries(
        Object.entries(component.formulas ?? {})
          .filter(([, formula]) => formula.exposeInContext)
          .map(([name, formula]) => [
            name,
            dataSignal.map((data) =>
              applyFormula(formula.formula, {
                data,
                component,
                formulaCache: ctx.formulaCache,
                root: ctx.root,
                package: ctx.package,
                toddle: window.toddle,
                env,
              }),
            ),
          ]),
      )

      ctx.providers = {
        ...ctx.providers,
        [component.name]: {
          component,
          formulaDataSignals,
          ctx,
        },
      }
    }

    return ctx
  }

  document.addEventListener('keydown', (event) => {
    if (isInputTarget(event)) {
      return
    }
    switch (event.key) {
      case 'k':
        if (event.metaKey) {
          event.preventDefault()
        }
    }
    window.parent?.postMessage(
      {
        type: 'keydown',
        event: {
          key: event.key,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        },
      },
      '*',
    )
  })
  document.addEventListener('keyup', (event) => {
    if (isInputTarget(event)) {
      return
    }
    window.parent?.postMessage(
      {
        type: 'keyup',
        event: {
          key: event.key,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        },
      },
      '*',
    )
  })
  document.addEventListener('keypress', (event) => {
    if (isInputTarget(event)) {
      return
    }
    window.parent?.postMessage(
      {
        type: 'keypress',
        event: {
          key: event.key,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        },
      },
      '*',
    )
  })

  dataSignal.subscribe((data) => {
    if (component && components && packageComponents && data) {
      try {
        window.parent?.postMessage({ type: 'data', data }, '*')
      } catch {
        // If we're unable to send the data, let's try to JSON serialize it
        window.parent?.postMessage(
          { type: 'data', data: JSON.parse(JSON.stringify(data)) },
          '*',
        )
      }
    }
  })

  const clearSelectedStyleVariant = () => {
    if (styleVariantSelection) {
      const styleElem = document.head.querySelector(
        `[data-hash="${styleVariantSelection.nodeId}"]`,
      )
      if (styleElem) {
        document.head.removeChild(styleElem)
      }
      styleVariantSelection = null
    }
  }

  const updateConditionalElements = () => {
    const displayedNodes: string[] = []
    if (selectedNodeId && component) {
      const root = component.nodes.root
      if (root) {
        const nodeLookup = getNodeAndAncestors(component, root, selectedNodeId)
        if (isNodeOrAncestorConditional(nodeLookup)) {
          displayedNodes.push(selectedNodeId)
          displayedNodes.push(
            ...[...nodeLookup.ancestors, nodeLookup.node]
              .filter((a) => a.condition)
              .map((a) => a.nodeId),
          )
        }
      }
    }
    showSignal.set({
      displayedNodes,
      testMode: mode === 'test',
    })
  }

  // Animations are first class citizens in Nordcraft, so we sync their overlay positions on each frame
  ;(function syncOverlayRects(
    prevSelectionRect?: ReturnType<typeof getRectData>,
    prevHighlightedRect?: ReturnType<typeof getRectData>,
  ) {
    const selectionRect = getRectData(getDOMNodeFromNodeId(selectedNodeId))
    if (!fastDeepEqual(prevSelectionRect, selectionRect)) {
      window.parent?.postMessage(
        {
          type: 'selectionRect',
          rect: selectionRect,
        },
        '*',
      )
    }

    const highlightRect = getRectData(getDOMNodeFromNodeId(highlightedNodeId))
    if (!fastDeepEqual(prevHighlightedRect, highlightRect)) {
      window.parent?.postMessage(
        {
          type: 'highlightRect',
          rect: highlightRect,
        },
        '*',
      )
    }

    requestAnimationFrame(() => syncOverlayRects(selectionRect, highlightRect))
  })()
}

function getRectData(selectedNode: Element | null | undefined) {
  if (!selectedNode) {
    return null
  }

  const rect = selectedNode.getBoundingClientRect()
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
    borderRadius: window
      .getComputedStyle(selectedNode)
      .borderRadius.split(' ')
      .map(parseFloat),
  }
}

const insertOrReplaceHeadNode = (id: string, node: Node) => {
  const existing = document.head.querySelector(`[data-meta-id="${id}"]`)
  if (existing) {
    existing.replaceWith(node)
  } else {
    document.head.appendChild(node)
  }
}

const insertHeadTags = (
  entries: Record<string, MetaEntry>,
  context: FormulaContext,
) => {
  // Remove all tags that has a data-meta-id attribute that is not in the entries
  Array.from(document.head.querySelectorAll('[data-meta-id]'))
    .filter((elem) => !entries[elem.getAttribute('data-meta-id')!])
    .forEach((elem) => elem.remove())

  // Skip anything that is not <link> or <script> tags, as they don't have any influence on the preview
  Object.entries(entries).forEach(([id, entry]) => {
    switch (entry.tag) {
      case 'link':
        return insertOrReplaceHeadNode(
          id,
          document.createRange().createContextualFragment(`
          <link
            data-meta-id="${id}"
            ${Object.entries(entry.attrs)
              .map(([key, value]) => `${key}="${applyFormula(value, context)}"`)
              .join(' ')}
          />
        `),
        )
      case 'script':
        return insertOrReplaceHeadNode(
          id,
          document.createRange().createContextualFragment(`
          <script
            data-meta-id="${id}"
            ${Object.entries(entry.attrs)
              .map(([key, value]) => `${key}="${applyFormula(value, context)}"`)
              .join(' ')}
          ></script>
        `),
        )
    }
  })
}

export function getDOMNodeFromNodeId(
  selectedNodeId: string | null | undefined,
) {
  if (!selectedNodeId) {
    return null
  }

  return document.querySelector(
    `[data-id="${selectedNodeId}"]:not([data-component])`,
  )
}

function getNodeId(component: Component, path: string[]) {
  function getId(
    [nextChild, ...path]: string[],
    currentId: string | undefined,
  ): string | null {
    if (nextChild === undefined || currentId === undefined) {
      return currentId ?? null
    }
    const currentNode = component.nodes[currentId]
    if (!currentNode?.children) {
      return null
    }

    // We only allow selecting the first element in a repeat (which does not have a repeat-index "()")
    if (nextChild.endsWith(')')) {
      return null
    }

    return getId(path, currentNode.children[parseInt(nextChild)])
  }
  return getId(path, 'root')
}

const insertTheme = (parent: HTMLElement, theme: Theme | OldTheme) => {
  document.getElementById('theme-style')?.remove()
  const styleElem = document.createElement('style')
  styleElem.setAttribute('type', 'text/css')
  styleElem.setAttribute('id', 'theme-style')
  styleElem.innerHTML = getThemeCss(theme, {
    includeResetStyle: false,
    createFontFaces: true,
  })
  parent.appendChild(styleElem)
}
