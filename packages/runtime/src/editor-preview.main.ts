/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable no-case-declarations */
/* eslint-disable no-fallthrough */
import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import {
  type Component,
  type ComponentData,
  type ComponentFormula,
} from '@nordcraft/core/dist/component/component.types'
import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import type { FormulaContext } from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import type { FormulaEvaluationReporter } from '@nordcraft/core/dist/formula/formulaTypes'
import type { Theme } from '@nordcraft/core/dist/styling/theme'
import {
  THEME_COOKIE_NAME,
  THEME_DATA_ATTRIBUTE,
} from '@nordcraft/core/dist/styling/theme.const'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import fastDeepEqual from 'fast-deep-equal'
import { createNode } from './components/createNode'
import { isContextProvider } from './context/isContextProvider'
import { syncComponentApis } from './editor/api'
import { handleCanvasPointerEvent } from './editor/canvasClick'
import {
  EMPTY_COMPONENT_DATA,
  getAttributeTestValues,
  getElementTypeFromCanvasTool,
  getRouteParams,
  getRouteQuery,
  getVariableInitialValues,
} from './editor/componentData'
import {
  CSS_VAR_VIEWPORT_HEIGHT,
  DATA_ATTR_MODE,
  DATA_ATTR_NODE_TYPE,
  DATA_ATTR_VIEWPORT_HEIGHT,
  DATA_NODE_TYPE_TEXT,
  SELECTOR_SELECTED_NODE_STYLES,
} from './editor/const'
import { createStaticContextFromComponent } from './editor/context'
import {
  getCurrentComponent,
  getDOMNodeFromNodeId,
  markHighlightedTextNode,
  updateConditionalElements,
} from './editor/dom'
import {
  handleDragAltToggle,
  handleDragEnded,
  handleDragMouseMove,
  handleDragStarted,
} from './editor/drag-drop/dragHandlers'
import { getFormattedTime, throttleToIdleCallback } from './editor/editorUtils'
import { env, registerActions, registerFormulas } from './editor/global'
import { introspectApiRequest } from './editor/graphql'
import { insertHeadTags } from './editor/head'
import {
  handleInsertEnded,
  handleInsertMouseMove,
  handleInsertStarted,
} from './editor/insert/insertHandlers'
import { initKeyListeners } from './editor/keyboard'
import { updateComponentLinks } from './editor/links'
import { getRectData } from './editor/overlay'
import { postMessageToEditor } from './editor/postMessageToEditor'
import { applyPreviewResources } from './editor/previewResources'
import {
  applyPreviewStyle,
  clearSelectedStyleVariant,
  updateSelectedStyleVariant,
} from './editor/previewStyle'
import { handleRenderError } from './editor/renderError'
import { requestResizeCanvas, resizeCanvas } from './editor/resizeCanvas'
import { captureScreenshot } from './editor/screenshot'
import { insertStyles } from './editor/style'
import { handleTextMouseDown } from './editor/text-selection/mouseDown'
import { handleTextMouseMove } from './editor/text-selection/mouseMove'
import { handleTextNodeSelection } from './editor/text-selection/selection'
import { insertTheme, setupThemeSubscription } from './editor/theme'
import {
  handleGetComputedStyle,
  handleSetTimelineKeyframes,
  handleSetTimelineTime,
  type AnimationState,
} from './editor/timeline'
import type {
  DragInsertState,
  EditorMode,
  NordcraftPreviewEvent,
  PointerState,
  SelectionState,
} from './editor/types'
import { handleAction } from './events/handleAction'
import type { Signal } from './signal/signal'
import { signal } from './signal/signal'
import type { ComponentContext } from './types'
import { createFormulaCache } from './utils/createFormulaCache'
import { markSelectedElement } from './utils/markSelectedElement'
import { stripNodeIdRepeatIndices } from './utils/nodes'
import {
  getScrollStateRestorer,
  storeScrollState,
} from './utils/storeScrollState'

export { getDOMNodeFromNodeId } from './editor/dom'
export { initGlobalObject } from './editor/global'

