import * as v from 'valibot'
import {
  HeadTagTypes,
  type DynamicPathSegment,
  type MetaEntry,
  type RouteDeclaration,
  type StaticPathSegment,
} from '../component.types'
import { FormulaSchema } from './formula-schema'
import { record, SCHEMA_DESCRIPTIONS } from './valibot-schemas'

const HeadTagTypesSchema = v.pipe(
  v.enum(HeadTagTypes),
  v.description('Available head tags.'),
)

const MetaEntrySchema: v.GenericSchema<unknown, MetaEntry> = v.pipe(
  v.object({
    tag: v.pipe(
      HeadTagTypesSchema,
      v.description('Type of the head tag such as meta, link, script.'),
    ),
    attrs: v.pipe(
      record(
        v.pipe(v.string(), v.description('The name of the head tag attribute')),
        v.pipe(
          FormulaSchema,
          v.description(
            'The Formula evaluating to the value of the head tag attribute',
          ),
        ),
      ),
      v.description('Attributes for the head tag.'),
    ),
    content: v.pipe(
      FormulaSchema,
      v.description(
        'Optional content for the head tag, used for tags like style or script.',
      ),
    ),
  }),
  v.description(
    'Schema defining a single meta entry for the head of the document.',
  ),
)

// Route Models
const StaticPathSegmentSchema: v.GenericSchema<unknown, StaticPathSegment> =
  v.pipe(
    v.object({
      type: v.pipe(v.literal('static'), v.description('Static path segment')),
      name: v.pipe(
        v.string(),
        v.description('Name of the static path segment'),
      ),
      optional: v.pipe(
        v.nullish(v.boolean()),
        v.description('Indicates if the segment is optional'),
      ),
    }),
    v.description('Schema for static path segments'),
  )

const DynamicPathSegmentSchema: v.GenericSchema<unknown, DynamicPathSegment> =
  v.pipe(
    v.object({
      type: v.pipe(
        v.literal('param'),
        v.description('Dynamic path segment representing a URL parameter'),
      ),
      name: v.pipe(v.string(), v.description('Name of the URL parameter')),
      testValue: v.pipe(
        v.string(),
        v.description(SCHEMA_DESCRIPTIONS.testData('dynamic URL parameter')),
      ),
      optional: v.pipe(
        v.nullish(v.boolean()),
        v.description('Indicates if the URL parameter is optional'),
      ),
    }),
    v.description('Schema for dynamic path segments (URL parameters)'),
  )

export const RouteSchema: v.GenericSchema<unknown, RouteDeclaration> = v.pipe(
  v.object({
    path: v.pipe(
      v.array(v.union([StaticPathSegmentSchema, DynamicPathSegmentSchema])),
      v.description(
        'Array of path segments defining the route path. Each segment can be static or dynamic (parameterized). Each segment must be unique.',
      ),
    ),
    query: v.pipe(
      record(
        v.pipe(
          v.string(),
          v.description('Name of the query parameter. This must be unique.'),
        ),
        v.pipe(
          v.object({
            name: v.pipe(
              v.string(),
              v.description('Name of the query parameter. Same as the key'),
            ),
            testValue: v.pipe(
              v.any(),
              v.description(
                'Test value for the query parameter. Test data is only used while building the component in the Nordcraft editor.',
              ),
            ),
          }),
          v.description(
            'Schema defining a query parameter. Nordcraft supports having query parameters with multiple values. Defining a query parameter as an array will allow multiple values for that parameter.',
          ),
        ),
      ),
    ),
    info: v.pipe(
      v.nullish(
        v.object({
          title: v.pipe(
            v.nullish(v.object({ formula: FormulaSchema })),
            v.description(
              'Title of the page, used in the document title and SEO metadata.',
            ),
          ),
          description: v.pipe(
            v.nullish(v.object({ formula: FormulaSchema })),
            v.description(
              'Description of the page, used in SEO metadata and social sharing previews.',
            ),
          ),
          icon: v.pipe(
            v.nullish(v.object({ formula: FormulaSchema })),
            v.description(
              'URL to the icon of the page, used in SEO metadata and social sharing previews.',
            ),
          ),
          language: v.pipe(
            v.nullish(v.object({ formula: FormulaSchema })),
            v.description(
              'Language of the page, used in the lang attribute of the HTML document.',
            ),
          ),
          charset: v.pipe(
            v.nullish(v.object({ formula: FormulaSchema })),
            v.description(
              'Character set of the page, used in the meta charset tag of the HTML document.',
            ),
          ),
          meta: v.pipe(
            v.nullish(
              record(
                v.pipe(
                  v.string(),
                  v.description('The key of the meta data record.'),
                ),
                MetaEntrySchema,
              ),
            ),
            v.description(
              'Additional meta tags to include in the head of the document. Each entry defines a tag and its attributes.',
            ),
          ),
        }),
      ),
      v.description(
        'Contains additional information for the route such as SEO metadata.',
      ),
    ),
  }),
  v.description(
    'Schema defining the route information for a page as well as SEO related metadata.',
  ),
)
