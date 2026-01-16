import { get } from '@nordcraft/core/dist/utils/collections'
import type { Rule } from '../../../types'

export const unknownFetchInputRule: Rule<{
  name: string
}> = {
  code: 'unknown fetch input',
  level: 'warning',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'action-model' ||
      value.type !== 'Fetch' ||
      Object.keys(value.inputs ?? {}).length === 0
    ) {
      return
    }
    const [components, componentName] = path
    const targetApi = get(files, [components, componentName, 'apis', value.api])
    if (!targetApi) {
      return
    }
    const validInputs = new Set(Object.keys(targetApi.inputs ?? {}))
    for (const inputName of Object.keys(value.inputs ?? {})) {
      if (!validInputs.has(inputName)) {
        report(path, { name: inputName })
      }
    }
  },
}
