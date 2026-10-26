import { createApiStateComponents } from './api-state-project'

// Starts fetching immediately so a variable can be changed while the request
// is still in flight.
export const page = 'ApiStatePage'

export const components = createApiStateComponents({ shouldFetch: true })
