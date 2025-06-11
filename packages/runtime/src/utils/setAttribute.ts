import { isDefined, toBoolean } from '@nordcraft/core/dist/utils/util'

/**
 * Some attributes need special handling.
 */
export function setAttribute(
  elem: HTMLElement | SVGElement | MathMLElement,
  attr: string,
  value: any,
) {
  switch (attr) {
    case 'srcObject':
    case 'src':
      if (elem instanceof HTMLMediaElement) {
        ;(elem as any)[attr] = value
      } else {
        elem.setAttribute(attr, String(value))
      }
      break
    case 'value':
    case 'type': {
      if (elem instanceof SVGElement) {
        // The type attribute on SVG elements should just be added as an attribute
        // See https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/type
        elem.setAttribute(attr, String(value))
      } else {
        let val = value
        if (elem instanceof HTMLProgressElement) {
          // An HTMLProgressElement will break other elements in our editor if the value is not a (finite) number
          // See docs here https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress#value
          // and original issue here https://discord.com/channels/972416966683926538/1317827591230722048
          if (!isDefined(value) || !Number.isFinite(Number(value))) {
            val = 0
          }
        }
        ;(elem as any)[attr] = toBoolean(val) ? String(val) : undefined
      }
      break
    }
    case 'muted':
    case 'autoplay':
      if (elem instanceof HTMLMediaElement) {
        ;(elem as any)[attr] = toBoolean(value)
      } else {
        elem.setAttribute(attr, String(value))
      }
      break
    default:
      if (toBoolean(value)) {
        elem.setAttribute(attr, String(value))
        if (
          // autofocus often does not work in the editor
          attr === 'autofocus' &&
          document.body.getAttribute('data-mode') !== 'design'
        ) {
          setTimeout(() => elem.focus(), 100)
        }
      } else {
        elem.removeAttribute(attr)
      }
  }
}
