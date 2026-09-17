import { describe, expect, test } from 'bun:test'
import { matchAndSplitWildcard, matchWildcard } from './matchWildcard'

describe('matchWildcard', () => {
  test('it should match exact strings case-insensitively', () => {
    expect(matchWildcard('my-component', 'my-component')).toBe(true)
    expect(matchWildcard('My-Component', 'my-component')).toBe(true)
    expect(matchWildcard('my-component', 'My-Component')).toBe(true)
    expect(matchWildcard('other-component', 'my-component')).toBe(false)
  })

  test('it should match wildcards at the end', () => {
    expect(matchWildcard('my-component', 'my-*')).toBe(true)
    expect(matchWildcard('my-cool-widget', 'my-*')).toBe(true)
    expect(matchWildcard('my-', 'my-*')).toBe(true)
    expect(matchWildcard('other-my-component', 'my-*')).toBe(false)
  })

  test('it should match wildcards at the beginning', () => {
    expect(matchWildcard('my-component', '*-component')).toBe(true)
    expect(matchWildcard('cool-component', '*-component')).toBe(true)
    expect(matchWildcard('-component', '*-component')).toBe(true)
    expect(matchWildcard('my-component-other', '*-component')).toBe(false)
  })

  test('it should match wildcards in the middle', () => {
    expect(matchWildcard('my-cool-component', 'my-*-component')).toBe(true)
    expect(matchWildcard('my-awesome-widget-component', 'my-*-component')).toBe(
      true,
    )
    expect(matchWildcard('my--component', 'my-*-component')).toBe(true)
    expect(matchWildcard('my-component', 'my-*-component')).toBe(false)
  })

  test('it should escape regex special characters', () => {
    expect(matchWildcard('my.component', 'my.component')).toBe(true)
    expect(matchWildcard('my-component', 'my.component')).toBe(false)
    expect(matchWildcard('my[component]', 'my[component]')).toBe(true)
  })
})

describe('matchAndSplitWildcard', () => {
  test('ends with wildcard', () => {
    expect(matchAndSplitWildcard('IconLink', 'Icon*')).toEqual({
      before: '',
      matched: 'Icon',
      after: 'Link',
    })
  })

  test('starts and ends with wildcard', () => {
    expect(matchAndSplitWildcard('ElementIcon', '*Icon*')).toEqual({
      before: 'Element',
      matched: 'Icon',
      after: '',
    })

    expect(matchAndSplitWildcard('ElementIconLink', '*Icon*')).toEqual({
      before: 'Element',
      matched: 'Icon',
      after: 'Link',
    })
  })

  test('starts with wildcard only', () => {
    expect(matchAndSplitWildcard('ElementIcon', '*Icon')).toEqual({
      before: 'Element',
      matched: 'Icon',
      after: '',
    })
  })

  test('no wildcard exactly match', () => {
    expect(matchAndSplitWildcard('Icon', 'Icon')).toEqual({
      before: '',
      matched: 'Icon',
      after: '',
    })
  })

  test('no match returns null', () => {
    expect(matchAndSplitWildcard('ElementIcon', 'Button*')).toBeNull()
  })
})
