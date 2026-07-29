<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/atoms/ActionButton.vue'
import RefreshIcon from '@/components/icons/RefreshIcon.vue'
import SearchInput from '@/components/molecules/SearchInput.vue'
import SearchResults from '@/components/molecules/SearchResults.vue'
import SortDropdown from '@/components/molecules/SortDropdown.vue'
import { SEARCH_KIND_NAMES } from '@/constants/search'
import { useGlobalStateStore } from '@/stores/globalState'
import { useSearchStore } from '@/stores/search'
import type { SortOption } from '@/types/common'
import type { SearchResult } from '@/types/search'
import { buildQuerySearchQuery, parseQueryFiltersFromQuery } from '@/utils/search'
import {
  DEFAULT_SORT_OPTION,
  isValidSortOption,
  SORT_OPTIONS_GROUPED,
  sortSearchResults,
} from '@/utils/sort'

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const globalState = useGlobalStateStore()

const queryFilters = computed(() => parseQueryFiltersFromQuery(route.query, SEARCH_KIND_NAMES))
const activeFilter = computed(() => queryFilters.value[0] ?? null)
const kind = computed(() => activeFilter.value?.kind || '')
const term = computed(() => activeFilter.value?.term || '')
const searchQueryParam = computed(() => {
  const query = route.query.query
  if (Array.isArray(query)) {
    return typeof query[0] === 'string' ? query[0] : ''
  }

  return typeof query === 'string' ? query : ''
})
const searchResults = ref<SearchResult[]>([])
const isLoading = ref(false)
const resultsError = ref<string | null>(null)
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null)

const sortQuery = route.query.sort
const initialSort: SortOption =
  typeof sortQuery === 'string' && isValidSortOption(sortQuery) ? sortQuery : DEFAULT_SORT_OPTION
const sortBy = ref<SortOption>(initialSort)

watch(
  () => globalState.isSearchFocusRequested,
  (isRequested) => {
    if (isRequested) {
      searchInputRef.value?.searchInputRef?.focus()
      globalState.consumeSearchFocus()
    }
  },
)

watch(
  () => route.query.sort,
  (newSort) => {
    const nextSort =
      typeof newSort === 'string' && isValidSortOption(newSort) ? newSort : DEFAULT_SORT_OPTION
    if (sortBy.value !== nextSort) {
      sortBy.value = nextSort
    }
  },
)

// Sync sort with URL query parameters whilst preserving the current search params.
watch(sortBy, (newSort) => {
  const nextQuery: Record<string, string | string[]> = {}

  if (searchQueryParam.value) nextQuery.query = searchQueryParam.value

  for (const filter of queryFilters.value) {
    const existing = nextQuery[filter.kind]
    if (existing === undefined) {
      nextQuery[filter.kind] = filter.term
    } else if (Array.isArray(existing)) {
      existing.push(filter.term)
    } else {
      nextQuery[filter.kind] = [existing, filter.term]
    }
  }

  if (newSort !== DEFAULT_SORT_OPTION) nextQuery.sort = newSort
  router.replace({ query: nextQuery })
})

onMounted(async () => {
  await loadResults()
})

// Watch for route param changes to reload results.
watch(
  () => route.query,
  async () => {
    await loadResults()
  },
)

const loadResults = async (forceRefresh = false) => {
  const hasQuery = !!searchQueryParam.value
  const hasQueryFilters = queryFilters.value.length > 0

  if (!hasQuery && !hasQueryFilters) {
    // If no search parameters are provided, simply return to avoid an empty search.
    return
  }

  isLoading.value = true
  resultsError.value = null
  searchResults.value = []

  try {
    searchResults.value = await searchStore.searchQuery(
      {
        query: searchQueryParam.value || undefined,
        filters: queryFilters.value,
      },
      forceRefresh,
    )
  } catch (err) {
    resultsError.value = err instanceof Error ? err.message : 'Failed to load search results'
    console.error('Failed to load search results by query:', err)
  } finally {
    isLoading.value = false
  }
}

const handleSearch = (searchKind: string, searchTerm: string) => {
  router.push({
    path: '/search',
    query: buildQuerySearchQuery('', [{ kind: searchKind, term: searchTerm }], route.query),
  })
}

const handleQuerySearch = (request: {
  query?: string
  filters?: Array<{ kind: string; term: string }>
}) => {
  router.push({
    path: '/search',
    query: buildQuerySearchQuery(request.query ?? '', request.filters ?? [], route.query),
  })
}

const sortedResults = computed(() => sortSearchResults(searchResults.value, sortBy.value))

const hasResults = computed(() => searchResults.value.length > 0)

const handleRefresh = async () => {
  await loadResults(true)
}
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <SearchInput
      class="w-full lg:flex-1 lg:w-auto"
      ref="searchInputRef"
      :initial-kind="''"
      :initial-term="searchQueryParam"
      :initial-filters="queryFilters"
      @search="handleSearch"
      @querySearch="handleQuerySearch"
    />
    <div class="flex w-full gap-4 lg:w-auto lg:flex-row lg:items-center">
      <SortDropdown
        :disabled="!(hasResults || isLoading)"
        :model-value="sortBy"
        :options="SORT_OPTIONS_GROUPED"
        @update:model-value="(value) => (sortBy = value)"
      />
      <ActionButton
        :disabled="!(hasResults || isLoading)"
        variant="secondary"
        size="lg"
        content-section="Search Results"
        @click="handleRefresh"
      >
        <RefreshIcon />
        <span>{{ isLoading ? 'Loading...' : 'Refresh' }}</span>
      </ActionButton>
    </div>
  </div>
  <div class="mt-8">
    <main class="flex-1 min-w-0 relative">
      <SearchResults
        :results="sortedResults"
        :is-loading="isLoading"
        :error="resultsError"
        :term="term"
        :kind="kind"
        :query="searchQueryParam"
        :filters="queryFilters"
      />
    </main>
  </div>
</template>
