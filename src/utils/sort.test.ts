import { describe, expect, it } from 'vitest'
import type { SearchResult } from '@/types/search'
import { sortSearchResults } from '@/utils/sort'

const makeResult = (
  overrides: Partial<SearchResult['data']> & { resource_path?: string },
): SearchResult => ({
  resource_path: overrides.resource_path ?? '/exposure/1/file.cellml',
  data: {
    aliased_uri: [],
    cellml_keyword: [],
    commit_authored_ts: [],
    created_ts: overrides.created_ts ?? [],
    description: overrides.description ?? [],
    exposure_alias: [],
    citation_author_family_name: [],
    citation_id: [],
    model_author: [],
  },
})

const resultA = makeResult({
  resource_path: '/exposure/10/a.cellml',
  description: ['Alpha model'],
  created_ts: ['1000'],
})
const resultB = makeResult({
  resource_path: '/exposure/20/b.cellml',
  description: ['Beta model'],
  created_ts: ['2000'],
})
const resultC = makeResult({
  resource_path: '/exposure/5/c.cellml',
  description: ['Gamma model'],
  created_ts: ['500'],
})

describe('sortSearchResults – description', () => {
  it('sorts by description ascending', () => {
    const sorted = sortSearchResults([resultC, resultB, resultA], 'description-asc')
    expect(sorted.map((r) => r.data.description[0])).toEqual([
      'Alpha model',
      'Beta model',
      'Gamma model',
    ])
  })

  it('sorts by description descending', () => {
    const sorted = sortSearchResults([resultA, resultC, resultB], 'description-desc')
    expect(sorted.map((r) => r.data.description[0])).toEqual([
      'Gamma model',
      'Beta model',
      'Alpha model',
    ])
  })

  it('places items with null description at the end when sorting ascending', () => {
    const nullDesc = makeResult({ resource_path: '/exposure/99/x.cellml' })
    const sorted = sortSearchResults([nullDesc, resultA], 'description-asc')
    expect(sorted[0].data.description[0]).toBe('Alpha model')
    expect(sorted[1].data.description).toEqual([])
  })

  it('places items with null description at the end when sorting descending', () => {
    const nullDesc = makeResult({ resource_path: '/exposure/99/x.cellml' })
    const sorted = sortSearchResults([nullDesc, resultA], 'description-desc')
    expect(sorted[0].data.description[0]).toBe('Alpha model')
    expect(sorted[1].data.description).toEqual([])
  })
})

describe('sortSearchResults – id', () => {
  it('sorts by exposure ID ascending', () => {
    const sorted = sortSearchResults([resultB, resultC, resultA], 'id-asc')
    expect(sorted.map((r) => r.resource_path)).toEqual([
      '/exposure/5/c.cellml',
      '/exposure/10/a.cellml',
      '/exposure/20/b.cellml',
    ])
  })

  it('sorts by exposure ID descending', () => {
    const sorted = sortSearchResults([resultA, resultC, resultB], 'id-desc')
    expect(sorted.map((r) => r.resource_path)).toEqual([
      '/exposure/20/b.cellml',
      '/exposure/10/a.cellml',
      '/exposure/5/c.cellml',
    ])
  })

  it('places items with an unparseable ID at the end', () => {
    const noId = makeResult({ resource_path: '/other/path/file.cellml', description: ['No ID'] })
    const sorted = sortSearchResults([noId, resultA], 'id-asc')
    expect(sorted[0].resource_path).toBe('/exposure/10/a.cellml')
    expect(sorted[1].resource_path).toBe('/other/path/file.cellml')
  })
})

describe('sortSearchResults – date', () => {
  it('sorts by created_ts ascending', () => {
    const sorted = sortSearchResults([resultB, resultA, resultC], 'date-asc')
    expect(sorted.map((r) => r.data.created_ts[0])).toEqual(['500', '1000', '2000'])
  })

  it('sorts by created_ts descending', () => {
    const sorted = sortSearchResults([resultC, resultA, resultB], 'date-desc')
    expect(sorted.map((r) => r.data.created_ts[0])).toEqual(['2000', '1000', '500'])
  })

  it('places items without a date at the end', () => {
    const noDate = makeResult({ resource_path: '/exposure/99/x.cellml', description: ['No date'] })
    const sorted = sortSearchResults([noDate, resultA], 'date-asc')
    expect(sorted[0].data.created_ts[0]).toBe('1000')
    expect(sorted[1].data.created_ts).toEqual([])
  })

  it('places items with an unparseable date at the end', () => {
    const invalidDate = makeResult({
      resource_path: '/exposure/99/invalid.cellml',
      description: ['Invalid date'],
      created_ts: ['not-a-number'],
    })
    const sorted = sortSearchResults([invalidDate, resultA], 'date-asc')
    expect(sorted[0].data.created_ts[0]).toBe('1000')
    expect(sorted[1].resource_path).toBe('/exposure/99/invalid.cellml')
  })
})

describe('sortSearchResults – does not mutate the original array', () => {
  it('returns a new array and leaves the source unchanged', () => {
    const input = [resultC, resultA, resultB]
    const sorted = sortSearchResults(input, 'description-asc')
    expect(sorted).not.toBe(input)
    expect(input[0].resource_path).toBe('/exposure/5/c.cellml')
  })
})
