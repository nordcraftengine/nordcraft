import { parseCss } from './cssParser'
import { parsedCssToString } from './stringifyParsedCss'
;(window as any).editor = {
  parseCss,
  parsedCssToString,
}
