import type { Rule } from '../../../types'

export const unknownSetUrlParameterRule: Rule<{
  name: string
}> = {
  code: 'unknown set url parameter',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, args) => {
    if (
      args.nodeType !== 'action-model' ||
      args.value.type !== 'SetURLParameter'
    ) {
      return
    }
    const isValidParameter = (parameterName: string) =>
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      args.component.route?.path?.some(
        (p) =>
          p.name === parameterName &&
          // It's only valid to set non-static path parameters
          p.type === 'param',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      ) ||
      Object.values(args.component.route?.query ?? {}).some(
        (q) => q.name === parameterName,
      )
    const parameterName = args.value.parameter
    if (!isValidParameter(parameterName)) {
      report({
        path: args.path,
        info: {
          title: 'Unknown URL parameter update',
          description: `**${parameterName}** does not exist as a path- or query-parameter and cannot be set/updated.`,
        },
        details: { name: parameterName },
      })
    }
  },
}