// imported by "/.toddle/preview" (see worker/src/preview.ts)
export const createRoot = (
  domNode: HTMLElement | null = document.getElementById('App'),
) => {
  if (!domNode) {
    throw new Error('Cant find root domNode')
  }

  const dataSignal = signal(EMPTY_COMPONENT_DATA)
  let ctxDataSignal: Signal<ComponentData> | undefined

  let ctx: ComponentContext | null = null
  let mode: EditorMode = 'design'
  // Signal for overriding conditional elements when they're
  // selected in design mode and for reverting back to normal
  // in test mode
  const showSignal = signal<{ displayedNodes: string[]; testMode: boolean }>({
    displayedNodes: [],
    testMode: false,
  })
  const themeSignal = signal<string | null>(null)
  themeSignal.subscribe((theme) => {
    if (isDefined(theme)) {
      document.documentElement.setAttribute(THEME_DATA_ATTRIBUTE, theme)
    } else {
      document.documentElement.removeAttribute(THEME_DATA_ATTRIBUTE)
    }
    dataSignal.update((data) => ({
      ...data,
      Page: {
        ...(data.Page ?? {}),
        Theme: theme ?? null,
      },
    }))
  })
  const resizeCanvasOptions: {
    viewport?: { height: number | null }
    enabled?: boolean
  } = {}
  window.toddle._preview = { showSignal }
  document.body.setAttribute(DATA_ATTR_MODE, 'design')
  let components: Component[] | null = null
  let packageComponents: Component[] | null = null
  const getAllComponents = () => [
    ...(components ?? []),
    ...(packageComponents ?? []),
  ]
  let component: Component | null = null
  let componentFormulaData: Record<string, any> = {}

  const reportFormulaEvaluation: FormulaEvaluationReporter = (
    path,
    data,
    ctx,
  ) => {
    if (
      data !== undefined &&
      path.length > 0 &&
      // We are currently skipping all children formulas to lower the scope of reporting to what the user can see in the canvas
      ctx.component?.name === component?.name
    ) {
      try {
        componentFormulaData[path.join('/')] = JSON.parse(JSON.stringify(data))
      } catch {
        componentFormulaData[path.join('/')] =
          `[Unserializable value of type ${typeof data}]`
      } finally {
        reportComponentFormulaData()
      }
    }
  }
  const reportComponentFormulaData = throttleToIdleCallback(() => {
    postMessageToEditor({
      type: 'componentFormulaData',
      data: componentFormulaData,
      component: component?.name,
    })
    componentFormulaData = {}
  })
  const selectionState: SelectionState = {
    anchor: null,
    mode: 'char',
  }
  const pointerState: PointerState = {
    lastPressPosition: { x: 0, y: 0 },
    buttons: 0,
    lastPressTime: 0,
    pressCount: 0,
  }
  let selectedNodeId: string | null = null
  let highlightedNodeId: string | null = null
  let styleVariantSelection: {
    nodeId: string
    styleVariantIndex: number
  } | null = null
  let routeSignal: Signal<any> | null = null
  let dragState: DragInsertState | null = null
  let insertState: DragInsertState | null = null
  let animationState: AnimationState | null = null
  let altKey = false
  let metaKey = false
  let clearPreviewStyleTimeout: ReturnType<typeof setTimeout> | undefined

  const setupDataSignalSubscribers = () => {
    dataSignal.subscribe((data) => {
      if (component && components && packageComponents && data) {
        try {
          postMessageToEditor({ type: 'data', data })
        } catch {
          // If we're unable to send the data, let's try to JSON serialize it
          postMessageToEditor({
            type: 'data',
            data: JSON.parse(JSON.stringify(data)),
          })
        }
      }
    })
  }
  setupDataSignalSubscribers()

  const handleApplyPreviewStyle = (data: {
    styles: Record<string, string> | null
    theme?: {
      key: string
      value: Theme
    }
  }) => {
    applyPreviewStyle({
      data,
      selectedNodeId,
      component,
      styleVariantSelection,
      resizeCanvasOptions,
      syncOverlayRects,
    })
  }

  const handleUpdateSelectedStyleVariant = (variantIndex: number | null) => {
    styleVariantSelection = updateSelectedStyleVariant({
      variantIndex,
      selectedNodeId,
      component,
      dataSignal,
      ctx,
      env,
      getCurrentComponent: () =>
        getCurrentComponent(component, selectedNodeId, mode),
      reportFormulaEvaluation,
      currentSelection: styleVariantSelection,
    })
  }

  const runWithOverlaySync = async <T>(
    action: () => Promise<T>,
    onDone: (result: T) => void,
  ) => {
    const interval = setInterval(syncOverlayRects, 1000 / 60)
    try {
      const result = await action()
      onDone(result)
    } finally {
      clearInterval(interval)
    }
  }

  const updateContextComponents = () => {
    if (ctx) {
      ctx.components = getAllComponents()
    }
    updateStyle(component)
  }

  window.addEventListener(
    'message',
    async (message: MessageEvent<NordcraftPreviewEvent>) => {
      if (!message.isTrusted) {
        console.error('UNTRUSTED MESSAGE')
      }
      switch (message.data?.type) {
        case 'component': {
          if (!message.data.component) {
            return
          }
          if (clearPreviewStyleTimeout) {
            clearTimeout(clearPreviewStyleTimeout)
            clearPreviewStyleTimeout = undefined
          }
          let scrollStateRestorer:
            | ReturnType<typeof getScrollStateRestorer>
            | undefined

          const switchComponent =
            message.data.component.name !== component?.name
          // Re-initialize state, subscribers, signals and ctx when switching component
          // But only if a component was already loaded
          if (switchComponent && component) {
            document.head.querySelector(SELECTOR_SELECTED_NODE_STYLES)?.remove()
            // Store scroll state for the previous component
            storeScrollState(component?.name)
            // Remove all subscribers from the previous showSignal
            showSignal.cleanSubscribers()
            // Clear any previously overridden conditional elements
            showSignal.set({ displayedNodes: [], testMode: mode === 'test' })
            // Restore scroll state for the new component
            scrollStateRestorer = getScrollStateRestorer(
              message.data.component.name,
            )
            // Destroy the dataSignal (including subscribers) for the previous component
            dataSignal.destroy()
            // Reset all evaluated formula data
            componentFormulaData = {}
            highlightedNodeId = null
            markHighlightedTextNode({
              highlightedNodeId: null,
              selectedNodeId: null,
              mode,
            })
            // Re-subscribe all dataSignal subscribers
            setupDataSignalSubscribers()
            // Re-initialize the data signal for the new component
            ctxDataSignal?.destroy()
            ctx = null
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
              // When switching component, reset data to empty API data etc.
              ...(switchComponent ? EMPTY_COMPONENT_DATA : data),
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

          // If update() didn't remove preview styles (e.g. nodes didn't change), clean them up now
          document.head.querySelector(SELECTOR_SELECTED_NODE_STYLES)?.remove()

          if (selectedNodeId) {
            if (styleVariantSelection) {
              handleUpdateSelectedStyleVariant(
                styleVariantSelection.styleVariantIndex,
              )
            }
          }

          requestAnimationFrame(() => {
            scrollStateRestorer?.((nodeId) =>
              document.querySelector(`[data-id="${nodeId}"]`),
            )
          })

          break
        }
        case 'components': {
          if (Array.isArray(message.data.components)) {
            components = (message.data.components as Component[]).map(
              updateComponentLinks,
            )
            updateContextComponents()
            // Since changes to other components might affect the current component
            // (if context was changed or a component node should be re-rendered)
            update({ forceRerender: true })
          }

          break
        }
        case 'global_formulas': {
          window.toddle.clearLegacyFormulas?.()
          registerFormulas(message.data.formulas ?? {})
          break
        }
        case 'global_actions': {
          window.toddle.clearLegacyActions?.()
          registerActions(message.data.actions ?? {})
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

            updateContextComponents()
            update()
          }

          Object.values(message.data.packages ?? {}).forEach((pkg) => {
            registerActions(pkg.actions, pkg.manifest.name)
            registerFormulas(pkg.formulas, pkg.manifest.name)
          })

          break
        }
        case 'theme': {
          insertTheme(document.head, message.data.theme)
          break
        }
        case 'mode': {
          if (clearPreviewStyleTimeout) {
            clearTimeout(clearPreviewStyleTimeout)
            clearPreviewStyleTimeout = undefined
          }
          document.head.querySelector(SELECTOR_SELECTED_NODE_STYLES)?.remove()
          mode = message.data.mode
          document.body.setAttribute(DATA_ATTR_MODE, message.data.mode)
          updateConditionalElements({
            selectedNodeId,
            component,
            mode,
            showSignal,
          })
          markHighlightedTextNode({
            highlightedNodeId,
            selectedNodeId,
            mode,
          })
          window.dispatchEvent(new CustomEvent('selected-node-changed'))
          requestResizeCanvas(resizeCanvasOptions, syncOverlayRects)
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
            if (clearPreviewStyleTimeout) {
              clearTimeout(clearPreviewStyleTimeout)
              clearPreviewStyleTimeout = undefined
            }
            document.head.querySelector(SELECTOR_SELECTED_NODE_STYLES)?.remove()
            selectedNodeId = message.data.selectedNodeId ?? null
            window.dispatchEvent(new CustomEvent('selected-node-changed'))
            clearSelectedStyleVariant(styleVariantSelection)
            styleVariantSelection = null

            updateConditionalElements({
              selectedNodeId,
              component,
              mode,
              showSignal,
            })

            const node = getDOMNodeFromNodeId(selectedNodeId)
            markSelectedElement(node)
            markHighlightedTextNode({
              highlightedNodeId,
              selectedNodeId,
              mode,
            })
            if (
              node &&
              node instanceof HTMLElement &&
              node.getAttribute(DATA_ATTR_NODE_TYPE) === DATA_NODE_TYPE_TEXT
            ) {
              requestAnimationFrame(() => {
                handleTextNodeSelection(node, {
                  onInput: () => {
                    syncOverlayRects()
                  },
                })
              })
            }
          }
          syncOverlayRects()
          return
        }
        case 'highlight': {
          highlightedNodeId = stripNodeIdRepeatIndices(
            message.data.highlightedNodeId,
          )
          markHighlightedTextNode({
            highlightedNodeId: message.data.highlightedNodeId,
            selectedNodeId,
            mode,
          })
          syncOverlayRects()
          return
        }
        case 'mousedown': {
          const { x, y } = message.data
          const node = getDOMNodeFromNodeId(selectedNodeId)

          if (
            node &&
            node.getAttribute(DATA_ATTR_NODE_TYPE) === DATA_NODE_TYPE_TEXT &&
            node instanceof HTMLElement
          ) {
            handleTextMouseDown({
              node,
              x,
              y,
              pointerState,
              selectionState,
            })
          }
          break
        }

        case 'mousemove': {
          if (['insert-div', 'insert-text'].includes(message.data.canvasTool)) {
            if (insertState && !insertState.destroying) {
              handleInsertMouseMove(message.data, insertState)
              syncOverlayRects()
              return
            } else if (!insertState?.destroying) {
              insertState = handleInsertStarted(
                message.data,
                highlightedNodeId,
                getElementTypeFromCanvasTool(message.data.canvasTool),
              )
            }
          }

          if (dragState && !dragState.destroying) {
            handleDragMouseMove(message.data, dragState, metaKey)
            syncOverlayRects()
            return
          }

          const node = getDOMNodeFromNodeId(selectedNodeId)
          if (
            node &&
            node instanceof HTMLElement &&
            node.getAttribute(DATA_ATTR_NODE_TYPE) === DATA_NODE_TYPE_TEXT
          ) {
            const { x, y, buttons } = message.data
            const handled = handleTextMouseMove({
              node,
              x,
              y,
              buttons,
              pointerState,
              selectionState,
            })

            if (handled) {
              return
            }
          }
        }
        case 'click':
        case 'dblclick':
          handleCanvasPointerEvent({
            event: message.data,
            mode,
            component,
            selectedNodeId,
            highlightedNodeId,
            metaKey,
            onHighlight: (newHighlightedNodeId) => {
              highlightedNodeId = stripNodeIdRepeatIndices(newHighlightedNodeId)
              markHighlightedTextNode({
                highlightedNodeId: newHighlightedNodeId,
                selectedNodeId,
                mode,
              })
              syncOverlayRects()
            },
          })
          break
        case 'style_variant_changed':
          if (clearPreviewStyleTimeout) {
            clearTimeout(clearPreviewStyleTimeout)
            clearPreviewStyleTimeout = undefined
          }
          document.head.querySelector(SELECTOR_SELECTED_NODE_STYLES)?.remove()
          const { variantIndex } = message.data
          handleUpdateSelectedStyleVariant(variantIndex)
          resizeCanvas(resizeCanvasOptions)
          syncOverlayRects()
          break
        case 'report_document_scroll_size':
          requestResizeCanvas({
            force: true,
          })
          break
        case 'viewport_size': {
          if (message.data.enabled) {
            resizeCanvasOptions.enabled = true
            resizeCanvasOptions.viewport = { height: message.data.height }
            const heightStr = String(
              Math.round(Number(resizeCanvasOptions.viewport.height)),
            )
            document.body.setAttribute(DATA_ATTR_VIEWPORT_HEIGHT, heightStr)
            domNode.style.setProperty(CSS_VAR_VIEWPORT_HEIGHT, heightStr)
            requestResizeCanvas(resizeCanvasOptions, syncOverlayRects)
          } else {
            resizeCanvasOptions.enabled = false
            domNode.style.removeProperty(CSS_VAR_VIEWPORT_HEIGHT)
            document.body.removeAttribute(DATA_ATTR_VIEWPORT_HEIGHT)
            requestResizeCanvas(resizeCanvasOptions, syncOverlayRects)
          }
          break
        }
        case 'reload':
          window.location.reload()
          break
        case 'fetch_api': {
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
          void ctx?.apis[apiKey]?.fetch({} as any)
          break
        }
        case 'introspect_qraphql_api': {
          const { apiKey } = message.data
          const api = component?.apis?.[apiKey]
          if (api && !isLegacyApi(api) && component) {
            const formulaContext: FormulaContext = {
              component,
              data: dataSignal.get(),
              root: document,
              package: ctx?.package,
              toddle: window.toddle,
              env,
              jsonPath: [],
            }
            const introspectionResult = await introspectApiRequest({
              api,
              componentName: component.name,
              formulaContext,
            })
            postMessageToEditor({
              type: 'introspectionResult',
              data: introspectionResult,
              apiKey,
            })
          }
          break
        }
        case 'drag-started':
          dragState = handleDragStarted(message.data, selectedNodeId, altKey)
          break
        case 'drag-ended':
          if (dragState) {
            const data = message.data
            const state = dragState
            void runWithOverlaySync(
              () => handleDragEnded(data, state, component),
              (newState) => {
                dragState = newState
              },
            )
          }
          break
        case 'insert-started':
          insertState = handleInsertStarted(
            message.data,
            highlightedNodeId,
            getElementTypeFromCanvasTool(message.data.canvasTool),
          )
          break
        case 'insert-ended':
          if (insertState) {
            const data = message.data
            const state = insertState
            void runWithOverlaySync(
              () => handleInsertEnded(data, state),
              (newState) => {
                insertState = newState
              },
            )
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
            void handleDragAltToggle(message.data.altKey, dragState).then(
              (newState) => {
                dragState = newState
              },
            )
          }
          altKey = message.data.altKey
          metaKey = message.data.metaKey
          break

        case 'get_computed_style':
          handleGetComputedStyle(
            selectedNodeId,
            message.data.styles,
            animationState,
          )
          break

        case 'set_timeline_keyframes':
          handleSetTimelineKeyframes(message.data.keyframes, syncOverlayRects)
          break

        case 'set_timeline_time': {
          animationState = handleSetTimelineTime({
            data: message.data,
            selectedNodeId,
            currentAnimationState: animationState,
            update,
            syncOverlayRects,
          })
          break
        }
        case 'preview_style': {
          const previewData = message.data
          const { styles: previewStyleStyles, theme } = previewData
          const isEmpty =
            !previewStyleStyles ||
            (!theme && Object.keys(previewStyleStyles).length === 0)

          if (isEmpty) {
            if (clearPreviewStyleTimeout) {
              clearTimeout(clearPreviewStyleTimeout)
            }
            // Delay clearing preview styles so that when a component update arrives
            // (e.g. on committing a style change in the editor), the UI does not flicker
            // between the preview style clearing and the component updating.
            clearPreviewStyleTimeout = setTimeout(() => {
              clearPreviewStyleTimeout = undefined
              handleApplyPreviewStyle(previewData)
            }, 100)
            break
          }

          if (clearPreviewStyleTimeout) {
            clearTimeout(clearPreviewStyleTimeout)
            clearPreviewStyleTimeout = undefined
          }
          handleApplyPreviewStyle(previewData)
          break
        }
        case 'preview_resources': {
          applyPreviewResources(message.data.resources, {
            resizeCanvasOptions,
            syncOverlayRects,
          })
          break
        }
        case 'preview_theme': {
          const { theme } = message.data
          themeSignal.set(theme)
          const shouldDelete = theme === null || theme === ''
          await cookieStore.set({
            name: THEME_COOKIE_NAME,
            value: theme ?? '',
            path: '/',
            expires: shouldDelete ? 0 : Date.now() + 1000 * 60 * 60 * 24, // 1 day
            sameSite: 'none',
          })
          requestResizeCanvas(resizeCanvasOptions)
          break
        }
        case 'capture_screenshot': {
          await captureScreenshot(message.data)
          break
        }
      }
    },
  )

  const resizeObserver = new ResizeObserver(() => {
    requestResizeCanvas(resizeCanvasOptions, syncOverlayRects)
  })
  resizeObserver.observe(domNode)
  requestResizeCanvas(resizeCanvasOptions)

  window.addEventListener('beforeunload', () => {
    if (clearPreviewStyleTimeout) {
      clearTimeout(clearPreviewStyleTimeout)
      clearPreviewStyleTimeout = undefined
    }
    storeScrollState(component?.name)
    resizeObserver.disconnect()
  })

  const updateStyle = (comp: Component | null) => {
    if (comp) {
      insertStyles(document.head, comp, getAllComponents())
    }
  }

  const update = ({ forceRerender }: { forceRerender?: boolean } = {}) => {
    const _component = getCurrentComponent(component, selectedNodeId, mode)
    if (!_component || !components || !packageComponents) {
      return
    }

    const scrollStateRestorer = storeScrollState()
    let { Attributes, Variables, Contexts } = dataSignal.get()
    if (
      fastDeepEqual(ctx?.component.attributes, _component.attributes) === false
    ) {
      Attributes = getAttributeTestValues(_component.attributes)
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
            params: getRouteParams(_component.route),
            query: getRouteQuery(_component.route),
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

      Attributes = getAttributeTestValues(_component.attributes)
    }
    if (
      fastDeepEqual(
        ctx?.component.route?.info?.meta,
        _component.route?.info?.meta,
      ) === false ||
      !ctx
    ) {
      insertHeadTags(_component.route?.info?.meta ?? {}, {
        component: _component,
        data: { Attributes },
        root: document,
        package: ctx?.package,
        toddle: window.toddle,
        env,
        jsonPath: ['route', 'info', 'meta'],
        reportFormulaEvaluation,
      })
    }
    if (fastDeepEqual(_component.contexts, ctx?.component.contexts) === false) {
      Contexts = createStaticContextFromComponent(
        _component,
        getAllComponents(),
        {
          root: ctx?.root,
          package: ctx?.package,
          env,
        },
      )
    }
    if (
      fastDeepEqual(_component.variables, ctx?.component.variables) === false
    ) {
      Variables = getVariableInitialValues(_component.variables, {
        data: { Attributes, Contexts },
        component: _component,
        root: document,
        package: ctx?.package,
        toddle: window.toddle,
        env,
        jsonPath: ctx?.jsonPath,
        reportFormulaEvaluation,
      })
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
    const defaultCtx =
      forceRerender || !ctx
        ? // If we are forcing a rerender, we need to create a new context with the new component and all components
          // Otherwise, we might be using outdated context provider data signals etc.
          createContext(_component, getAllComponents())
        : ctx
    const newCtx: ComponentContext = {
      ...defaultCtx,
      component: _component,
    }

    if (
      fastDeepEqual(
        newCtx.component.route?.info?.theme,
        ctx?.component.route?.info?.theme,
      ) === false
    ) {
      setupThemeSubscription(newCtx.component, dataSignal, env).subscribe(
        (theme) => {
          newCtx.stores.theme.set(theme)
        },
      )
    }

    syncComponentApis(newCtx, ctx, dataSignal)

    if (
      forceRerender ||
      fastDeepEqual(newCtx.component.nodes, ctx?.component?.nodes) === false ||
      fastDeepEqual(newCtx.component.formulas, ctx?.component?.formulas) ===
        false
    ) {
      updateStyle(newCtx.component)

      // Remove preview styles automatically when the component changes
      document.head.querySelector(SELECTOR_SELECTED_NODE_STYLES)?.remove()

      Array.from(domNode.children).forEach((child) => {
        if (child.tagName !== 'SCRIPT') {
          child.remove()
        }
      })

      // Clear old root signal and create a new one to not keep old signals with previous root around
      ctxDataSignal?.destroy()
      ctxDataSignal = dataSignal.map((data) => data)
      ctxDataSignal.subscribe(() => {
        requestResizeCanvas(resizeCanvasOptions, syncOverlayRects)
      })
      try {
        const rootElem = createNode({
          id: 'root',
          path: '0',
          dataSignal: ctxDataSignal,
          ctx: { ...newCtx, jsonPath: ['nodes', 'root'] },
          parentElement: domNode,
          instance: { [newCtx.component.name]: 'root' },
        })
        newCtx.component.onLoad?.actions?.forEach((action) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          handleAction(action, dataSignal.get(), newCtx)
        })
        rootElem.forEach((elem) => domNode.appendChild(elem))
      } catch (error: unknown) {
        handleRenderError(error, newCtx.component, domNode)
      }
      postMessageToEditor({
        type: 'style',
        time: getFormattedTime(),
      })
    }

    ctx = newCtx
    scrollStateRestorer((nodeId) =>
      document.querySelector(`[data-id="${nodeId}"]`),
    )
    markSelectedElement(getDOMNodeFromNodeId(selectedNodeId))
    markHighlightedTextNode({
      highlightedNodeId,
      selectedNodeId,
      mode,
    })
    requestResizeCanvas(resizeCanvasOptions, syncOverlayRects)
  }

  const createContext = (
    component: Component,
    components: Component[],
  ): ComponentContext => {
    const ctx: ComponentContext = {
      component,
      components,
      triggerEvent: (event, data) => {
        postMessageToEditor({
          type: 'component event',
          event,
          time: getFormattedTime(),
          data,
        })
      },
      dataSignal,
      root: document,
      isRootComponent: true,
      apis: {},
      children: {},
      abortSignal: new AbortController().signal,
      formulaCache: createFormulaCache(component),
      providers: {},
      stores: {
        theme: themeSignal,
      },
      package: undefined,
      toddle: window.toddle,
      env,
      jsonPath: [], // TODO: decide if the component path is needed here
      reportFormulaEvaluation,
    }

    setupThemeSubscription(ctx.component, ctx.dataSignal, env).subscribe(
      (theme) => {
        ctx.stores.theme.set(theme)
      },
    )

    if (isContextProvider(component)) {
      // Subscribe to exposed formulas and update the component's data signal
      const formulaDataSignals = Object.fromEntries(
        Object.entries(component.formulas ?? {})
          .filter(([, formula]) => formula?.exposeInContext)
          .map(([name, formula]) => [
            name,
            dataSignal.map((data) =>
              applyFormula(
                (formula as ComponentFormula).formula,
                {
                  data,
                  component,
                  formulaCache: ctx.formulaCache,
                  root: ctx.root,
                  package: ctx.package,
                  toddle: window.toddle,
                  env,
                  jsonPath: ctx.jsonPath,
                  reportFormulaEvaluation,
                },
                ['formulas', name],
              ),
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

  initKeyListeners()

  let prevSelectionRect: ReturnType<typeof getRectData>
  let prevHighlightRect: ReturnType<typeof getRectData>

  /**
   * Sync the overlay positions with the editor.
   * This is called on each frame to account for animations and other changes.
   */
  const syncOverlayRects = () => {
    const selectionRect = getRectData(getDOMNodeFromNodeId(selectedNodeId))
    const highlightRect = getRectData(getDOMNodeFromNodeId(highlightedNodeId))

    const selectionChanged = !fastDeepEqual(prevSelectionRect, selectionRect)
    const highlightChanged = !fastDeepEqual(prevHighlightRect, highlightRect)

    if (selectionChanged || highlightChanged) {
      prevSelectionRect = selectionRect
      prevHighlightRect = highlightRect
      if (selectionChanged) {
        postMessageToEditor({
          type: 'selectionRect',
          rect: selectionRect,
        })
      }
      if (highlightChanged) {
        postMessageToEditor({
          type: 'highlightRect',
          rect: highlightRect,
        })
      }
    }
  }
}
