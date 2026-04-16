<script setup lang="ts">
import {
  type ComponentPublicInstance,
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchField from '@/components/atoms/SearchField.vue'
import TermButton from '@/components/atoms/TermButton.vue'
import { SEARCH_CATEGORIES } from '@/constants/search'
import { useExposureStore } from '@/stores/exposure'
import { useSearchStore } from '@/stores/search'
import { useWorkspaceStore } from '@/stores/workspace'
import type { SortableEntity } from '@/types/common'
import { formatNumber } from '@/utils/format'
import { filterItemsByQuery, isValidTerm, normaliseSearchText } from '@/utils/search'

const props = defineProps<{
  initialTerm: string
  initialKind: string
  inOverlay?: boolean
}>()

const emit = defineEmits<{
  (e: 'search', searchKind: string, searchTerm: string): void
  (e: 'close'): void
}>()

const router = useRouter()
const route = useRoute()
const searchStore = useSearchStore()
const exposureStore = useExposureStore()
const workspaceStore = useWorkspaceStore()

const searchInput = ref<string>(props.initialTerm)

watch(
  () => props.initialTerm,
  (newTerm) => {
    searchInput.value = newTerm
  },
)
const searchInputRef = ref<InstanceType<typeof SearchField> | null>(null)
const isSearchFocused = ref(false)
const categoriesError = ref<string | null>(null)
const termButtonRefs = ref<InstanceType<typeof TermButton>[]>([])
const exposuresButtonRef = ref<HTMLButtonElement | null>(null)
const workspacesButtonRef = ref<HTMLButtonElement | null>(null)

const setTermButtonRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  if (el) {
    termButtonRefs.value[index] = el as InstanceType<typeof TermButton>
  }
}

// All focusable suggestion buttons in focus order: TermButtons first (rendered
// per category group), then the Exposures button, then the Workspaces button.
// This matches the DOM order used in the template.
const allSuggestionButtons = computed<HTMLElement[]>(() => {
  const termEls = termButtonRefs.value.map((ref) => ref?.$el ?? ref).filter(Boolean)
  const extras: HTMLElement[] = []
  if (exposuresButtonRef.value) extras.push(exposuresButtonRef.value)
  if (workspacesButtonRef.value) extras.push(workspacesButtonRef.value)
  return [...termEls, ...extras]
})

onMounted(async () => {
  const validKinds = SEARCH_CATEGORIES.map((cat) => cat.value)

  try {
    await searchStore.fetchCategories(validKinds)
  } catch (err) {
    categoriesError.value = 'Failed to fetch search categories.'
    console.error('Failed to fetch search categories:', err)
  }

  // Fetch exposures and workspaces silently so they are available for filtering.
  await Promise.all([exposureStore.fetchExposures(), workspaceStore.fetchWorkspaces()])
})

const isLoading = computed(() => {
  return searchStore.isLoading || searchStore.categories.some((cat) => cat.loading)
})

const filteredSearchTermsByCategory = computed(() => {
  const searchTermValue = searchInput.value.trim().toLowerCase()
  if (!searchTermValue) return []

  return SEARCH_CATEGORIES.map((category) => {
    const categoryData = searchStore.categories.find((cat) => cat.kind === category.value)
    const terms = categoryData?.kindInfo?.terms || []

    const filteredTerms = terms.filter(
      (term) => isValidTerm(term) && term.toLowerCase().includes(searchTermValue),
    )

    return {
      kind: category.value,
      label: category.label,
      terms: filteredTerms,
    }
  }).filter((group) => group.terms.length > 0)
})

const getMatchingCount = <T extends SortableEntity>(items: T[], query: string): number => {
  const normalisedQuery = normaliseSearchText(query)
  // Return 0 for empty or punctuation-only input.
  if (!normalisedQuery.trim()) return 0
  // Use the raw query for filtering so counts match list page behaviour.
  return filterItemsByQuery({ query, items }).length
}

