import { describe, expect, it } from 'vitest'
import { exposures, workspaces } from '@/mocks/search'
import {
  buildQuerySearchQuery,
  buildSearchQuery,
  filterItemsByQuery,
  getQueryTextFromRouteQuery,
  highlightTokens,
  isValidTerm,
  normaliseSearchText,
  parseQueryFiltersFromQuery,
} from './search'

describe('filterItemsByQuery', () => {
  it('returns filtered workspace results by search text', () => {
    const results = filterItemsByQuery({
      query: 'cipa 2017',
      items: workspaces,
    })

    expect(results).toHaveLength(1)
    expect(results[0].entity.id).toBe(505)
  })

  it('returns filtered workspace results by id', () => {
    const results = filterItemsByQuery({
      query: '505',
      items: workspaces,
    })

    expect(results).toHaveLength(1)
    expect(results[0].entity.id).toBe(505)
  })

  it('returns filtered exposure results by id', () => {
    const results = filterItemsByQuery({
      query: '386',
      items: exposures,
    })

    expect(results).toHaveLength(1)
    expect(results[0].entity.id).toBe(386)
  })

  it('does not match exposure by workspace_id or alias', () => {
    const byWorkspaceId = filterItemsByQuery({
      query: '505',
      items: exposures,
    })
    const byAlias = filterItemsByQuery({
      query: '5a0',
      items: exposures,
    })

    expect(byWorkspaceId).toHaveLength(0)
    expect(byAlias).toHaveLength(0)
  })

  it('returns all items when query is empty', () => {
    const results = filterItemsByQuery({
      query: '',
      items: workspaces,
    })

    expect(results).toHaveLength(workspaces.length)
  })

  it('returns count via .length', () => {
    const results = filterItemsByQuery({
      query: 'noble',
      items: exposures,
    })

    expect(results.length).toBe(1)
  })
})

describe('isValidTerm', () => {
  it('returns false for empty string', () => {
    expect(isValidTerm('')).toBe(false)
  })

  it('returns false for whitespace-only string', () => {
    expect(isValidTerm('   ')).toBe(false)
  })

  it('returns false for incomplete pubmed URN', () => {
    expect(isValidTerm('urn:miriam:pubmed:')).toBe(false)
  })

  it('returns false for unknown author placeholder', () => {
    expect(isValidTerm('unknown')).toBe(false)
    expect(isValidTerm('unknown unknown')).toBe(false)
    expect(isValidTerm('unknown, unknown')).toBe(false)
  })

  it('returns true for valid search term', () => {
    expect(isValidTerm("O'Hara-Rudy")).toBe(true)
    expect(isValidTerm('CiPA')).toBe(true)
    expect(isValidTerm('2017')).toBe(true)
  })
})

describe('normaliseSearchText', () => {
  it('replaces hyphens with spaces', () => {
    expect(normaliseSearchText("O'Hara-Rudy-CiPA")).toBe('O Hara Rudy CiPA')
  })

  it('replaces single quotes with spaces', () => {
    expect(normaliseSearchText("O'Hara")).toBe('O Hara')
  })

  it('replaces double quotes with spaces', () => {
    expect(normaliseSearchText('"quoted text"')).toBe('quoted text')
  })

  it('replaces commas with spaces', () => {
    expect(normaliseSearchText('a,b,c')).toBe('a b c')
  })

  it('replaces parentheses with spaces', () => {
    expect(normaliseSearchText('model (2017)')).toBe('model 2017')
  })

  it('replaces dots with spaces', () => {
    expect(normaliseSearchText('v1.0')).toBe('v1 0')
  })

  it('collapses multiple spaces into one', () => {
    expect(normaliseSearchText('O   Hara')).toBe('O Hara')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normaliseSearchText('  hello  ')).toBe('hello')
  })

  it('handles a full description string', () => {
    expect(normaliseSearchText("O'Hara-Rudy-CiPA-v1.0 (2017)")).toBe('O Hara Rudy CiPA v1 0 2017')
  })

  it('returns empty string for empty input', () => {
    expect(normaliseSearchText('')).toBe('')
  })

  it('preserves alphanumeric characters and spaces', () => {
    expect(normaliseSearchText('hello world 123')).toBe('hello world 123')
  })

  it('is case-preserving (lowercasing is left to the caller)', () => {
    expect(normaliseSearchText('CiPA')).toBe('CiPA')
    expect(normaliseSearchText('cipa')).toBe('cipa')
  })
})

