import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSearchService } from '@/services'
import type { IndexKindResponse, SearchResult } from '@/types/search'

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes in milliseconds

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

export const useSearchStore = defineStore('search', () => {
  const categories = ref<CategoryData[]>([])
  const lastFetchTime = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchResultsCache = ref<Map<string, SearchResultCache>>(new Map())

  const isCacheValid = (): boolean => {
    if (!lastFetchTime.value) return false
    const now = Date.now()
    return now - lastFetchTime.value < CACHE_TTL
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
    const cached = searchResultsCache.value.get(cacheKey)

    // Return cached results if valid.
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.results
    }

    try {
      const searchService = getSearchService()
      const response = await searchService.searchIndexTerm(kind, term)
      const results = response?.resource_paths || []

      // Cache the results.
      searchResultsCache.value.set(cacheKey, {
        kind,
        term,
        results,
        timestamp: Date.now(),
      })

      return results
    } catch (err) {
      console.error('Search error:', err)
      throw err
    }
  }

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    searchIndexTerm,
  }
})
