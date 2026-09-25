<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type Component } from 'vue'
import Chip from '@/components/atoms/Chip.vue'
import CloseButton from '@/components/atoms/CloseButton.vue'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import UserIcon from '@/components/icons/UserIcon.vue'
import CodeIcon from '@/components/icons/CodeIcon.vue'
import FileIcon from '@/components/icons/FileIcon.vue'
import { SEARCH_CATEGORIES, SEARCH_KIND_LABEL_SINGULAR_MAP } from '@/constants/search'
import { useSearchStore } from '@/stores/search'
import type { SearchFilter, SearchQueryRequest } from '@/types/search'
import Keycap from '@/components/atoms/Keycap.vue'

interface FilterChip {
  id: string
  kind: string
  term: string
  displayLabel: string
}

const props = withDefaults(
  defineProps<{
    initialQuery?: string
    initialFilters?: SearchFilter[]
    inOverlay?: boolean
  }>(),
  {
    initialQuery: '',
    initialFilters: () => [],
  },
)

const emit = defineEmits<{
  (e: 'querySearch', request: SearchQueryRequest): void
  (e: 'close'): void
  (e: 'dropdownHeightChange', height: number): void
}>()

const searchStore = useSearchStore()

const TEXT_QUERY_KIND = '_text_query'
const TEXT_QUERY_LABEL = 'Free text'

// ---- Refs ----
const inputRef = ref<HTMLInputElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const categoryMenuRef = ref<HTMLDivElement | null>(null)
const termSuggestionsRef = ref<HTMLDivElement | null>(null)
const freeTextHintRef = ref<HTMLDivElement | null>(null)
const chips = ref<FilterChip[]>([])
const currentInput = ref('')
const showCategoryMenu = ref(false)
const selectedCategoryKind = ref<string | null>(null)
const showTermSuggestions = ref(false)
const termSuggestions = ref<string[]>([])
const activeSuggestionIndex = ref(-1)
const categoryMenuActiveIndex = ref(-1)
const isFocused = ref(false)

// Emits the current dropdown height whenever it changes (used by SearchOverlay to grow the dialog).
function emitDropdownHeight() {
  nextTick(() => {
    const el = categoryMenuRef.value ?? termSuggestionsRef.value ?? freeTextHintRef.value
    emit('dropdownHeightChange', el ? el.offsetHeight : 0)
  })
}

// ---- Computed ----
const mainSearchBarClass = computed(() => {
  const baseClasses = [
    'flex items-center w-full border rounded-lg overflow-hidden transition-all bg-background'
  ]

  if (isFocused.value) {
    baseClasses.push('ring-1 ring-primary border-primary')
  } else {
    baseClasses.push('border-gray-200 dark:border-gray-700')
  }

  return baseClasses
})

const dropdownMenuClass = [
  'absolute z-50 left-0 mt-1 w-80 min-w-full bg-white dark:bg-gray-800',
  'rounded-lg shadow-lg border border-gray-200 dark:border-gray-700'
]

const categoryMenuClass = computed(() => [
  ...dropdownMenuClass
])

const termSuggestionsClass = computed(() => [
  ...dropdownMenuClass
])

const freeTextHintClass = computed(() => [
  ...dropdownMenuClass
])

const searchButtonClass = computed(() => {
  const baseClasses = [
    'flex items-center justify-center px-4 self-stretch shrink-0',
    'border-l border-gray-200 dark:border-gray-700',
    'bg-gray-200 dark:bg-gray-700',
    'transition duration-200 ease-linear',
    'focus-visible:ring-2 focus-visible:ring-primary focus:outline-none'
  ]

  if (hasValues.value) {
    baseClasses.push('cursor-pointer')
  } else {
    baseClasses.push('opacity-50 cursor-default')
  }

  return baseClasses
})

const hasValues = computed(() => {
  return chips.value.length > 0 || currentInput.value.trim().length > 0
})

const categoryPrefix = computed(() => {
  if (!selectedCategoryKind.value) return ''
  if (selectedCategoryKind.value === TEXT_QUERY_KIND) return TEXT_QUERY_LABEL
  return SEARCH_KIND_LABEL_SINGULAR_MAP[selectedCategoryKind.value] || selectedCategoryKind.value
})