describe('filter matching with normaliseSearchText', () => {
  const description = "O'Hara-Rudy-CiPA-v1.0 (2017)"

  const matches = (query: string): boolean => {
    const normalisedDesc = normaliseSearchText(description.toLowerCase())
    const normalisedQuery = normaliseSearchText(query.toLowerCase())
    const tokens = normalisedQuery.split(' ').filter((t) => t.length > 0)
    return tokens.every((token) => normalisedDesc.includes(token))
  }

  it('matches exact description', () => {
    expect(matches("O'Hara-Rudy-CiPA-v1.0 (2017)")).toBe(true)
  })

  it('matches with spaces instead of hyphens', () => {
    expect(matches('O Hara Rudy CiPA')).toBe(true)
  })

  it('matches partial query with spaces', () => {
    expect(matches('O Hara')).toBe(true)
    expect(matches('o hara rudy')).toBe(true)
    expect(matches('rudy cipa')).toBe(true)
  })

  it('matches single token', () => {
    expect(matches('cipa')).toBe(true)
    expect(matches('2017')).toBe(true)
  })

  it('matches with original hyphenated query', () => {
    expect(matches("O'Hara-Rudy-CiPA")).toBe(true)
  })

  it('matches with mixed separators in query', () => {
    expect(matches("O'Hara Rudy CiPA")).toBe(true)
  })

  it('does not match unrelated query', () => {
    expect(matches('Noble')).toBe(false)
    expect(matches('2018')).toBe(false)
  })

  it('does not match when not all tokens present', () => {
    expect(matches('Rudy Noble')).toBe(false)
  })
})

describe('highlightTokens', () => {
  it('highlights exact matched substring without index drift', () => {
    const segments = highlightTokens('Yasuhara', ['hara'])
    const highlightedText = segments.filter((s) => s.highlighted).map((s) => s.text)
    expect(highlightedText).toEqual(['hara'])
  })

  it('highlights expected substring in longer word', () => {
    const segments = highlightTokens('Vetharaniam', ['hara'])
    const highlightedText = segments.filter((s) => s.highlighted).map((s) => s.text)
    expect(highlightedText).toEqual(['hara'])
  })

  it('returns non-highlighted whole text when no token matches', () => {
    const segments = highlightTokens('Yasuhara', ['noble'])
    expect(segments).toEqual([{ text: 'Yasuhara', highlighted: false }])
  })
})

