import type { Rule } from '../../../types'

export const unknownSetUrlParametersRule: Rule<{
  name: string
}> = {
  code: 'unknown set url parameters',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, args) => {
    if (
      args.nodeType !== 'action-model' ||
      args.value.type !== 'SetURLParameters'
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
    for (const key of Object.keys(args.value.parameters ?? {})) {
      if (!isValidParameter(key)) {
        report({
          path: [...args.path, 'parameters', key],
          info: {
            title: 'Unknown URL parameter update',
            description: `**${key}** does not exist as a path- or query-parameter and cannot be set/updated.`,
          },
          details: { name: key },
        })
      }
    }
  },
}