const exposuresCount = computed(() =>
  getMatchingCount(exposureStore.exposures, searchInput.value.trim()),
)

const workspacesCount = computed(() =>
  getMatchingCount(workspaceStore.workspaces, searchInput.value.trim()),
)

const hasResults = computed(() => {
  return (
    filteredSearchTermsByCategory.value.length > 0 ||
    exposuresCount.value > 0 ||
    workspacesCount.value > 0
  )
})

const isSuggestionsVisible = computed(() => {
  if (!searchInput.value.trim()) return false
  return props.inOverlay ? true : isSearchFocused.value
})

const defaultSearchKind = computed(() => {
  if (SEARCH_CATEGORIES.some((category) => category.value === props.initialKind)) {
    return props.initialKind
  }
  return 'citation_id'
})

const handleSearch = () => {
  const searchTerm = searchInput.value.trim()
  if (searchTerm === '') {
    searchInputRef?.value?.inputRef?.focus()
    return
  }

  // Use the first category kind that has matching results, otherwise prefer
  // initialKind when valid, and finally fallback to citation_id.
  const firstCategoryWithResults = filteredSearchTermsByCategory.value[0]
  const searchKind = firstCategoryWithResults?.kind || defaultSearchKind.value

  // Blur the input to close the dropdown.
  // searchInputRef.value?.inputRef?.blur()
  emit('search', searchKind, searchTerm)
}

const handleSearchTermClick = (kind: string, term: string) => {
  // Blur the input to close the dropdown.
  searchInputRef.value?.inputRef?.blur()
  isSearchFocused.value = false
  emit('search', kind, term)
}

const buildListQuery = (): Record<string, string> => {
  const query: Record<string, string> = { filter: searchInput.value.trim() }
  const currentSort = route.query.sort
  if (typeof currentSort === 'string' && currentSort.trim()) {
    query.sort = currentSort
  }
  return query
}

const handleExposuresClick = () => {
  handleBackdropClick()
  if (props.inOverlay) {
    emit('close')
  }
  router.push({ name: 'exposures', query: buildListQuery() })
}

const handleWorkspacesClick = () => {
  handleBackdropClick()
  if (props.inOverlay) {
    emit('close')
  }
  router.push({ name: 'workspaces', query: buildListQuery() })
}

const handleBackdropClick = () => {
  // Blur the input to close the dropdown.
  searchInputRef.value?.inputRef?.blur()
  isSearchFocused.value = false
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && searchInput.value.trim().length > 0) {
    handleBackdropClick()
    return
  }

  if (event.key === 'Tab' && hasResults.value) {
    const buttonEls = allSuggestionButtons.value
    if (buttonEls.length === 0) return

    const activeIndex = buttonEls.indexOf(event.target as HTMLElement)
    if (activeIndex === -1) return

    const searchInputEl = searchInputRef.value?.inputRef

    if (event.shiftKey && activeIndex === 0) {
      // Shift+Tab on first term button → go back to search input.
      event.preventDefault()
      searchInputEl?.focus()
    } else if (!event.shiftKey && activeIndex === buttonEls.length - 1) {
      // Tab on last term button → cycle back to search input.
      event.preventDefault()
      searchInputEl?.focus()
    }
  }
}

// Handle Tab/Shift+Tab key to cycle focus between search input and term buttons.
const handleSearchInputKeyDown = async (event: KeyboardEvent) => {
  if (event.key === 'Tab' && hasResults.value) {
    event.preventDefault()
    await nextTick()
    const buttonEls = allSuggestionButtons.value
    if (event.shiftKey) {
      // Shift+Tab on search input → go to last suggestion button.
      const lastButton = buttonEls[buttonEls.length - 1]
      if (lastButton) {
        lastButton.focus()
        isSearchFocused.value = true
      }
    } else {
      // Tab on search input → go to first suggestion button.
      const firstButton = buttonEls[0]
      if (firstButton) {
        firstButton.focus()
        isSearchFocused.value = true
      }
    }
  }
}

