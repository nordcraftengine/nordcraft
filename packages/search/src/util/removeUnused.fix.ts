import { omit } from '@nordcraft/core/dist/utils/collections'
import type { FixFunction, NodeType } from '../types'

export const removeFromPathFix: FixFunction<NodeType> = ({ path, files }) =>
  omit(files, path)
