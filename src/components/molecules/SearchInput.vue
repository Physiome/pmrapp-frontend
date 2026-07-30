<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import ActionButton from '@/components/atoms/ActionButton.vue'
import SearchField from '@/components/atoms/SearchField.vue'
import ArrowRightIcon from '@/components/icons/ArrowRightIcon.vue'
import SearchSuggestions from '@/components/molecules/SearchSuggestions.vue'
import type { SearchFilter, SearchQueryRequest } from '@/types/search'

const props = withDefaults(
  defineProps<{
    initialTerm?: string
    initialKind?: string
    initialFilters?: SearchFilter[]
    inOverlay?: boolean
  }>(),
  {
    initialTerm: '',
    initialKind: '',
    initialFilters: () => [],
  },
)

const emit = defineEmits<{
  (e: 'search', searchKind: string, searchTerm: string): void
  (e: 'querySearch', request: SearchQueryRequest): void
  (e: 'close'): void
}>()

const searchInput = ref<string>(props.initialTerm ?? '')
const selectedFilters = ref<SearchFilter[]>([])

const getInitialFilters = (): SearchFilter[] => {
  if (props.initialFilters.length > 0) {
    return props.initialFilters
      .map((filter) => ({
        kind: filter.kind.trim(),
        term: filter.term.trim(),
      }))
      .filter((filter) => filter.kind && filter.term)
  }

  const initialKind = (props.initialKind ?? '').trim()
  const initialTerm = (props.initialTerm ?? '').trim()
  if (initialKind && initialTerm) {
    return [{ kind: initialKind, term: initialTerm }]
  }

  return []
}

selectedFilters.value = getInitialFilters()

watch(
  () => props.initialTerm,
  (newTerm) => {
    searchInput.value = newTerm ?? ''
  },
)

watch(
  () => props.initialFilters,
  () => {
    selectedFilters.value = getInitialFilters()
  },
  { deep: true },
)

watch(
  () => props.initialKind,
  () => {
    if (props.initialFilters.length === 0) {
      selectedFilters.value = getInitialFilters()
    }
  },
)

const searchInputRef = ref<InstanceType<typeof SearchField> | null>(null)
const isSearchFocused = ref(false)
const showAdvancedSearch = ref(false)

const isSuggestionsVisible = computed(() => {
  if (!showAdvancedSearch.value) return false
  return props.inOverlay || showAdvancedSearch.value
})

const handleQuerySearch = () => {
  const searchQuery = searchInput.value.trim()
  const filters = selectedFilters.value.map((filter) => ({ ...filter }))

  if (!searchQuery && filters.length === 0) {
    searchInputRef?.value?.inputRef?.focus()
    return
  }

  searchInputRef.value?.inputRef?.blur()
  isSearchFocused.value = false
  showAdvancedSearch.value = false

  const request: SearchQueryRequest = {
    query: searchQuery || undefined,
    filters: filters.length > 0 ? filters : undefined,
  }

  emit('querySearch', request)
}

const handleSearchTermClick = (filters: SearchFilter[]) => {
  selectedFilters.value = filters
}

const focusSearchInput = () => {
  searchInputRef.value?.inputRef?.focus()
  isSearchFocused.value = true

  if (selectedFilters.value.length) {
    showAdvancedSearch.value = true
  }
}

const blurSearchInput = () => {
  searchInputRef.value?.inputRef?.blur()
  isSearchFocused.value = false
}

const handleSuggestionsEscape = () => {
  searchInputRef.value?.inputRef?.blur()
  isSearchFocused.value = false
  showAdvancedSearch.value = false
}

const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value
}

const handleBackdropClick = () => {
  searchInputRef.value?.inputRef?.blur()
  isSearchFocused.value = false
  showAdvancedSearch.value = false
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && searchInput.value.trim().length > 0) {
    handleBackdropClick()
    return
  }
}

const handleSearchInputKeyDown = async (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleQuerySearch()
    return
  }
}

watch(isSearchFocused, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeyDown)
  } else {
    document.removeEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  searchInputRef,
})
</script>

<template>
  <div :class="`relative ${isSearchFocused ? 'z-100' : ''}`">
    <!-- Backdrop overlay (only when not in SearchOverlay). -->
    <div
      v-if="showAdvancedSearch && !props.inOverlay"
      class="fixed inset-0 bg-gray-600/75 dark:bg-gray-900/75 backdrop-blur-sm z-100"
      @click="handleBackdropClick"
    ></div>
    <div class="flex flex-col md:flex-row items-center md:justify-between gap-2 w-full transition-all relative z-200">
      <SearchField
        ref="searchInputRef"
        v-model="searchInput"
        placeholder="Start typing to search..."
        ariaLabel="Search term"
        class="flex-1 w-full bg-background border rounded-lg relative overflow-hidden"
        :class="isSearchFocused ? 'ring-1 ring-primary border-primary' : 'border-gray-200 dark:border-gray-700'"
        input-class="flex-1 min-w-0 outline-none focus:ring-0 px-4 py-2"
        :with-search-button="true"
        :filtersCount="selectedFilters.length"
        :searchEnabled="selectedFilters.length > 0"
        @focus="focusSearchInput"
        @blur="blurSearchInput"
        @search="handleQuerySearch"
        @keydown="handleSearchInputKeyDown"
      />
      <ActionButton
        variant="secondary"
        size="lg"
        class="focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
        aria-label="Advanced Search"
        :aria-expanded="showAdvancedSearch"
        @click="toggleAdvancedSearch"
        content-section="Search input: advanced search toggle button"
      >
        <span class="pr-1">
          More...
          <span
            v-if="selectedFilters.length"
            class="absolute top-0 right-0 -mt-[0.625rem] -mr-[0.625rem] inline-flex items-center justify-center w-[1.25rem] h-[1.25rem] text-xs leading-none rounded-full text-white bg-primary"
          >
            {{ selectedFilters.length }}
          </span>
        </span>
        <ArrowRightIcon
          class="w-4 h-4"
          :style="{ transform: showAdvancedSearch ? 'rotate(-90deg)' : 'rotate(90deg)' }"
        />
      </ActionButton>
    </div>
    <SearchSuggestions
      :is-suggestions-visible="isSuggestionsVisible"
      :in-overlay="props.inOverlay"
      :search-input="searchInput"
      :initial-filters="selectedFilters"
      @search-term-click="handleSearchTermClick"
      @focus-search-input="focusSearchInput"
      @escape="handleSuggestionsEscape"
    />
  </div>
</template>

