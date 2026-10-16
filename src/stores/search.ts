import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSearchService } from '@/services'
import type {
  IndexKindResponse,
  SearchFilter,
  SearchQueryRequest,
  SearchResult,
} from '@/types/search'

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes in milliseconds
const SEARCH_RESULTS_CACHE_MAX_SIZE = 200 // Keep up to 200 cached kind/term search entries.
const SEARCH_QUERY_CACHE_MAX_SIZE = 200 // Keep up to 200 cached free-text query entries.

export interface CategoryData {
  kind: string
  kindInfo: IndexKindResponse | null
  loading: boolean
  error: string | null
}

export interface SearchResultCache {
  kind: string
  term: string
  results: SearchResult[]
  timestamp: number
}

export interface SearchQueryCache {
  search: SearchQueryRequest
  results: SearchResult[]
  timestamp: number
}

interface TimedCacheEntry {
  timestamp: number
}

export const useSearchStore = defineStore('search', () => {
  const categories = ref<CategoryData[]>([])
  const lastFetchTime = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchResultsCache = ref<Map<string, SearchResultCache>>(new Map())
  const searchQueryCache = ref<Map<string, SearchQueryCache>>(new Map())
  // Chip order from the last search bar submission (free-text chips use TEXT_QUERY_KIND),
  // so the bar can be rebuilt in the order the user added the chips.
  const lastChipOrder = ref<SearchFilter[]>([])

  const pruneExpiredEntries = <T extends TimedCacheEntry>(cache: Map<string, T>, now: number) => {
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp >= CACHE_TTL) {
        cache.delete(key)
      }
    }
  }

  const touchCacheEntry = <T>(cache: Map<string, T>, key: string, value: T) => {
    cache.delete(key)
    cache.set(key, value)
  }

  const enforceMaxCacheSize = <T>(cache: Map<string, T>, maxSize: number) => {
    while (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value
      if (oldestKey === undefined) {
        break
      }
      cache.delete(oldestKey)
    }
  }

  const isCacheValid = (): boolean => {
    if (!lastFetchTime.value) return false
    const now = Date.now()
    return now - lastFetchTime.value < CACHE_TTL
  }

  // Removes empty query text and invalid filters
  // before using the payload for cache keys and API calls.
  const normaliseSearchQueryRequest = (request: SearchQueryRequest): SearchQueryRequest => {
    const normalisedRequest: SearchQueryRequest = {}

    if (typeof request.query === 'string') {
      const normalisedQuery = request.query.trim()
      if (normalisedQuery !== '') {
        normalisedRequest.query = normalisedQuery
      }
    }

    if (Array.isArray(request.filters)) {
      const validFilters = request.filters
        .map((filter) => ({
          kind: filter.kind.trim(),
          term: filter.term.trim(),
        }))
        .filter((filter) => filter.kind !== '' && filter.term !== '')

      if (validFilters.length > 0) {
        normalisedRequest.filters = validFilters
      }
    }

    return normalisedRequest
  }

  const fetchCategories = async (
    categoryIndexesOrForceRefresh?: string[] | boolean,
    forceRefreshParam?: boolean,
  ): Promise<void> => {
    // Normalise arguments to support both:
    // - fetchCategories(forceRefresh?: boolean)
    // - fetchCategories(categoryIndexes?: string[], forceRefresh?: boolean)
    let categoryIndexes: string[] = []
    let forceRefresh = false
    const existingCategoryKinds = categories.value.map((c) => c.kind)

    if (Array.isArray(categoryIndexesOrForceRefresh)) {
      categoryIndexes = categoryIndexesOrForceRefresh
      forceRefresh = !!forceRefreshParam
    } else if (typeof categoryIndexesOrForceRefresh === 'boolean') {
      forceRefresh = categoryIndexesOrForceRefresh
    }

    const areAllRequestedCategoriesCached =
      existingCategoryKinds.length > 0 &&
      (categoryIndexes.length === 0 ||
        categoryIndexes.every((idx) => existingCategoryKinds.includes(idx)))

    // Use cache if valid and not forcing refresh, and if existing categories cover requested indexes.
    if (!forceRefresh && isCacheValid() && areAllRequestedCategoriesCached) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const searchService = getSearchService()
      const response = await searchService.getIndexes()

      categories.value = response.indexes
        .filter((kind) => (categoryIndexes.length > 0 ? categoryIndexes.includes(kind) : true))
        .map((kind) => ({
          kind,
          kindInfo: null,
          loading: true,
          error: null,
        }))

      // Fetch data for each category.
      await Promise.all(
        categories.value.map(async (category) => {
          try {
            category.kindInfo = await searchService.getIndexKind(category.kind)
          } catch (err) {
            category.error = err instanceof Error ? err.message : 'Failed to load category'
          } finally {
            category.loading = false
          }
        }),
      )

      lastFetchTime.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load categories'
      console.error('Error loading categories:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const searchIndexTerm = async (
    kind: string,
    term: string,
    forceRefresh = false,
  ): Promise<SearchResult[]> => {
    const cacheKey = `${kind}:${term}`
    const now = Date.now()
    pruneExpiredEntries(searchResultsCache.value, now)
    const cached = searchResultsCache.value.get(cacheKey)

    // Return cached results if valid.
    if (!forceRefresh && cached) {
      touchCacheEntry(searchResultsCache.value, cacheKey, cached)
      return cached.results
    }

    try {
      const searchService = getSearchService()
      const response = await searchService.searchIndexTerm(kind, term)
      const results = response?.resource_paths || []

      // Cache the results.
      touchCacheEntry(searchResultsCache.value, cacheKey, {
        kind,
        term,
        results,
        timestamp: Date.now(),
      })
      enforceMaxCacheSize(searchResultsCache.value, SEARCH_RESULTS_CACHE_MAX_SIZE)

      return results
    } catch (err) {
      console.error('Search error:', err)
      throw err
    }
  }

  const searchQuery = async (
    searchQueryRequest: SearchQueryRequest,
    forceRefresh = false,
  ): Promise<SearchResult[]> => {
    const normalisedRequest = normaliseSearchQueryRequest(searchQueryRequest)
    const cacheKey = JSON.stringify(normalisedRequest)
    const now = Date.now()
    pruneExpiredEntries(searchQueryCache.value, now)
    const cached = searchQueryCache.value.get(cacheKey)

    // Return cached results if valid.
    if (!forceRefresh && cached) {
      touchCacheEntry(searchQueryCache.value, cacheKey, cached)
      return cached.results
    }

    try {
      const searchService = getSearchService()
      const response = await searchService.searchQuery(normalisedRequest)
      const results = response?.results || []

      // Cache the results.
      touchCacheEntry(searchQueryCache.value, cacheKey, {
        search: normalisedRequest,
        results,
        timestamp: Date.now(),
      })
      enforceMaxCacheSize(searchQueryCache.value, SEARCH_QUERY_CACHE_MAX_SIZE)

      return results
    } catch (err) {
      console.error('Search query error:', err)
      throw err
    }
  }

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    searchIndexTerm,
    searchQuery,
    lastChipOrder,
  }
})