const inputPlaceholder = computed(() => {
  if (selectedCategoryKind.value && selectedCategoryKind.value !== TEXT_QUERY_KIND) {
    return 'Type to filter...'
  }

  if (chips.value?.find(({kind}) => (kind === TEXT_QUERY_KIND))) {
    return 'Type to replace search query or add a category below…'
  }

  if (showCategoryMenu.value) {
    return 'Type to search or add a category below...'
  }

  return 'Type to search...'
})

const helpText = computed(() => {
  if (!isFocused.value && !props.inOverlay) return ''
  if (selectedCategoryKind.value && selectedCategoryKind.value !== TEXT_QUERY_KIND) {
    return 'Select or type a term from the suggestions below'
  }
  if (chips.value.length > 0) {
    return 'Add another category filter below to narrow your search'
  }
  return 'Select a category filter below, or just type and press Enter to search'
})

const categoryMenuItems = computed(() => {
  const input = currentInput.value.trim().toLowerCase()
  let filtered = [...SEARCH_CATEGORIES]
  if (input) {
    filtered = filtered.filter(
      (cat) => cat.label.toLowerCase().includes(input) || cat.value.toLowerCase().includes(input),
    )
  }
  // Don't include TEXT_QUERY_KIND — free text is now always the implicit default.
  return filtered
})

const hasCategoryMatches = computed(() => categoryMenuItems.value.length > 0)

const showDropdown = computed(() => showCategoryMenu.value || showTermSuggestions.value)

const noTermMatchesMessage = computed(() => {
  const input = currentInput.value.trim()
  const label = categoryPrefix.value || 'this category'
  if (!input) return `No ${label} suggestions available`
  return `No ${label} available for "${input}". Try a different term or press Escape to pick another category.`
})

/**
 * Show the free-text hint dropdown when the user has typed something and no
 * category or other dropdown is active.
 */
const showFreeTextHint = computed(() => {
  return (
    (props.inOverlay || isFocused.value) &&
    !selectedCategoryKind.value &&
    currentInput.value.trim().length > 0 &&
    !showDropdown.value
  )
})

// Watch all dropdown visibility states; emit the active dropdown's height so
// SearchOverlay can grow the dialog to fit it.
watch([showCategoryMenu, showTermSuggestions, showFreeTextHint], emitDropdownHeight)

const categoryIcons: Record<string, Component> = {
  citation_author_family_name: UserIcon,
  model_author: UserIcon,
  cellml_keyword: CodeIcon,
  citation_id: FileIcon,
}

// ---- Per-item class helpers (methods, not computed, because they take loop arguments) ----
function getCategoryItemClass(_cat: { value: string }, index: number): string[] {
  const baseClasses = ['w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors cursor-pointer focus:outline-none']
  if (categoryMenuActiveIndex.value === index) {
    baseClasses.push('bg-gray-100 dark:bg-gray-700')
  } else {
    baseClasses.push('hover:bg-gray-50 dark:hover:bg-gray-750')
  }
  return baseClasses
}

function getTermItemClass(index: number): string[] {
  const baseClasses = ['w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer focus:outline-none flex items-center gap-2']
  if (activeSuggestionIndex.value === index) {
    baseClasses.push('bg-gray-100 dark:bg-gray-700')
  } else {
    baseClasses.push('hover:bg-gray-50 dark:hover:bg-gray-750')
  }
  return baseClasses
}

// ---- Helpers ----
function getDisplayLabel(kind: string, term: string): string {
  if (kind === TEXT_QUERY_KIND) return term
  const singularLabel = SEARCH_KIND_LABEL_SINGULAR_MAP[kind] || kind
  return `${singularLabel}: ${term}`
}

