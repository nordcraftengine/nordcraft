import {
  DATA_ATTR_NODE_ID,
  DATA_ATTR_NODE_TYPE,
  DATA_NODE_TYPE_TEXT,
} from '../const'

export const RESET_STYLES = `
@layer reset {
  html {
    height:100%;
  }

  #App {
    height:100%;
    display:flex;
    flex-direction:column;
  }

  body {
    height:100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin:0;
  }

  [${DATA_ATTR_NODE_ID}]:not([data-unset-toddle-styles],[${DATA_ATTR_NODE_TYPE}="${DATA_NODE_TYPE_TEXT}"],noscript,br,script,style,math,math *,link,template,meta,title,base), [${DATA_ATTR_NODE_ID}]:not([data-unset-toddle-styles],noscript)::before, [${DATA_ATTR_NODE_ID}]:not([data-unset-toddle-styles],noscript)::after {
    display: flex;
    flex-direction: column;
    flex-grow: 0;
    flex-shrink: 0;

    position: relative;
    box-sizing: border-box;
    padding: 0;
    margin: 0;

    font-size: var(--text-base);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-normal);

    background: transparent;
    color: inherit;
    border: none;
    box-shadow: none;
  }

  [${DATA_ATTR_NODE_ID}]:not([data-unset-toddle-styles]):is(p, h1, h2, h3, h4, h5, h6, label, span, strong, b, i, address, caption, code, cite, dt, dd, em, figcaption, legend, blockquote, abbr, pre, bdo, bdi) {
    display: inline-block;
    overflow-wrap: break-word;
    color: inherit;
  }

  [${DATA_ATTR_NODE_ID}]:not([data-unset-toddle-styles]):is(input, button, textarea, select) {
    outline: none;
  }

  [${DATA_ATTR_NODE_ID}]:not([data-unset-toddle-styles]):is(a) {
    color: inherit;
    text-decoration: none;
  }

  [${DATA_ATTR_NODE_ID}]:not([data-unset-toddle-styles]):is(ul, ol, li) {
    list-style: none;
  }

  [${DATA_ATTR_NODE_ID}]:not([data-unset-toddle-styles]):is(span[${DATA_ATTR_NODE_TYPE}="${DATA_NODE_TYPE_TEXT}"]) {
    font: inherit;
    display: inline;
    flex-direction: column;
    flex-grow: 0;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  [popover]:not(:popover-open):not(dialog[open]) {
    display: revert;
  }
}`
