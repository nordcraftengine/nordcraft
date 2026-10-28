import type { FormulaHandler } from '@nordcraft/core'

const str = <T = string>(value: unknown, allowed?: readonly string[]) =>
  typeof value === 'string' && (!allowed || allowed.includes(value))
    ? (value as T)
    : undefined

const num = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && value >= min && value <= max ? value : undefined

const styleValues = ['decimal', 'currency', 'percent', 'unit'] as const
const currencyDisplayValues = [
  'code',
  'symbol',
  'narrowSymbol',
  'name',
] as const
const unitDisplayValues = ['short', 'narrow', 'long'] as const
const notationValues = [
  'standard',
  'scientific',
  'engineering',
  'compact',
] as const
const compactDisplayValues = ['short', 'long'] as const
const groupingValues = ['always', 'auto', 'min2'] as const

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

  const options: Partial<
    Intl.NumberFormatOptions & { locale: string | string[] }
  > = opt
  const style = str<Intl.NumberFormatOptions['style']>(
    options.style,
    styleValues,
  )
  const currency =
    typeof options.currency === 'string' && options.currency.length === 3
      ? options.currency
      : undefined
  if (style === 'currency' && !currency) {
    return null
  }
  const unit = typeof options.unit === 'string' ? options.unit : undefined
  if (style === 'unit' && !unit) {
    return null
  }

  const useGrouping =
    typeof options.useGrouping === 'boolean'
      ? options.useGrouping
      : str<keyof Intl.NumberFormatOptionsUseGroupingRegistry>(
          options.useGrouping,
          groupingValues,
        )

  return new Intl.NumberFormat(locales, {
    style,
    currency,
    currencyDisplay: str<Intl.NumberFormatOptions['currencyDisplay']>(
      options.currencyDisplay,
      currencyDisplayValues,
    ),
    unit,
    unitDisplay: str<Intl.NumberFormatOptions['unitDisplay']>(
      options.unitDisplay,
      unitDisplayValues,
    ),
    minimumIntegerDigits: num(options.minimumIntegerDigits, 1, 21),
    minimumFractionDigits: num(options.minimumFractionDigits, 0, 100),
    maximumFractionDigits: num(options.maximumFractionDigits, 0, 100),
    minimumSignificantDigits: num(options.minimumSignificantDigits, 1, 21),
    maximumSignificantDigits: num(options.maximumSignificantDigits, 1, 21),
    notation: str<Intl.NumberFormatOptions['notation']>(
      options.notation,
      notationValues,
    ),
    compactDisplay: str<Intl.NumberFormatOptions['compactDisplay']>(
      options.compactDisplay,
      compactDisplayValues,
    ),
    useGrouping,
  }).format(input)
}

export default handler
