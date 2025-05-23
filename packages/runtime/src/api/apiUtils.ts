import type { ContextApi, ContextApiV2 } from '../types'

export const isContextApiV2 = (api: ContextApi): api is ContextApiV2 =>
  'triggerActions' in api
