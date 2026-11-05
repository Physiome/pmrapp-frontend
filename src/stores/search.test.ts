import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchQueryRequest, SearchResult } from '@/types/search';

const { mockSearchQuery } = vi.hoisted(() => ({
  mockSearchQuery: vi.fn<(search: SearchQueryRequest) => Promise<{ results: SearchResult[] }>>(),
}));

vi.mock('@/services', () => ({
  getSearchService: () => ({
    searchQuery: mockSearchQuery,
  }),
}));

import { useSearchStore } from './search';

const buildResult = (resourcePath: string): SearchResult => ({
  resource_path: resourcePath,
  data: {
    aliased_uri: [],
    cellml_keyword: [],
    commit_authored_ts: [],
    created_ts: [],
    description: [],
    exposure_alias: [],
    citation_author_family_name: [],
    citation_id: [],
    model_author: [],
  },
});

describe('useSearchStore searchQuery', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockSearchQuery.mockReset();
  });

  it('supports query-only payloads', async () => {
    const store = useSearchStore();
    const results = [buildResult('/r/query-only')];
    mockSearchQuery.mockResolvedValue({ results });

    const payload: SearchQueryRequest = { query: 'query only' };
    const response = await store.searchQuery(payload);

    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith(payload);
    expect(response).toEqual(results);
  });

  it('passes query+filters payload through to the service', async () => {
    const store = useSearchStore();
    const payload: SearchQueryRequest = {
      query: 'combined query',
      filters: [{ kind: 'cellml_keyword', term: 'action-potential' }],
    };
    const results = [buildResult('/r/combined')];
    mockSearchQuery.mockResolvedValue({ results });

    const response = await store.searchQuery(payload);

    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith(payload);
    expect(response).toEqual(results);
  });

  it('trims query and filter values before calling the service', async () => {
    const store = useSearchStore();
    const payload: SearchQueryRequest = {
      query: '  combined query  ',
      filters: [{ kind: '  cellml_keyword  ', term: '  action-potential  ' }],
    };
    const results = [buildResult('/r/trimmed')];
    mockSearchQuery.mockResolvedValue({ results });

    const response = await store.searchQuery(payload);

    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith({
      query: 'combined query',
      filters: [{ kind: 'cellml_keyword', term: 'action-potential' }],
    });
    expect(response).toEqual(results);
  });

  it('preserves special characters in query values after trimming', async () => {
    const store = useSearchStore();
    const payload: SearchQueryRequest = {
      query: "  Noble (1962) Bhalla & Iyengar O'Hara-Rudy ca2+ ca2 +  ",
      filters: [{ kind: '  cellml_keyword  ', term: '  action-potential  ' }],
    };
    const results = [buildResult('/r/special-characters')];
    mockSearchQuery.mockResolvedValue({ results });

    const response = await store.searchQuery(payload);

    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith({
      query: "Noble (1962) Bhalla & Iyengar O'Hara-Rudy ca2+ ca2 +",
      filters: [{ kind: 'cellml_keyword', term: 'action-potential' }],
    });
    expect(response).toEqual(results);
  });

  it('supports filters-only payloads', async () => {
    const store = useSearchStore();
    const payload: SearchQueryRequest = {
      filters: [{ kind: 'model_author', term: 'Noble' }],
    };
    const results = [buildResult('/r/filters-only')];
    mockSearchQuery.mockResolvedValue({ results });

    const response = await store.searchQuery(payload);

    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith(payload);
    expect(response).toEqual(results);
  });

  it('omits empty query values before calling the service', async () => {
    const store = useSearchStore();
    const payload: SearchQueryRequest = {
      query: '',
      filters: [{ kind: 'model_author', term: 'Noble' }],
    };
    const results = [buildResult('/r/filters-only')];
    mockSearchQuery.mockResolvedValue({ results });

    const response = await store.searchQuery(payload);

    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith({
      filters: [{ kind: 'model_author', term: 'Noble' }],
    });
    expect(response).toEqual(results);
  });

  it('omits whitespace-only query values before calling the service', async () => {
    const store = useSearchStore();
    const payload: SearchQueryRequest = {
      query: '   ',
      filters: [{ kind: 'model_author', term: 'Noble' }],
    };
    const results = [buildResult('/r/filters-only')];
    mockSearchQuery.mockResolvedValue({ results });

    const response = await store.searchQuery(payload);

    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith({
      filters: [{ kind: 'model_author', term: 'Noble' }],
    });
    expect(response).toEqual(results);
  });

  it('filters out invalid filters before calling the service', async () => {
    const store = useSearchStore();
    const payload: SearchQueryRequest = {
      query: 'valid query',
      filters: [
        { kind: 'model_author', term: 'Noble' },
        { kind: '', term: 'invalid' },
        { kind: 'invalid', term: '' },
      ],
    };
    const results = [buildResult('/r/filtered-filters')];
    mockSearchQuery.mockResolvedValue({ results });

    const response = await store.searchQuery(payload);

    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith({
      query: 'valid query',
      filters: [{ kind: 'model_author', term: 'Noble' }],
    });
    expect(response).toEqual(results);
  });

  it('uses separate cache entries for distinct filters', async () => {
    const store = useSearchStore();
    const resultA = [buildResult('/r/filter-a')];
    const resultB = [buildResult('/r/filter-b')];

    mockSearchQuery.mockImplementation(async (search) => {
      const term = search.filters?.[0]?.term;
      return { results: term === 'a' ? resultA : resultB };
    });

    const payloadA: SearchQueryRequest = {
      query: 'same query',
      filters: [{ kind: 'cellml_keyword', term: 'a' }],
    };
    const payloadB: SearchQueryRequest = {
      query: 'same query',
      filters: [{ kind: 'cellml_keyword', term: 'b' }],
    };

    const first = await store.searchQuery(payloadA);
    const second = await store.searchQuery(payloadA);
    const third = await store.searchQuery(payloadB);

    expect(first).toEqual(resultA);
    expect(second).toEqual(resultA);
    expect(third).toEqual(resultB);
    expect(mockSearchQuery).toHaveBeenCalledTimes(2);
    expect(mockSearchQuery).toHaveBeenNthCalledWith(1, payloadA);
    expect(mockSearchQuery).toHaveBeenNthCalledWith(2, payloadB);
  });

  it('reuses the cache for semantically identical trimmed searches', async () => {
    const store = useSearchStore();
    const results = [buildResult('/r/trimmed-cache')];
    mockSearchQuery.mockResolvedValue({ results });

    const paddedPayload: SearchQueryRequest = {
      query: '  same query  ',
      filters: [{ kind: '  cellml_keyword  ', term: '  a  ' }],
    };
    const trimmedPayload: SearchQueryRequest = {
      query: 'same query',
      filters: [{ kind: 'cellml_keyword', term: 'a' }],
    };

    const first = await store.searchQuery(paddedPayload);
    const second = await store.searchQuery(trimmedPayload);

    expect(first).toEqual(results);
    expect(second).toEqual(results);
    expect(mockSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockSearchQuery).toHaveBeenCalledWith(trimmedPayload);
  });

  it('uses separate cache entries for different query text values', async () => {
    const store = useSearchStore();
    const unsanitisedResults = [buildResult('/r/unsanitised')];
    const trimmedResults = [buildResult('/r/trimmed')];

    mockSearchQuery.mockImplementation(async (search) => {
      if (search.query === 'Noble (1962)') {
        return { results: unsanitisedResults };
      }
      return { results: trimmedResults };
    });

    const unsanitisedPayload: SearchQueryRequest = {
      query: '  Noble (1962)  ',
      filters: [{ kind: 'cellml_keyword', term: 'a' }],
    };
    const trimmedPayload: SearchQueryRequest = {
      query: 'Noble 1962',
      filters: [{ kind: 'cellml_keyword', term: 'a' }],
    };

    const first = await store.searchQuery(unsanitisedPayload);
    const second = await store.searchQuery(trimmedPayload);

    expect(first).toEqual(unsanitisedResults);
    expect(second).toEqual(trimmedResults);
    expect(mockSearchQuery).toHaveBeenCalledTimes(2);
    expect(mockSearchQuery).toHaveBeenNthCalledWith(1, {
      query: 'Noble (1962)',
      filters: [{ kind: 'cellml_keyword', term: 'a' }],
    });
    expect(mockSearchQuery).toHaveBeenNthCalledWith(2, trimmedPayload);
  });
});
