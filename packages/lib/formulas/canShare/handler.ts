import type { FormulaHandler } from '@nordcraft/core/dist/types'
import { isDefined } from '@nordcraft/core/dist/utils/util'

const handler: FormulaHandler<boolean> = ([url, title, text]) => {
  if (!isDefined(navigator.canShare)) {
    return false
  }
  const validInput = (value: any): value is string =>
    isDefined(value) && typeof value === 'string'
  if (!validInput(url) && !validInput(title) && !validInput(text)) {
    return false
  }
  const data: ShareData = {}
  if (validInput(title)) {
    data.title = title
  }
  if (validInput(text)) {
    data.text = text
  }
  if (validInput(url)) {
    data.url = url
  }
  // Later we can add support for data.files as well
  return navigator.canShare(data)
}

export default handler
