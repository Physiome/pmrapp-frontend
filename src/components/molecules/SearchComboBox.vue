<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import Chip from '@/components/atoms/Chip.vue'
import CloseButton from '@/components/atoms/CloseButton.vue'
import Keycap from '@/components/atoms/Keycap.vue'
import TermButton from '@/components/atoms/TermButton.vue'
import CodeIcon from '@/components/icons/CodeIcon.vue'
import FileIcon from '@/components/icons/FileIcon.vue'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import UserIcon from '@/components/icons/UserIcon.vue'
import { SEARCH_CATEGORIES, SEARCH_KIND_LABEL_SINGULAR_MAP } from '@/constants/search'
import { useSearchStore } from '@/stores/search'
import type { SearchFilter, SearchQueryRequest } from '@/types/search'
import { findMatchingTerms, highlightTokens } from '@/utils/search'

interface FilterChip {
  id: string
  kind: string
  term: string
  displayLabel: string
}

interface SuggestionRow {
  kind: string
  label: string
  icon: Component
  terms: string[]
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
// Maximum number of candidate terms per category; only those that fit the dropdown width are shown.
const MAX_TERMS_PER_CATEGORY = 20

// ---- Refs ----
const inputRef = ref<HTMLInputElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const chips = ref<FilterChip[]>([])
const currentInput = ref('')
const isFocused = ref(false)
const dropdownDismissed = ref(false)
// Number of terms per category row that fit the dropdown width (unset = render all candidates).
const visibleCounts = ref<Record<string, number>>({})

const categoryIcons: Record<string, Component> = {
  citation_author_family_name: UserIcon,
  model_author: UserIcon,
  cellml_keyword: CodeIcon,
  citation_id: FileIcon,
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
  'absolute z-50 left-0 mt-1 w-full bg-white dark:bg-gray-800',
  'rounded-lg shadow-lg border border-gray-200 dark:border-gray-700'
]

const suggestionButtonClass = [
  'shrink-0 max-w-[16rem] truncate',
  // Border keeps buttons distinguishable where their background matches the dropdown (dark mode).
  'border border-gray-200 dark:border-gray-700',
  // Inset ring: the row container clips overflow, which would hide an outer ring.
  'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
]

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

const inputPlaceholder = computed(() => {
  if (chips.value.length > 0) {
    return 'Type to search or add more...'
  }
  return 'Type to search...'
})

/**
 * Rows shown in the dropdown for the current input: a free-text row first,
 * followed by every category that has partially matching terms.
 */
const suggestionRows = computed<SuggestionRow[]>(() => {
  const input = currentInput.value.trim()
  if (!input) return []

  const rows: SuggestionRow[] = [
    { kind: TEXT_QUERY_KIND, label: TEXT_QUERY_LABEL, icon: SearchIcon, terms: [input] },
  ]

  for (const category of SEARCH_CATEGORIES) {
    const categoryData = searchStore.categories.find((c) => c.kind === category.value)
    const selectedTerms = chips.value.filter((c) => c.kind === category.value).map((c) => c.term)
    const terms = findMatchingTerms(
      categoryData?.kindInfo?.terms ?? [],
      input,
      selectedTerms,
      MAX_TERMS_PER_CATEGORY,
    )

    if (terms.length > 0) {
      rows.push({
        kind: category.value,
        label: category.label,
        icon: categoryIcons[category.value] ?? SearchIcon,
        terms,
      })
    }
  }

  return rows
})

const showDropdown = computed(() => {
  return (
    suggestionRows.value.length > 0 &&
    !dropdownDismissed.value &&
    (props.inOverlay || isFocused.value)
  )
})

function visibleTerms(row: SuggestionRow): string[] {
  const count = visibleCounts.value[row.kind]
  return count === undefined ? row.terms : row.terms.slice(0, count)
}

// ---- Helpers ----
function getDisplayLabel(kind: string, term: string): string {
  if (kind === TEXT_QUERY_KIND) return term
  const singularLabel = SEARCH_KIND_LABEL_SINGULAR_MAP[kind] || kind
  return `${singularLabel}: ${term}`
}

function getSuggestionAriaLabel(kind: string, term: string): string {
  if (kind === TEXT_QUERY_KIND) return `Add free text: ${term}`
  return `Add ${getDisplayLabel(kind, term)}`
}

function generateChipId(): string {
  return `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
}

function focusInput() {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// ---- Dropdown sizing ----
let measureToken = 0

/**
 * Renders every candidate term, then measures which ones fit on a single line
 * of each row and hides the rest. Runs before paint, so there is no flicker.
 */
async function recomputeVisibleCounts() {
  const token = ++measureToken
  visibleCounts.value = {}
  await nextTick()
  if (token !== measureToken || !dropdownRef.value) return

  const counts: Record<string, number> = {}
  const containers = dropdownRef.value.querySelectorAll<HTMLElement>('[data-suggestion-row]')

  for (const container of containers) {
    const kind = container.dataset.suggestionRow
    if (!kind) continue

    const width = container.clientWidth
    let count = 0
    for (const child of Array.from(container.children) as HTMLElement[]) {
      if (child.offsetLeft + child.offsetWidth > width) break
      count += 1
    }
    counts[kind] = Math.max(1, count)
  }

  visibleCounts.value = counts
  emitDropdownHeight()
}

// Emits the current dropdown height (used by SearchOverlay to grow the dialog).
function emitDropdownHeight() {
  nextTick(() => {
    emit('dropdownHeightChange', dropdownRef.value ? dropdownRef.value.offsetHeight : 0)
  })
}

let resizeObserver: ResizeObserver | null = null
let lastDropdownWidth = 0

watch(dropdownRef, (el) => {
  resizeObserver?.disconnect()
  resizeObserver = null
  lastDropdownWidth = 0

  if (!el) {
    emitDropdownHeight()
    return
  }

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (el.clientWidth !== lastDropdownWidth) {
        lastDropdownWidth = el.clientWidth
        recomputeVisibleCounts()
      } else {
        emitDropdownHeight()
      }
    })
    resizeObserver.observe(el)
  }
})

watch(suggestionRows, () => {
  if (showDropdown.value) {
    recomputeVisibleCounts()
  }
})

watch(showDropdown, (show) => {
  if (show) {
    recomputeVisibleCounts()
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

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

// ---- Selection ----
function selectSuggestion(kind: string, term: string) {
  if (kind === TEXT_QUERY_KIND) {
    // Only one free-text query is supported; replace any existing one.
    chips.value = chips.value.filter((c) => c.kind !== TEXT_QUERY_KIND)
  } else {
    // Prevent adding a duplicate term within the same category.
    const alreadySelected = chips.value.some(
      (chip) => chip.kind === kind && chip.term.toLowerCase() === term.toLowerCase(),
    )
    if (alreadySelected) return
  }

  chips.value.push({
    id: generateChipId(),
    kind,
    term,
    displayLabel: getDisplayLabel(kind, term),
  })

  currentInput.value = ''
  dropdownDismissed.value = false
  focusInput()
}

function removeChip(id: string) {
  chips.value = chips.value.filter((c) => c.id !== id)
  focusInput()
}

// ---- Edit chip ----
function editChip(chip: FilterChip) {
  // Put the term back into the input; the dropdown shows its matches again.
  chips.value = chips.value.filter((c) => c.id !== chip.id)
  currentInput.value = chip.term
  dropdownDismissed.value = false
  focusInput()
}

// ---- Clear ----
function clearAll() {
  chips.value = []
  currentInput.value = ''
  dropdownDismissed.value = false
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
  dropdownDismissed.value = true

  const request: SearchQueryRequest = {
    query: queryText || undefined,
    filters: filters.length > 0 ? filters : undefined,
  }

  emit('querySearch', request)
}

// ---- Suggestion focus helpers ----
function getSuggestionButton(rowIndex: number, colIndex: number): HTMLElement | null {
  return (
    dropdownRef.value?.querySelector<HTMLElement>(`[data-suggestion="${rowIndex}:${colIndex}"]`) ??
    null
  )
}

function visibleCountAt(rowIndex: number): number {
  const row = suggestionRows.value[rowIndex]
  return row ? visibleTerms(row).length : 0
}

function focusSuggestion(rowIndex: number, colIndex: number) {
  getSuggestionButton(rowIndex, colIndex)?.focus()
}

function focusFirstSuggestion() {
  focusSuggestion(0, 0)
}

// ---- Event handlers ----
function handleFocusIn() {
  isFocused.value = true
}

function handleFocusOut(event: FocusEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  // Keep the dropdown open while focus moves between the input and suggestions.
  if (relatedTarget && wrapperRef.value?.contains(relatedTarget)) {
    return
  }
  isFocused.value = false
}

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  currentInput.value = input.value
  dropdownDismissed.value = false
}

function handleKeydown(event: KeyboardEvent) {
  const input = event.target as HTMLInputElement

  // ---- Escape ----
  if (event.key === 'Escape') {
    if (showDropdown.value) {
      dropdownDismissed.value = true
      event.preventDefault()
      return
    }
    emit('close')
    return
  }

  // ---- Tab / ArrowDown: move into the suggestions ----
  if (
    ((event.key === 'Tab' && !event.shiftKey) || event.key === 'ArrowDown') &&
    showDropdown.value
  ) {
    event.preventDefault()
    focusFirstSuggestion()
    return
  }

  // ---- Enter ----
  if (event.key === 'Enter') {
    event.preventDefault()
    executeSearch()
    return
  }

  // ---- Backspace ----
  if (event.key === 'Backspace') {
    // If cursor is at the very beginning and input is empty, remove the last chip.
    if (input.selectionStart === 0 && input.selectionEnd === 0 && currentInput.value === '') {
      if (chips.value.length > 0) {
        chips.value.pop()
      }
      event.preventDefault()
    }
  }
}

function handleSuggestionKeydown(event: KeyboardEvent, rowIndex: number, colIndex: number) {
  const rowCount = suggestionRows.value.length
  const lastRowIndex = rowCount - 1

  switch (event.key) {
    case 'ArrowRight': {
      event.preventDefault()
      if (colIndex < visibleCountAt(rowIndex) - 1) {
        focusSuggestion(rowIndex, colIndex + 1)
      } else {
        focusSuggestion(rowIndex < lastRowIndex ? rowIndex + 1 : 0, 0)
      }
      return
    }
    case 'ArrowLeft': {
      event.preventDefault()
      if (colIndex > 0) {
        focusSuggestion(rowIndex, colIndex - 1)
      } else if (rowIndex > 0) {
        focusSuggestion(rowIndex - 1, visibleCountAt(rowIndex - 1) - 1)
      } else {
        focusInput()
      }
      return
    }
    case 'ArrowDown': {
      event.preventDefault()
      if (rowIndex < lastRowIndex) {
        focusSuggestion(rowIndex + 1, Math.min(colIndex, visibleCountAt(rowIndex + 1) - 1))
      }
      return
    }
    case 'ArrowUp': {
      event.preventDefault()
      if (rowIndex > 0) {
        focusSuggestion(rowIndex - 1, Math.min(colIndex, visibleCountAt(rowIndex - 1) - 1))
      } else {
        focusInput()
      }
      return
    }
    case 'Tab': {
      const isFirst = rowIndex === 0 && colIndex === 0
      const isLast = rowIndex === lastRowIndex && colIndex === visibleCountAt(rowIndex) - 1
      if (event.shiftKey) {
        event.preventDefault()
        if (isFirst) {
          focusInput()
        } else if (colIndex > 0) {
          focusSuggestion(rowIndex, colIndex - 1)
        } else {
          focusSuggestion(rowIndex - 1, visibleCountAt(rowIndex - 1) - 1)
        }
        return
      }
      event.preventDefault()
      if (isLast) {
        focusInput()
      } else if (colIndex < visibleCountAt(rowIndex) - 1) {
        focusSuggestion(rowIndex, colIndex + 1)
      } else {
        focusSuggestion(rowIndex + 1, 0)
      }
      return
    }
    case 'Escape': {
      event.preventDefault()
      dropdownDismissed.value = true
      focusInput()
      return
    }
  }
}

defineExpose({
  inputRef,
  focusInput,
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="relative"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <!--
      Main search bar: chips + text input + clear button + search button
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

        <!-- Text input -->
        <input
          ref="inputRef"
          :value="currentInput"
          type="text"
          aria-label="Search term"
          :aria-expanded="showDropdown"
          class="flex-1 min-w-[120px] outline-none border-none bg-transparent px-1 py-1 text-sm"
          :class="{ 'pl-0': chips.length > 0 }"
          :placeholder="inputPlaceholder"
          @input="handleInput"
          @keydown="handleKeydown"
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

    <!-- Suggestions dropdown: matched categories with their matching terms -->
    <div
      v-if="showDropdown"
      ref="dropdownRef"
      :class="dropdownMenuClass"
      @mousedown.prevent
    >
      <div class="max-h-80 overflow-y-auto py-1">
        <div
          v-for="(row, rowIndex) in suggestionRows"
          :key="row.kind"
          class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-3 py-2"
        >
          <div class="sm:w-44 shrink-0 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            <component :is="row.icon" class="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
            <span class="truncate">{{ row.label }}</span>
          </div>
          <div
            :data-suggestion-row="row.kind"
            class="relative flex flex-nowrap gap-1.5 overflow-hidden min-w-0 flex-1"
          >
            <TermButton
              v-for="(term, colIndex) in visibleTerms(row)"
              :key="term"
              :term="term"
              :aria-label="getSuggestionAriaLabel(row.kind, term)"
              :title="term"
              :class="suggestionButtonClass"
              :data-suggestion="`${rowIndex}:${colIndex}`"
              @click="selectSuggestion(row.kind, term)"
              @keydown="handleSuggestionKeydown($event, rowIndex, colIndex)"
            >
              <template
                v-for="(segment, segmentIndex) in highlightTokens(term, [currentInput])"
                :key="segmentIndex"
              >
                <strong v-if="segment.highlighted" class="font-semibold">{{ segment.text }}</strong>
                <template v-else>{{ segment.text }}</template>
              </template>
            </TermButton>
          </div>
        </div>
      </div>
      <div class="px-3 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap gap-x-1.5 gap-y-1">
        <span>Press</span>
        <Keycap size="small">&crarr;</Keycap>
        <span>to search, or</span>
        <Keycap size="small">Tab</Keycap>
        <span>/</span>
        <Keycap size="small">&darr;</Keycap>
        <span>to choose a suggestion</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
