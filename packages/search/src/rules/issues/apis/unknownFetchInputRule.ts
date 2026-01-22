import { get } from '@nordcraft/core/dist/utils/collections'
import type {
  ActionModelNode,
  FixFunction,
  NodeType,
  Rule,
} from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const unknownFetchInputRule: Rule<
  {
    name: string
  },
  NodeType,
  ActionModelNode
> = {
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
        report(path, { name: inputName }, ['delete-fetch-input'])
      }
    }
  },
  fixes: {
    'delete-fetch-input': deleteUnknownFetchInputFix,
  },
}

function deleteUnknownFetchInputFix(
  args: Parameters<FixFunction<ActionModelNode, { name: string }>>[0],
): ReturnType<FixFunction<ActionModelNode, { name: string }>> {
  const inputToRemove = args.details?.name
  if (typeof inputToRemove !== 'string') {
    return args.data.files
  }
  return removeFromPathFix({
    ...args,
    data: {
      ...args.data,
      path: [...args.data.path, 'inputs', inputToRemove],
    },
  })
}

export type DeleteFetchInputFix = 'delete-fetch-input'
