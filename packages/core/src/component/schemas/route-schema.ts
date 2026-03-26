import { z } from 'zod'
import type {
  DynamicPathSegment,
  MetaEntry,
  RouteDeclaration,
  StaticPathSegment,
} from '../component.types'
import { FormulaSchema } from './formula-schema'
import { SCHEMA_DESCRIPTIONS } from './zod-schemas'

const HeadTagTypesSchema: z.ZodType<any> = z
  .enum(['meta', 'link', 'script', 'noscript', 'style'])
  .describe('Available head tags.')

const MetaEntrySchema: z.ZodType<MetaEntry> = z
  .object({
    tag: HeadTagTypesSchema.describe(
      'Type of the head tag such as meta, link, script.',
    ),
    attrs: z
      .record(
        z.string().describe('The name of the head tag attribute'),
        FormulaSchema.describe(
          'The Formula evaluating to the value of the head tag attribute',
        ),
      )
      .describe('Attributes for the head tag.'),
    content: FormulaSchema.describe(
      'Optional content for the head tag, used for tags like style or script.',
    ),
  })
  .describe('Schema defining a single meta entry for the head of the document.')

// Route Models
const StaticPathSegmentSchema: z.ZodType<StaticPathSegment> = z
  .object({
    type: z.literal('static').describe('Static path segment'),
    name: z.string().describe('Name of the static path segment'),
    optional: z
      .boolean()
      .nullish()
      .describe('Indicates if the segment is optional'),
  })
  .describe('Schema for static path segments')

const DynamicPathSegmentSchema: z.ZodType<DynamicPathSegment> = z
  .object({
    type: z
      .literal('param')
      .describe('Dynamic path segment representing a URL parameter'),
    name: z.string().describe('Name of the URL parameter'),
    testValue: z
      .string()
      .describe(SCHEMA_DESCRIPTIONS.testData('dynamic URL parameter')),
    optional: z
      .boolean()
      .nullish()
      .describe('Indicates if the URL parameter is optional'),
  })
  .describe('Schema for dynamic path segments (URL parameters)')

export const RouteSchema: z.ZodType<RouteDeclaration> = z
  .object({
    path: z
      .array(z.union([StaticPathSegmentSchema, DynamicPathSegmentSchema]))
      .describe(
        'Array of path segments defining the route path. Each segment can be static or dynamic (parameterized). Each segment must be unique.',
      ),
    query: z.record(
      z.string().describe('Name of the query parameter. This must be unique.'),
      z
        .object({
          name: z
            .string()
            .describe('Name of the query parameter. Same as the key'),
          testValue: z
            .any()
            .describe(
              'Test value for the query parameter. Test data is only used while building the component in the Nordcraft editor.',
            ),
        })
        .describe(
          'Schema defining a query parameter. Nordcraft supports having query parameters with multiple values. Defining a query parameter as an array will allow multiple values for that parameter.',
        ),
    ),
    info: z
      .object({
        title: z
          .object({ formula: FormulaSchema })
          .nullish()
          .describe(
            'Title of the page, used in the document title and SEO metadata.',
          ),
        description: z
          .object({ formula: FormulaSchema })
          .nullish()
          .describe(
            'Description of the page, used in SEO metadata and social sharing previews.',
          ),
        icon: z
          .object({ formula: FormulaSchema })
          .nullish()
          .describe(
            'URL to the icon of the page, used in SEO metadata and social sharing previews.',
          ),
        language: z
          .object({ formula: FormulaSchema })
          .nullish()
          .describe(
            'Language of the page, used in the lang attribute of the HTML document.',
          ),
        charset: z
          .object({ formula: FormulaSchema })
          .nullish()
          .describe(
            'Character set of the page, used in the meta charset tag of the HTML document.',
          ),
        meta: z
          .record(
            z.string().describe('The key of the meta data record.'),
            MetaEntrySchema,
          )
          .nullish()
          .describe(
            'Additional meta tags to include in the head of the document. Each entry defines a tag and its attributes.',
          ),
      })
      .nullish()
      .describe(
        'Contains additional information for the route such as SEO metadata.',
      ),
  })
  .describe(
    'Schema defining the route information for a page as well as SEO related metadata.',
  )