watch(isSearchFocused, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeyDown)
  } else {
    document.removeEventListener('keydown', handleKeyDown)
  }
})

watch(filteredSearchTermsByCategory, () => {
  termButtonRefs.value = []
  exposuresButtonRef.value = null
  workspacesButtonRef.value = null
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
      v-if="isSearchFocused && searchInput.trim().length > 0 && !props.inOverlay"
      class="fixed inset-0 bg-gray-400/75 dark:bg-gray-900/75 z-30"
      @click="handleBackdropClick"
    ></div>
    <div
      class="flex items-center bg-background justify-between w-full border rounded-lg transition-all relative z-40"
      :class="isSearchFocused ? 'ring-2 ring-primary border-transparent' : 'border-gray-200 dark:border-gray-700 overflow-hidden'"
    >
      <SearchField
        ref="searchInputRef"
        v-model="searchInput"
        placeholder="Start typing to search..."
        aria-label="Search term"
        class="flex-1"
        input-class="flex-1 min-w-0 outline-none focus:ring-0 px-4 py-2"
        @focus="isSearchFocused = true"
        @blur="isSearchFocused = false"
        @search="handleSearch"
        @keydown="handleSearchInputKeyDown"
      />
    </div>
    <div
      v-if="isSuggestionsVisible"
      :class="`top-full left-0 w-full z-40 ${props.inOverlay ? '' : 'absolute'}`"
      @mousedown.prevent
    >
      <div class="mt-2 box box-small overflow-hidden !shadow-none !p-0">
        <div v-if="categoriesError" class="error-box">
          <p class="text-sm">
            {{ categoriesError }}
          </p>
        </div>
        <div v-else-if="isLoading" class="p-4">
          <p class="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
        <div v-else-if="!hasResults" class="p-4">
          <p class="text-gray-500 dark:text-gray-400">
            No matching results found for "{{ searchInput }}".
          </p>
        </div>
        <div v-else class="max-h-96 overflow-y-auto scrollbar-thin group/results">
          <div
            v-for="(categoryGroup, groupIndex) in filteredSearchTermsByCategory"
            :key="categoryGroup.kind"
            class="result-group"
          >
            <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {{ categoryGroup.label }}
            </h4>
            <div class="flex flex-row items-start justify-start flex-wrap gap-2">
              <TermButton
                v-for="(term, termIndex) in categoryGroup.terms"
                :key="term"
                :ref="(el) => setTermButtonRef(el, filteredSearchTermsByCategory.slice(0, groupIndex).reduce((acc, g) => acc + g.terms.length, 0) + termIndex)"
                :term="term"
                @click="handleSearchTermClick(categoryGroup.kind, term)"
              />
            </div>
          </div>
          <div
            v-if="exposuresCount > 0"
            class="result-group"
          >
            <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Exposures
            </h4>
            <button
              type="button"
              ref="exposuresButtonRef"
              class="cursor-pointer text-primary hover:text-primary-hover transition-colors"
              @click="handleExposuresClick"
            >
              See {{ formatNumber(exposuresCount) }} matching exposure{{ exposuresCount !== 1 ? 's' : '' }}
            </button>
          </div>
          <div
            v-if="workspacesCount > 0"
            class="result-group"
          >
            <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Workspaces
            </h4>
            <button
              type="button"
              ref="workspacesButtonRef"
              class="cursor-pointer text-primary hover:text-primary-hover transition-colors"
              @click="handleWorkspacesClick"
            >
              See {{ formatNumber(workspacesCount) }} matching workspace{{ workspacesCount !== 1 ? 's' : '' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/box.css';
@import '@/assets/error-box.css';

.result-group {
  @apply hover:bg-gray-50 dark:hover:bg-gray-900 border-b last:border-0 border-gray-200 dark:border-gray-700 p-4 transition-all group-hover/results:opacity-75 hover:!opacity-100;
}
</style>
