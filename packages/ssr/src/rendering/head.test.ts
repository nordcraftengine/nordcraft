import { describe, expect, test } from 'bun:test'
import { urlWithCacheBuster } from './head'

describe('urlWithCacheBuster', () => {
  test('appends or replaces v query param using URL for relative, absolute, and hash URLs', () => {
    expect({
      unchanged: urlWithCacheBuster('/_static/reset.css'),
      plainUrl: urlWithCacheBuster('/_static/reset.css', 'sha-123'),
      existingQuery: urlWithCacheBuster(
        '/.nordcraft/components/HomePage.js?fixture=basic',
        'sha-123',
      ),
      existingVersion: urlWithCacheBuster(
        '/_static/reset.css?v=old',
        'sha-123',
      ),
      trailingQuestionMark: urlWithCacheBuster(
        '/_static/reset.css?',
        'sha-123',
      ),
      hashFragment: urlWithCacheBuster('/_static/reset.css#section', 'sha-123'),
      absoluteUrl: urlWithCacheBuster(
        'https://cdn.example.com/cc_Home.js?foo=1#top',
        'sha-123',
      ),
      protocolRelativeUrl: urlWithCacheBuster(
        '//cdn.example.com/cc_Home.js?foo=1',
        'sha-123',
      ),
    }).toEqual({
      unchanged: '/_static/reset.css',
      plainUrl: '/_static/reset.css?v=sha-123',
      existingQuery:
        '/.nordcraft/components/HomePage.js?fixture=basic&v=sha-123',
      existingVersion: '/_static/reset.css?v=sha-123',
      trailingQuestionMark: '/_static/reset.css?v=sha-123',
      hashFragment: '/_static/reset.css?v=sha-123#section',
      absoluteUrl: 'https://cdn.example.com/cc_Home.js?foo=1&v=sha-123#top',
      protocolRelativeUrl: '//cdn.example.com/cc_Home.js?foo=1&v=sha-123',
    })
  })
})
