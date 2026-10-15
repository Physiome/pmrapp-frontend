import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SearchResultsMessage from '@/components/atoms/SearchResultsMessage.vue'
import type { SearchFilter, SearchResult } from '@/types/search'

const makeResults = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: i }) as unknown as SearchResult)

const mountMessage = (query: string, results = makeResults(2), filters: SearchFilter[] = []) =>
  mount(SearchResultsMessage, {
    props: { results, isLoading: false, error: null, term: '', query, filters },
  })

describe('SearchResultsMessage.vue query text', () => {
  it('joins unquoted words with "and", matching the keyword chips', () => {
    const wrapper = mountMessage('cardiac myocyte')
    expect(wrapper.text()).toBe('2 results for cardiac and myocyte.')
  })

  it('keeps a quoted phrase as one term with its quotes', () => {
    const wrapper = mountMessage('calcium "cardiac myocyte"')
    expect(wrapper.text()).toBe('2 results for calcium and "cardiac myocyte".')
  })

  it('separates three or more terms with commas', () => {
    const wrapper = mountMessage('heart cell calcium')
    expect(wrapper.text()).toBe('2 results for heart, cell, and calcium.')
  })

  it('adds filters after the query terms', () => {
    const wrapper = mountMessage('cardiac myocyte', makeResults(1), [
      { kind: 'cellml_keyword', term: 'cardiac' },
    ] as SearchFilter[])
    expect(wrapper.text()).toMatch(/^1 result for cardiac and myocyte with .+: cardiac\.$/)
  })

  it('uses the same terms when there are no results', () => {
    const wrapper = mountMessage('cardiac myocyte', [])
    expect(wrapper.text()).toBe('No results for cardiac and myocyte.')
  })

  it('escapes HTML in query terms', () => {
    const wrapper = mountMessage('<b>bold</b> cell')
    expect(wrapper.find('b').exists()).toBe(false)
    expect(wrapper.text()).toBe('2 results for <b>bold</b> and cell.')
  })
})
