import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
 */
const handler: FormulaHandler<string> = ([input, loc, opt]) => {
  if (typeof input !== 'number' || Number.isNaN(input)) {
    return null
  }
  const locales =
    typeof loc === 'string' && loc.length > 0
      ? loc
      : Array.isArray(loc) && loc.every((l) => typeof l === 'string')
        ? (loc as string[])
        : undefined
  if (!opt || typeof opt !== 'object') {
    return Intl.NumberFormat(locales).format(input)
  }
  const validateString = <T = string>(
    value: unknown,
    allowedValues?: string[],
  ): T | undefined =>
    typeof value === 'string' && (allowedValues?.includes(value) ?? true)
      ? (value as T)
      : undefined

  const options: Partial<
    Intl.NumberFormatOptions & { locale: string | string[] }
  > = opt
  const style = validateString<Intl.NumberFormatOptions['style']>(
    options.style,
    ['decimal', 'currency', 'percent', 'unit'],
  )
  const currency =
    typeof options.currency === 'string' && options.currency.length === 3
      ? options.currency
      : undefined
  if (style === 'currency' && typeof currency !== 'string') {
    // currency must be provided when style is currency
    return null
  }
  const currencyDisplay = validateString<
    Intl.NumberFormatOptions['currencyDisplay']
  >(options.currencyDisplay, ['code', 'symbol', 'narrowSymbol', 'name'])
  const unit = typeof options.unit === 'string' ? options.unit : undefined
  if (style === 'unit' && typeof unit !== 'string') {
    // unit must be provided when style is unit
    return null
  }
  const unitDisplay = validateString<Intl.NumberFormatOptions['unitDisplay']>(
    options.unitDisplay,
    ['short', 'narrow', 'long'],
  )
  const minimumIntegerDigits =
    typeof options.minimumIntegerDigits === 'number' &&
    options.minimumIntegerDigits >= 1 &&
    options.minimumIntegerDigits <= 21
      ? options.minimumIntegerDigits
      : undefined
  const minimumFractionDigits =
    typeof options.minimumFractionDigits === 'number' &&
    options.minimumFractionDigits >= 0 &&
    options.minimumFractionDigits <= 100
      ? options.minimumFractionDigits
      : undefined
  const maximumFractionDigits =
    typeof options.maximumFractionDigits === 'number' &&
    options.maximumFractionDigits >= 0 &&
    options.maximumFractionDigits <= 100
      ? options.maximumFractionDigits
      : undefined
  const minimumSignificantDigits =
    typeof options.minimumSignificantDigits === 'number' &&
    options.minimumSignificantDigits >= 1 &&
    options.minimumSignificantDigits <= 21
      ? options.minimumSignificantDigits
      : undefined
  const maximumSignificantDigits =
    typeof options.maximumSignificantDigits === 'number' &&
    options.maximumSignificantDigits >= 1 &&
    options.maximumSignificantDigits <= 21
      ? options.maximumSignificantDigits
      : undefined
  const notation = validateString<Intl.NumberFormatOptions['notation']>(
    options.notation,
    ['standard', 'scientific', 'engineering', 'compact'],
  )
  const compactDisplay = validateString<
    Intl.NumberFormatOptions['compactDisplay']
  >(options.compactDisplay, ['short', 'long'])

  // useGrouping can be a boolean, 'always', 'auto', or 'min2'
  const validGroupingValues: Array<
    keyof Intl.NumberFormatOptionsUseGroupingRegistry
  > = ['always', 'auto', 'min2']
  const useGrouping: Intl.NumberFormatOptions['useGrouping'] =
    typeof options.useGrouping === 'boolean'
      ? options.useGrouping
      : validateString<keyof Intl.NumberFormatOptionsUseGroupingRegistry>(
          options.useGrouping,
          validGroupingValues,
        )

  return new Intl.NumberFormat(locales, {
    style,
    currency,
    currencyDisplay,
    unit,
    unitDisplay,
    minimumIntegerDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    minimumSignificantDigits,
    maximumSignificantDigits,
    notation,
    compactDisplay,
    useGrouping,
  }).format(input)
}

export default handler
