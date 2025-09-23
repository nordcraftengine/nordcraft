import type { FormulaHandler } from '@nordcraft/core/dist/types'

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
  const validateString = <T = string>(
    value: unknown,
    allowedValues?: string[],
  ): T | undefined =>
    typeof value === 'string' && (allowedValues?.includes(value) ?? true)
      ? (value as T)
      : undefined

  const options: Partial<
    Intl.DateTimeFormatOptions & { locale: string | string[] }
  > = opt
  const dateStyle = validateString<Intl.DateTimeFormatOptions['dateStyle']>(
    options.dateStyle,
    ['full', 'long', 'medium', 'short'],
  )
  const timeStyle = validateString<Intl.DateTimeFormatOptions['timeStyle']>(
    options.timeStyle,
    ['full', 'long', 'medium', 'short'],
  )
  const calendar = validateString(options.calendar)
  const weekday = validateString<Intl.DateTimeFormatOptions['weekday']>(
    options.weekday,
    ['long', 'short', 'narrow'],
  )
  const era = validateString<Intl.DateTimeFormatOptions['era']>(options.era, [
    'long',
    'short',
    'narrow',
  ])
  const year = validateString<Intl.DateTimeFormatOptions['year']>(
    options.year,
    ['numeric', '2-digit'],
  )
  const month = validateString<Intl.DateTimeFormatOptions['month']>(
    options.month,
    ['long', 'short', 'narrow', 'numeric', '2-digit'],
  )
  const day = validateString<Intl.DateTimeFormatOptions['day']>(options.day, [
    'numeric',
    '2-digit',
  ])
  const hour = validateString<Intl.DateTimeFormatOptions['hour']>(
    options.hour,
    ['numeric', '2-digit'],
  )
  const minute = validateString<Intl.DateTimeFormatOptions['minute']>(
    options.minute,
    ['numeric', '2-digit'],
  )
  const second = validateString<Intl.DateTimeFormatOptions['second']>(
    options.second,
    ['numeric', '2-digit'],
  )
  const timeZoneName = validateString<
    Intl.DateTimeFormatOptions['timeZoneName']
  >(options.timeZoneName, [
    'long',
    'short',
    'shortOffset',
    'longOffset',
    'shortGeneric',
    'longGeneric',
  ])
  const timeZone = validateString<Intl.DateTimeFormatOptions['timeZone']>(
    options.timeZone,
  )
  const hour12 =
    options.hour12 === true
      ? true
      : options.hour12 === false
        ? false
        : undefined

  return Intl.DateTimeFormat(locales, {
    dateStyle,
    timeStyle,
    calendar,
    weekday,
    era,
    year,
    month,
    day,
    hour,
    minute,
    second,
    timeZoneName,
    timeZone,
    hour12,
  }).format(date)
}

export default handler
