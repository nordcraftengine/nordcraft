import type { FormulaHandler } from '@nordcraft/core'

const str = <T = string>(value: unknown, allowed?: readonly string[]) =>
  typeof value === 'string' && (!allowed || allowed.includes(value))
    ? (value as T)
    : undefined

const fullShort = ['full', 'long', 'medium', 'short'] as const
const textStyle = ['long', 'short', 'narrow'] as const
const num2digit = ['numeric', '2-digit'] as const
const monthValues = [...textStyle, ...num2digit]
const timeZoneNameValues = [
  'long',
  'short',
  'shortOffset',
  'longOffset',
  'shortGeneric',
  'longGeneric',
] as const

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
 */
const handler: FormulaHandler<string> = ([date, loc, opt]) => {
  if (!date || !(date instanceof Date)) {
    return null
  }
  const locales =
    typeof loc === 'string' && loc.length > 0
      ? loc
      : Array.isArray(loc) && loc.every((l) => typeof l === 'string')
        ? (loc as string[])
        : undefined
  if (!opt || typeof opt !== 'object') {
    return Intl.DateTimeFormat(locales).format(date)
  }

  const options: Partial<
    Intl.DateTimeFormatOptions & { locale: string | string[] }
  > = opt

  return Intl.DateTimeFormat(locales, {
    dateStyle: str<Intl.DateTimeFormatOptions['dateStyle']>(
      options.dateStyle,
      fullShort,
    ),
    timeStyle: str<Intl.DateTimeFormatOptions['timeStyle']>(
      options.timeStyle,
      fullShort,
    ),
    calendar: str(options.calendar),
    weekday: str<Intl.DateTimeFormatOptions['weekday']>(
      options.weekday,
      textStyle,
    ),
    era: str<Intl.DateTimeFormatOptions['era']>(options.era, textStyle),
    year: str<Intl.DateTimeFormatOptions['year']>(options.year, num2digit),
    month: str<Intl.DateTimeFormatOptions['month']>(options.month, monthValues),
    day: str<Intl.DateTimeFormatOptions['day']>(options.day, num2digit),
    hour: str<Intl.DateTimeFormatOptions['hour']>(options.hour, num2digit),
    minute: str<Intl.DateTimeFormatOptions['minute']>(
      options.minute,
      num2digit,
    ),
    second: str<Intl.DateTimeFormatOptions['second']>(
      options.second,
      num2digit,
    ),
    timeZoneName: str<Intl.DateTimeFormatOptions['timeZoneName']>(
      options.timeZoneName,
      timeZoneNameValues,
    ),
    timeZone: str(options.timeZone),
    hour12: typeof options.hour12 === 'boolean' ? options.hour12 : undefined,
  }).format(date)
}

export default handler