describe('parseQueryFiltersFromQuery', () => {
  const knownKinds = ['model_author', 'cellml_keyword', 'citation_author_family_name']

  it('parses a single flat filter param', () => {
    const filters = parseQueryFiltersFromQuery({ model_author: 'Noble' }, knownKinds)
    expect(filters).toEqual([{ kind: 'model_author', term: 'Noble' }])
  })

  it('parses multiple different kind params', () => {
    const filters = parseQueryFiltersFromQuery(
      { model_author: 'Noble', cellml_keyword: 'cardiac' },
      knownKinds,
    )
    expect(filters).toEqual([
      { kind: 'model_author', term: 'Noble' },
      { kind: 'cellml_keyword', term: 'cardiac' },
    ])
  })

  it('parses repeated values for the same kind', () => {
    const filters = parseQueryFiltersFromQuery(
      { cellml_keyword: ['cardiac', 'electrophysiology'] },
      knownKinds,
    )
    expect(filters).toEqual([
      { kind: 'cellml_keyword', term: 'cardiac' },
      { kind: 'cellml_keyword', term: 'electrophysiology' },
    ])
  })

  it('ignores unknown param keys', () => {
    const filters = parseQueryFiltersFromQuery(
      { model_author: 'Noble', unknown_kind: 'foo' },
      knownKinds,
    )
    expect(filters).toEqual([{ kind: 'model_author', term: 'Noble' }])
  })

  it('filters out whitespace-only terms', () => {
    const filters = parseQueryFiltersFromQuery(
      { model_author: '   ', cellml_keyword: 'cardiac' },
      knownKinds,
    )
    expect(filters).toEqual([{ kind: 'cellml_keyword', term: 'cardiac' }])
  })

  it('returns empty array when no known kind params are present', () => {
    const filters = parseQueryFiltersFromQuery({ query: 'heart', sort: 'relevance' }, knownKinds)
    expect(filters).toEqual([])
  })

  it('ignores legacy kind/term params', () => {
    const filters = parseQueryFiltersFromQuery(
      { kind: 'model_author', term: 'Noble', model_author: 'Noble' },
      knownKinds,
    )
    expect(filters).toEqual([{ kind: 'model_author', term: 'Noble' }])
  })
})

describe('getQueryTextFromRouteQuery', () => {
  it('reads the canonical query param', () => {
    expect(getQueryTextFromRouteQuery({ query: 'heart' })).toBe('heart')
  })

  it('falls back to legacy SearchableText when present', () => {
    expect(getQueryTextFromRouteQuery({ SearchableText: 'heart' })).toBe('heart')
    expect(getQueryTextFromRouteQuery({ SearchableText: ['heart', 'cardiac'] })).toBe('heart')
  })
})

describe('buildSearchQuery', () => {
  it('builds a single-filter flat query', () => {
    const result = buildSearchQuery('cellml_keyword', 'cardiac', {})
    expect(result).toEqual({ cellml_keyword: 'cardiac' })
  })

  it('preserves valid non-default sort option', () => {
    const result = buildSearchQuery('cellml_keyword', 'cardiac', { sort: 'date-desc' })
    expect(result).toEqual({ cellml_keyword: 'cardiac', sort: 'date-desc' })
  })
})

describe('buildQuerySearchQuery', () => {
  it('builds a query-only URL', () => {
    const result = buildQuerySearchQuery('heart', [], {})
    expect(result).toEqual({ query: 'heart' })
  })

  it('builds a URL with flat filter params', () => {
    const result = buildQuerySearchQuery(
      'heart',
      [
        { kind: 'cellml_keyword', term: 'cardiac' },
        { kind: 'model_author', term: 'Noble' },
      ],
      {},
    )
    expect(result).toEqual({ query: 'heart', cellml_keyword: 'cardiac', model_author: 'Noble' })
  })

  it('builds repeated params for the same kind', () => {
    const result = buildQuerySearchQuery(
      '',
      [
        { kind: 'cellml_keyword', term: 'cardiac' },
        { kind: 'cellml_keyword', term: 'electrophysiology' },
      ],
      {},
    )
    expect(result).toEqual({ cellml_keyword: ['cardiac', 'electrophysiology'] })
  })

  it('omits whitespace-only query text', () => {
    const result = buildQuerySearchQuery('   ', [], {})
    expect(result).not.toHaveProperty('query')
  })

  it('omits invalid filters with empty kind or term', () => {
    const result = buildQuerySearchQuery(
      '',
      [
        { kind: 'cellml_keyword', term: 'cardiac' },
        { kind: '   ', term: 'ignored' },
        { kind: 'model_author', term: '   ' },
      ],
      {},
    )
    expect(result).toEqual({ cellml_keyword: 'cardiac' })
  })
})
