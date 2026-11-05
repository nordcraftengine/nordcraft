import type { FontFamily } from '@nordcraft/core'
import { easySort } from '@nordcraft/core'

export const getFontCssUrl = ({
  fonts,
  baseForAbsoluteUrls,
  basePath = '/.toddle/fonts/stylesheet/css2',
}: {
  fonts: FontFamily[]
  baseForAbsoluteUrls?: string
  basePath?: string
}): Record<'block', string> | undefined => {
  if (fonts.length === 0) {
    return
  }
  const searchParams = new URLSearchParams()
  searchParams.set('display', 'block')
  for (const font of fonts) {
    const sortedWeights = easySort(
      (font.variants ?? []).filter((v) => !Number.isNaN(Number(v.weight))),
      (v) => Number(v.weight),
    )
    if (sortedWeights.length === 0) {
      continue
    }
    const italicRange = sortedWeights.filter((v) => v.italic)
    const standardRange = sortedWeights.filter((v) => !v.italic)
    // Utility function for returning a single weight or a range of weights
    // e.g. 400..700
    // TODO: enable when we start supporting variable fonts
    // const encodeVariableRange = (range: { weight: string }[]) => {
    //   if (range.length === 1) {
    //     return String(range[0].weight)
    //   }
    //   return `${range[0].weight}..${range[range.length - 1].weight}`
    // }
    const encodeStaticRange = (range: { weight: string }[], index?: number) =>
      range
        .map(
          (v) => `${typeof index === 'number' ? `${index},` : ''}${v.weight}`,
        )
        .join(';')
    // If the font has italic variants, we need to use multiple axes
    // See other axis definitions here https://fonts.google.com/variablefonts#axis-definitions
    const hasItalicVariants = italicRange.length > 0
    const wght = [standardRange, italicRange]
      .map((range, index) =>
        encodeStaticRange(range, hasItalicVariants ? index : undefined),
      )
      // TODO: When we have information about whether a font is variable, use the below code for variable fonts
      // range.length > 0
      //   ? `${hasItalicVariants ? `${index},` : ''}${encodeVariableRange(
      //       range,
      //     )}`
      //   : undefined,
      // )
      .filter(Boolean)
      .join(';')
    let familyValue = font.family
    if (hasItalicVariants) {
      // See https://fonts.google.com/knowledge/glossary/italic_axis
      familyValue += `:ital,wght@${wght}`
    } else {
      familyValue += `:wght@${wght}`
    }
    searchParams.append('family', familyValue)
  }
  const path = `${basePath}?${searchParams.toString()}`
  try {
    const url =
      typeof baseForAbsoluteUrls === 'string'
        ? new URL(path, baseForAbsoluteUrls).toString()
        : path
    return {
      // Eventually, we expect to support multiple types of font-display properties
      // and we might need to return a url for each type of font-display (e.g. swap, block, fallback)
      block: url,
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
}

// Replaced at build time in dist/rendering/fonts.js with the esbuild-minified bundle by scripts/build.ts
export const FONT_LOADER_SCRIPT: string = '__FONT_LOADER_SCRIPT__'

export const getFontLoaderScript = (fontUrls: string[]) =>
  FONT_LOADER_SCRIPT.replace(
    '__FONT_URLS__',
    // Function replacer so `$` sequences in URLs aren't interpreted,
    // and escape `<` so a URL can never close an inline <script>
    () => JSON.stringify(fontUrls).replace(/</g, '\\u003c'),
  )
