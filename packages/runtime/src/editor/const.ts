import { DATA_ATTR_ID } from '@nordcraft/core/dist/const'

export {
  DATA_ATTR_COMPONENT,
  DATA_ATTR_ID,
  DATA_ATTR_NODE_ID,
  DATA_ATTR_NODE_TYPE,
  DATA_NODE_TYPE_TEXT,
} from '@nordcraft/core/dist/const'

export const DATA_ATTR_VIEWPORT_HEIGHT = 'data-viewport-height'
export const DATA_ATTR_SELECTED = 'data-selected'
export const DATA_ATTR_REPEAT_SELECTED = 'data-repeat-selected'
export const DATA_ATTR_MODE = 'data-mode'
export const DATA_ATTR_HASH = 'data-hash'
export const DATA_ATTR_META_ID = 'data-meta-id'
export const DATA_ATTR_ANIMATING = 'data-animating'
export const DATA_ATTR_TIMELINE_KEYFRAMES = 'data-timeline-keyframes'

export const DATA_ID_PREVIEW_RESOURCE = 'preview-resource'
export const DATA_ID_SELECTED_NODE_STYLES = 'selected-node-styles'
export const DATA_ID_PREVIEW_ANIMATION_STYLES = 'preview-animation-styles'

export const SELECTOR_PREVIEW_RESOURCE = `[${DATA_ATTR_ID}="${DATA_ID_PREVIEW_RESOURCE}"]`
export const SELECTOR_SELECTED_NODE_STYLES = `[${DATA_ATTR_ID}="${DATA_ID_SELECTED_NODE_STYLES}"]`
export const SELECTOR_PREVIEW_ANIMATION_STYLES = `[${DATA_ATTR_ID}="${DATA_ID_PREVIEW_ANIMATION_STYLES}"]`

export const DEFAULT_VIEWPORT_HEIGHT = 740

export const CSS_VAR_VIEWPORT_HEIGHT = '--nc-viewport-height-px'
export const CSS_VAR_SCROLL_HEIGHT = '--nc-scroll-height-px'