function generateChipId(): string {
  return `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
}

function focusInput() {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// ---- Initialisation ----
function initialiseFromProps() {
  if (props.initialFilters.length > 0) {
    chips.value = props.initialFilters
      .filter((f) => f.kind && f.term)
      .map((f) => ({
        id: generateChipId(),
        kind: f.kind,
        term: f.term,
        displayLabel: getDisplayLabel(f.kind, f.term),
      }))
  }
  if (props.initialQuery) {
    chips.value.push({
      id: generateChipId(),
      kind: TEXT_QUERY_KIND,
      term: props.initialQuery,
      displayLabel: getDisplayLabel(TEXT_QUERY_KIND, props.initialQuery),
    })
  }
}

onMounted(async () => {
  initialiseFromProps()

  if (props.inOverlay) {
    if (selectedCategoryKind.value) {
      filterTermSuggestions(currentInput.value)
    } else if (!currentInput.value.trim()) {
      showCategoryMenu.value = true
      categoryMenuActiveIndex.value = -1
    }
    focusInput()
  }

  // Pre-fetch categories for term suggestions
  try {
    const validKinds = SEARCH_CATEGORIES.map((c) => c.value)
    await searchStore.fetchCategories(validKinds)
  } catch (err) {
    console.error('Failed to fetch search categories:', err)
  }
})

// ---- Dropdown helpers ----
function filterTermSuggestions(inputText: string) {
  if (!selectedCategoryKind.value || selectedCategoryKind.value === TEXT_QUERY_KIND) {
    termSuggestions.value = []
    showTermSuggestions.value = false
    return
  }

  const category = searchStore.categories.find((c) => c.kind === selectedCategoryKind.value)
  const terms = (category?.kindInfo?.terms || [])
    .filter((t) => t.trim().length > 0)
    .filter((t) => !chips.value.some((chip) => chip.kind === selectedCategoryKind.value && chip.term.toLowerCase() === t.toLowerCase()))

  if (!inputText.trim()) {
    termSuggestions.value = terms.slice(0, 50)
    showTermSuggestions.value = true
    activeSuggestionIndex.value = -1
    return
  }

  const filtered = terms
    .filter((t) => t.toLowerCase().includes(inputText.toLowerCase()))
    .slice(0, 50)

  termSuggestions.value = filtered
  showTermSuggestions.value = true
  activeSuggestionIndex.value = -1
}

// ---- Category selection ----
function selectCategory(category: { value: string; label: string }) {
  // All entries are real categories now — show term suggestions.
  selectedCategoryKind.value = category.value
  showCategoryMenu.value = false
  currentInput.value = ''
  termSuggestions.value = []
  showTermSuggestions.value = true
  activeSuggestionIndex.value = -1

  // Populate initial suggestions
  filterTermSuggestions('')

  focusInput()
}

function handleCategoryClick(category: { value: string; label: string }) {
  selectCategory(category)
}

function cancelCategorySelection() {
  selectedCategoryKind.value = null
  showTermSuggestions.value = false
  termSuggestions.value = []
  activeSuggestionIndex.value = -1
  focusInput()
}

// ---- Term selection ----
function selectTerm(term: string) {
  if (!selectedCategoryKind.value) return

  // Prevent adding a duplicate term within the same category.
  const alreadySelected = chips.value.some(
    (chip) => chip.kind === selectedCategoryKind.value && chip.term.toLowerCase() === term.toLowerCase(),
  )
  if (alreadySelected) return

  chips.value.push({
    id: generateChipId(),
    kind: selectedCategoryKind.value,
    term,
    displayLabel: getDisplayLabel(selectedCategoryKind.value, term),
  })

  selectedCategoryKind.value = null
  showTermSuggestions.value = false
  currentInput.value = ''
  termSuggestions.value = []
  activeSuggestionIndex.value = -1

  // Return to category menu so user can add another filter.
  showCategoryMenu.value = true
  categoryMenuActiveIndex.value = -1
  focusInput()
}

function removeChip(id: string) {
  chips.value = chips.value.filter((c) => c.id !== id)
  focusInput()
}

// ---- Edit chip ----
function editChip(chip: FilterChip) {
  // Remove the chip from the list.
  chips.value = chips.value.filter((c) => c.id !== chip.id)

  if (chip.kind === TEXT_QUERY_KIND) {
    // Free-text: put the term back in the input for editing (no category needed).
    selectedCategoryKind.value = null
    currentInput.value = chip.term
    showTermSuggestions.value = false
  } else {
    // Real category: set the category and show term suggestions,
    // pre-populated with the existing term so the user can edit it.
    selectedCategoryKind.value = chip.kind
    currentInput.value = chip.term
    showTermSuggestions.value = false
    // Re-open term suggestions for this category.
    filterTermSuggestions(chip.term)
    showTermSuggestions.value = termSuggestions.value.length > 0
  }

  showCategoryMenu.value = false
  activeSuggestionIndex.value = -1
  focusInput()
}

// ---- Clear ----
function clearAll() {
  chips.value = []
  currentInput.value = ''
  selectedCategoryKind.value = null
  showCategoryMenu.value = false
  showTermSuggestions.value = false
  termSuggestions.value = []
  focusInput()
}

// ---- Search ----
function executeSearch() {
  // Priority: whatever the user has typed right now, then fall back to an existing free-text chip.
  const inputText = currentInput.value.trim()
  const existingTextChip = chips.value.find((c) => c.kind === TEXT_QUERY_KIND)
  const queryText = inputText || existingTextChip?.term || ''

  const filters: SearchFilter[] = chips.value
    .filter((c) => c.kind !== TEXT_QUERY_KIND)
    .map((c) => ({ kind: c.kind, term: c.term }))

  if (!queryText && filters.length === 0) {
    focusInput()
    return
  }

  inputRef.value?.blur()
  showCategoryMenu.value = false
  showTermSuggestions.value = false
  selectedCategoryKind.value = null

  const request: SearchQueryRequest = {
    query: queryText || undefined,
    filters: filters.length > 0 ? filters : undefined,
  }

  emit('querySearch', request)
}

// ---- Event handlers ----
function handleFocus() {
  isFocused.value = true

  if (selectedCategoryKind.value) {
    // Category selected — show term suggestions.
    filterTermSuggestions(currentInput.value)
    showCategoryMenu.value = false
    return
  }

  // No category selected — only show the category menu when the input is empty.
  // If the user has already typed text, let them press Enter to search freely.
  if (!currentInput.value.trim()) {
    showCategoryMenu.value = true
    categoryMenuActiveIndex.value = -1
  }
}

function handleBlur(event: FocusEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  // Keep dropdown open if focus moves inside the wrapper (e.g. clicking a dropdown item)
  if (relatedTarget && wrapperRef.value?.contains(relatedTarget)) {
    return
  }
  isFocused.value = false
  if (!props.inOverlay) {
    showCategoryMenu.value = false
    showTermSuggestions.value = false
  }
}

function handleInput(_event: Event) {
  const input = _event.target as HTMLInputElement
  currentInput.value = input.value

  if (selectedCategoryKind.value) {
    filterTermSuggestions(input.value)
  } else {
    // In free-text mode: hide the category menu while typing so the
    // free-text hint can show instead.
    if (input.value.trim()) {
      showCategoryMenu.value = false
    } else {
      // Input cleared — show the category menu again.
      showCategoryMenu.value = true
      categoryMenuActiveIndex.value = -1
    }
  }
}

function handleKeydown(event: KeyboardEvent) {
  const input = event.target as HTMLInputElement

  // ---- Escape ----
  if (event.key === 'Escape') {
    if (showTermSuggestions.value && selectedCategoryKind.value) {
      // Go back to category menu.
      cancelCategorySelection()
      showCategoryMenu.value = true
      categoryMenuActiveIndex.value = -1
      event.preventDefault()
      return
    }
    if (showCategoryMenu.value) {
      showCategoryMenu.value = false
      event.preventDefault()
      return
    }
    emit('close')
    return
  }

  // ---- Tab ----
  // If the user has typed free text (no category active), Tab commits it as a chip
  // so they can continue adding category filters.
  if (event.key === 'Tab' && !selectedCategoryKind.value && currentInput.value.trim()) {
    const term = currentInput.value.trim()
    chips.value = chips.value.filter((c) => c.kind !== TEXT_QUERY_KIND)
    chips.value.push({
      id: generateChipId(),
      kind: TEXT_QUERY_KIND,
      term,
      displayLabel: getDisplayLabel(TEXT_QUERY_KIND, term),
    })
    currentInput.value = ''
    showCategoryMenu.value = true
    categoryMenuActiveIndex.value = -1
    event.preventDefault()
    focusInput()
    return
  }

  // Close dropdowns on Tab (without consuming the event, so focus moves naturally).
  if (event.key === 'Tab' && showDropdown.value) {
    showCategoryMenu.value = false
    showTermSuggestions.value = false
    if (selectedCategoryKind.value) {
      selectedCategoryKind.value = null
    }
    return
  }

  // ---- Arrow navigation ----
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (showCategoryMenu.value) {
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const items = categoryMenuItems.value
      const maxIndex = items.length - 1
      const nextIndex = categoryMenuActiveIndex.value + delta
      categoryMenuActiveIndex.value = nextIndex < 0 ? maxIndex : nextIndex > maxIndex ? 0 : nextIndex
      return
    }
    if (showTermSuggestions.value && termSuggestions.value.length > 0) {
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const maxIndex = termSuggestions.value.length - 1
      const nextIndex = activeSuggestionIndex.value + delta
      activeSuggestionIndex.value = nextIndex < 0 ? maxIndex : nextIndex > maxIndex ? 0 : nextIndex
      return
    }
    return
  }

  // ---- Enter ----
  if (event.key === 'Enter') {
    // Category menu open with an item highlighted — select that category.
    if (showCategoryMenu.value && categoryMenuActiveIndex.value >= 0) {
      event.preventDefault()
      selectCategory(categoryMenuItems.value[categoryMenuActiveIndex.value])
      return
    }

    // Term suggestions open with an item highlighted — select that term.
    if (showTermSuggestions.value && activeSuggestionIndex.value >= 0) {
      event.preventDefault()
      selectTerm(termSuggestions.value[activeSuggestionIndex.value])
      return
    }

    // Category selected but no item highlighted — try exact match, else fall to free-text search.
    if (showTermSuggestions.value && selectedCategoryKind.value) {
      event.preventDefault()
      const term = currentInput.value.trim()
      if (term && termSuggestions.value.some((t) => t.toLowerCase() === term.toLowerCase())) {
        selectTerm(term)
      } else {
        // Cancel category, use input as free-text query.
        cancelCategorySelection()
        showCategoryMenu.value = false
        executeSearch()
      }
      return
    }

    // ---- Default: free-text search (primary user journey) ----
    event.preventDefault()
    executeSearch()
    return
  }

  // ---- Backspace ----
  if (event.key === 'Backspace') {
    // If cursor is at the very beginning and input is empty, remove last chip or cancel category
    if (input.selectionStart === 0 && input.selectionEnd === 0 && currentInput.value === '') {
      if (selectedCategoryKind.value) {
        cancelCategorySelection()
      } else if (chips.value.length > 0) {
        chips.value.pop()
      }
      event.preventDefault()
      return
    }
    return
  }


}

function handleCategoryMouseEnter(index: number) {
  categoryMenuActiveIndex.value = index
}

function handleTermMouseEnter(index: number) {
  activeSuggestionIndex.value = index
}

defineExpose({
  inputRef,
  focusInput,
})
</script>

<template>
  <div ref="wrapperRef" class="relative">
    <!--
      Main search bar: chips + active category prefix + text input + clear button + search button
    -->
    <div
      :class="mainSearchBarClass"
      @click="focusInput"
    >
      <!-- Chips + input area -->
      <div class="flex-1 flex items-center flex-wrap gap-1 px-3 py-1 min-h-[2.5rem]">
        <!-- Existing filter chips -->
        <Chip
          v-for="chip in chips"
          :key="chip.id"
          :label="chip.displayLabel"
          :removable="true"
          :on-remove="() => removeChip(chip.id)"
          :on-click="() => editChip(chip)"
        />

        <!-- Active category prefix label (non-editable) -->
        <span
          v-if="selectedCategoryKind"
          class="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0 select-none"
        >
          {{ categoryPrefix }}:
        </span>

        <!-- Text input -->
        <input
          ref="inputRef"
          :value="currentInput"
          type="text"
          aria-label="Search term"
          class="flex-1 min-w-[120px] outline-none border-none bg-transparent px-1 py-1 text-sm"
          :class="{ 'pl-0': selectedCategoryKind !== null || chips.length > 0 }"
          :placeholder="inputPlaceholder"
          @input="handleInput"
          @keydown="handleKeydown"
          @focus="handleFocus"
          @blur="handleBlur"
        />
      </div>

      <!-- Clear button -->
      <div
        v-if="hasValues"
        class="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer p-1 mr-1"
        @click.stop="clearAll"
      >
        <CloseButton aria-label="Clear search" />
      </div>

      <!-- Search button -->
      <button
        type="button"
        :class="searchButtonClass"
        :disabled="!hasValues"
        aria-label="Search"
        @click.stop="executeSearch"
      >
        <SearchIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Category menu dropdown (shown when input is empty on focus, or after Tab) -->
    <div
      v-if="showCategoryMenu && categoryMenuItems.length > 0"
      ref="categoryMenuRef"
      :class="categoryMenuClass"
      @mousedown.prevent="focusInput"
    >
      <!-- <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Filter by category
        </div>
        <div
          v-if="helpText"
          class="mt-0.5 text-xs text-gray-400 dark:text-gray-500 italic"
        >
          {{ helpText }}
        </div>
      </div> -->
      <div class="max-h-80 overflow-y-auto">
        <div
          v-if="!hasCategoryMatches"
          class="px-4 py-3 text-sm text-gray-400 dark:text-gray-500"
        >
          No matching category found. Press <strong>Enter</strong> to search as free text.
        </div>
        <button
          v-for="(cat, index) in categoryMenuItems"
          :key="cat.value"
          type="button"
          :class="getCategoryItemClass(cat, index)"
          @click="handleCategoryClick(cat)"
          @mouseenter="handleCategoryMouseEnter(index)"
        >
          <component :is="categoryIcons[cat.value]" class="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
          <span class="font-medium text-gray-800 dark:text-gray-200 flex-1">{{ cat.label }}</span>
          <Keycap v-if="categoryMenuActiveIndex === index" size="small">&crarr;</Keycap>
        </button>
      </div>
    </div>

    <!-- Term suggestions dropdown (shown when typing a filter value) -->
    <div
      v-if="showTermSuggestions"
      ref="termSuggestionsRef"
      :class="termSuggestionsClass"
      @mousedown.prevent="focusInput"
    >
      <div class="max-h-80 overflow-y-auto">
        <!-- <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
          <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ categoryPrefix }} suggestions
          </div>
          <div v-if="termSuggestions.length > 0" class="mt-0.5 text-xs text-gray-400 dark:text-gray-500 italic">
            Select one from the list
          </div>
        </div> -->
        <div
          v-if="termSuggestions.length === 0"
          class="px-4 py-3 text-sm text-gray-400 dark:text-gray-500"
        >
          {{ noTermMatchesMessage }}
        </div>
        <button
          v-for="(term, index) in termSuggestions"
          :key="term"
          type="button"
          :class="getTermItemClass(index)"
          @click="selectTerm(term)"
          @mouseenter="handleTermMouseEnter(index)"
        >
          <span class="truncate flex-1">{{ term }}</span>
          <Keycap v-if="activeSuggestionIndex === index" size="small">&crarr;</Keycap>
        </button>
      </div>
    </div>

    <!-- Free-text hint (shown when user has typed text and no category/dropdown is active) -->
    <div
      v-if="showFreeTextHint"
      ref="freeTextHintRef"
      :class="freeTextHintClass"
      @mousedown.prevent="focusInput"
    >
      <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center flex-wrap gap-x-1.5 gap-y-1">
        <span>Press</span>
        <Keycap size="small">&crarr;</Keycap>
        <span>
          to search for
          <strong class="text-gray-700 dark:text-gray-200">{{ currentInput }}</strong>,
          or press
        </span>
        <Keycap size="small">Tab</Keycap>
        <span>to add category filters</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
