import { describe, expect, test } from 'bun:test'
import { parseSearchQuery, type SearchQueryToken } from './parseSearchQuery'

describe('parseSearchQuery', () => {
  test('it parses simple strings as a freetext token', () => {
    const result = parseSearchQuery('Some string')
    expect(result).toEqual([
      {
        kind: 'freetext',
        exclude: false,
        value: 'Some string',
        exact: false,
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses quoted strings as an exact freetext token', () => {
    const result = parseSearchQuery('"Some string"')
    expect(result).toEqual([
      {
        kind: 'freetext',
        exclude: false,
        value: 'Some string',
        exact: true,
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses case-insensitive regex', () => {
    const result = parseSearchQuery('/some string/i')
    expect(result).toEqual([
      {
        kind: 'freetext',
        exclude: false,
        value: /some string/i,
        exact: false,
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses case-sensitive regex', () => {
    const result = parseSearchQuery('/Some string/')
    expect(result).toEqual([
      {
        kind: 'freetext',
        exclude: false,
        value: /Some string/,
        exact: false,
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses Variable,my-var as a freetext literal', () => {
    const result = parseSearchQuery('Variable,my-var')
    expect(result).toEqual([
      {
        kind: 'freetext',
        exclude: false,
        value: 'Variable,my-var',
        exact: false,
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses element tag selector', () => {
    const result = parseSearchQuery('<div>')
    expect(result).toEqual([
      {
        kind: 'selector',
        exclude: false,
        nodeKind: 'element',
        name: { value: 'div', matchType: 'exact' },
        classes: [],
        attributes: [],
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses element selector with id, classes, and attributes', () => {
    const result = parseSearchQuery(
      '<div#hero.btn.primary[alt][href*="/blog"][data-kind="cta"]>',
    )
    expect(result).toEqual([
      {
        kind: 'selector',
        exclude: false,
        nodeKind: 'element',
        name: { value: 'div', matchType: 'exact' },
        id: { value: 'hero', matchType: 'exact' },
        classes: [
          { value: 'btn', matchType: 'exact' },
          { value: 'primary', matchType: 'exact' },
        ],
        attributes: [
          { name: 'alt' },
          { name: 'href', operator: '*=', value: '/blog' },
          { name: 'data-kind', operator: '=', value: 'cta' },
        ],
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses PascalCase, package, prefix, and wildcard component selectors', () => {
    const result = parseSearchQuery(
      '<Button[variant="danger"]> <ui/Card> <component:ui-> <component:"My Modal">',
    )
    expect(result).toEqual([
      {
        kind: 'selector',
        exclude: false,
        nodeKind: 'component',
        name: { value: 'Button', matchType: 'exact' },
        classes: [],
        attributes: [{ name: 'variant', operator: '=', value: 'danger' }],
      },
      {
        kind: 'selector',
        exclude: false,
        nodeKind: 'component',
        package: { value: 'ui', matchType: 'prefix' },
        name: { value: 'Card', matchType: 'prefix' },
        classes: [],
        attributes: [],
      },
      {
        kind: 'selector',
        exclude: false,
        nodeKind: 'component',
        name: { value: 'ui-', matchType: 'prefix' },
        classes: [],
        attributes: [],
      },
      {
        kind: 'selector',
        exclude: false,
        nodeKind: 'component',
        name: { value: 'My Modal', matchType: 'exact' },
        classes: [],
        attributes: [],
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses style, event, and slot attribute namespaces in selectors', () => {
    const result = parseSearchQuery(
      '<[style:display=flex][event:click][slot="header"]>',
    )
    expect(result).toEqual([
      {
        kind: 'selector',
        exclude: false,
        classes: [],
        attributes: [
          { namespace: 'style', name: 'display', operator: '=', value: 'flex' },
          { namespace: 'event', name: 'click' },
          { namespace: 'slot', name: 'slot', operator: '=', value: 'header' },
        ],
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses reference queries with prefix, exact quoted, and wildcard segments', () => {
    const result = parseSearchQuery(
      '@workflow:"Broadcaster"/"Emit event" @component:ui- @component:"ui-" @component:*button* @event:* @formula:/formatDate ref:component:Button',
    )
    expect(result).toEqual([
      {
        kind: 'reference',
        exclude: false,
        targetKind: 'workflow',
        rootScoped: false,
        segments: [
          { value: 'Broadcaster', matchType: 'exact' },
          { value: 'Emit event', matchType: 'exact' },
        ],
      },
      {
        kind: 'reference',
        exclude: false,
        targetKind: 'component',
        rootScoped: false,
        segments: [{ value: 'ui-', matchType: 'prefix' }],
      },
      {
        kind: 'reference',
        exclude: false,
        targetKind: 'component',
        rootScoped: false,
        segments: [{ value: 'ui-', matchType: 'exact' }],
      },
      {
        kind: 'reference',
        exclude: false,
        targetKind: 'component',
        rootScoped: false,
        segments: [
          {
            value: '*button*',
            matchType: 'wildcard',
            regex: /^.*button.*$/i,
          },
        ],
      },
      {
        kind: 'reference',
        exclude: false,
        targetKind: 'event',
        rootScoped: false,
        segments: [
          {
            value: '*',
            matchType: 'wildcard',
            regex: /^.*$/i,
          },
        ],
      },
      {
        kind: 'reference',
        exclude: false,
        targetKind: 'formula',
        rootScoped: true,
        segments: [{ value: 'formatDate', matchType: 'prefix' }],
      },
      {
        kind: 'reference',
        exclude: false,
        targetKind: 'component',
        rootScoped: false,
        segments: [{ value: 'Button', matchType: 'prefix' }],
      },
    ] satisfies SearchQueryToken[])
  })

  test('it parses scope, type, negation, and freetext tokens together', () => {
    const result = parseSearchQuery(
      'in:"Header" -in:OldHeader is:element <button.primary> -<[disabled]> Submit form',
    )
    expect(result).toEqual([
      {
        kind: 'scope',
        exclude: false,
        segments: [{ value: 'Header', matchType: 'exact' }],
      },
      {
        kind: 'scope',
        exclude: true,
        segments: [{ value: 'OldHeader', matchType: 'prefix' }],
      },
      {
        kind: 'type',
        exclude: false,
        value: 'element',
      },
      {
        kind: 'selector',
        exclude: false,
        nodeKind: 'element',
        name: { value: 'button', matchType: 'exact' },
        classes: [{ value: 'primary', matchType: 'exact' }],
        attributes: [],
      },
      {
        kind: 'selector',
        exclude: true,
        classes: [],
        attributes: [{ name: 'disabled' }],
      },
      {
        kind: 'freetext',
        exclude: false,
        value: 'Submit form',
        exact: false,
      },
    ] satisfies SearchQueryToken[])
  })

  test('it falls back to freetext for unrecognized @ or key:value strings (including removed @node, @formula-arg, @api-input, @animation)', () => {
    const result = parseSearchQuery(
      '@nordcraft/metadata @node:root @formula-arg:fn/x @api-input:api/in @animation:fade background: red',
    )
    expect(result).toEqual([
      {
        kind: 'freetext',
        exclude: false,
        value:
          '@nordcraft/metadata @node:root @formula-arg:fn/x @api-input:api/in @animation:fade background: red',
        exact: false,
      },
    ] satisfies SearchQueryToken[])
  })
})
