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
import {
  SEARCH_CATEGORIES,
  SEARCH_KIND_LABEL_SINGULAR_MAP,
  SEARCH_SUGGESTION_NAVIGATION_KEYS,
  SEARCH_SUGGESTIONS_MAX_TERMS_PER_CATEGORY,
  SEARCH_TEXT_QUERY_KIND,
  SEARCH_TEXT_QUERY_LABEL,
} from '@/constants/search'
import { useSearchStore } from '@/stores/search'
import type {
  SearchFilter,
  SearchFilterChip,
  SearchQueryRequest,
  SearchSuggestionRow,
} from '@/types/search'
import { countFittingChildren } from '@/utils/dom'
import {
  buildSearchQueryRequestFromChips,
  createSearchChip,
  findMatchingTerms,
  getNextSearchSuggestionFocus,
  getSearchSuggestionAriaLabel,
  highlightTokens,
} from '@/utils/search'

// ---- Props & emits ----
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

// ---- Constants ----
const categoryIcons: Record<string, Component> = {
  citation_author_family_name: UserIcon,
  model_author: UserIcon,
  cellml_keyword: CodeIcon,
  citation_id: FileIcon,
}

const dropdownMenuClass = [
  'absolute z-50 left-0 mt-1 w-full bg-white dark:bg-gray-800',
  'rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
]

const suggestionButtonClass = [
  'shrink-0 max-w-[16rem] truncate',
  // Border keeps buttons distinguishable where their background matches the dropdown (dark mode).
  'border border-gray-200 dark:border-gray-700',
  // Inset ring: the row container clips overflow, which would hide an outer ring.
  'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
]

const dropdownFooterClass = [
  'flex items-center flex-wrap gap-x-1.5 gap-y-1 px-3 py-2',
  'border-t border-gray-100 dark:border-gray-700',
  'text-xs text-gray-500 dark:text-gray-400',
]

// ---- Store ----
const searchStore = useSearchStore()

// ---- Refs ----
const inputRef = ref<HTMLInputElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const chips = ref<SearchFilterChip[]>([])
const currentInput = ref('')
const isFocused = ref(false)
const dropdownDismissed = ref(false)
// Suggestions under the mouse / keyboard focus, previewed in the dropdown footer.
const hoveredSuggestion = ref<SearchFilter | null>(null)
const focusedSuggestion = ref<SearchFilter | null>(null)
// Number of terms per category row that fit the dropdown width (unset = render all candidates).
const visibleCounts = ref<Record<string, number>>({})

// ---- Non-reactive state ----
// Incremented per measurement so a stale measurement can bail out.
let measureToken = 0
let resizeObserver: ResizeObserver | null = null
let lastDropdownWidth = 0

// ---- Computed ----
const hasValues = computed(() => {
  return chips.value.length > 0 || currentInput.value.trim().length > 0
})

const mainSearchBarClass = computed(() => {
  const baseClasses = [
    'flex items-center w-full border rounded-lg overflow-hidden transition-all bg-background',
  ]

  if (isFocused.value) {
    baseClasses.push('ring-1 ring-primary border-primary')
  } else {
    baseClasses.push('border-gray-200 dark:border-gray-700')
  }

  return baseClasses
})

const searchButtonClass = computed(() => {
  const baseClasses = [
    'flex items-center justify-center px-4 self-stretch shrink-0',
    'border-l border-gray-200 dark:border-gray-700',
    'bg-gray-200 dark:bg-gray-700',
    'transition duration-200 ease-linear',
    'focus-visible:ring-2 focus-visible:ring-primary focus:outline-none',
  ]

  if (hasValues.value) {
    baseClasses.push('cursor-pointer')
  } else {
    baseClasses.push('opacity-50 cursor-default')
  }

  return baseClasses
})

const inputPlaceholder = computed(() => {
  if (chips.value.length > 0) {
    return 'Type to add another term, or press Enter to search'
  }
  return 'Type to search...'
})

/**
 * Rows shown in the dropdown for the current input: a free-text row first,
 * followed by every category that has partially matching terms.
 */
const suggestionRows = computed<SearchSuggestionRow[]>(() => {
  const input = currentInput.value.trim()
  if (!input) return []

  const rows: SearchSuggestionRow[] = [
    { kind: SEARCH_TEXT_QUERY_KIND, label: SEARCH_TEXT_QUERY_LABEL, terms: [input] },
  ]

  for (const category of SEARCH_CATEGORIES) {
    const categoryData = searchStore.categories.find((c) => c.kind === category.value)
    const selectedTerms = chips.value.filter((c) => c.kind === category.value).map((c) => c.term)
    const terms = findMatchingTerms(
      categoryData?.kindInfo?.terms ?? [],
      input,
      selectedTerms,
      SEARCH_SUGGESTIONS_MAX_TERMS_PER_CATEGORY,
    )

    if (terms.length > 0) {
      rows.push({ kind: category.value, label: category.label, terms })
    }
  }

  return rows
})

// The term whose "add" action is previewed in the footer (mouse hover takes priority).
const previewedSuggestion = computed(() => {
  return hoveredSuggestion.value ?? focusedSuggestion.value
})

// Category label (with colon) shown before the previewed term, e.g. "Model author:"; free text has none.
const previewedSuggestionCategoryLabel = computed(() => {
  const suggestion = previewedSuggestion.value
  if (!suggestion || suggestion.kind === SEARCH_TEXT_QUERY_KIND) return ''
  return `${SEARCH_KIND_LABEL_SINGULAR_MAP[suggestion.kind] || suggestion.kind}:`
})

const showDropdown = computed(() => {
  return (
    suggestionRows.value.length > 0 &&
    !dropdownDismissed.value &&
    (props.inOverlay || isFocused.value)
  )
})

// ---- Helpers ----
function focusInput() {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function getRowIcon(kind: string): Component {
  return categoryIcons[kind] ?? SearchIcon
}

function visibleTerms(row: SearchSuggestionRow): string[] {
  const count = visibleCounts.value[row.kind]
  return count === undefined ? row.terms : row.terms.slice(0, count)
}

// ---- Dropdown sizing ----
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
    // Always show at least one term; a single long term is truncated.
    counts[kind] = Math.max(1, countFittingChildren(container))
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

function observeDropdown(el: HTMLDivElement | null) {
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
}

// ---- Initialisation ----
function initialiseFromProps() {
  if (props.initialFilters.length > 0) {
    chips.value = props.initialFilters
      .filter((f) => f.kind && f.term)
      .map((f) => createSearchChip(f.kind, f.term))
  }
  if (props.initialQuery) {
    chips.value.push(createSearchChip(SEARCH_TEXT_QUERY_KIND, props.initialQuery))
  }
}

// ---- Chip actions ----
function selectSuggestion(kind: string, term: string) {
  if (kind === SEARCH_TEXT_QUERY_KIND) {
    // Only one free-text query is supported; replace any existing one.
    chips.value = chips.value.filter((c) => c.kind !== SEARCH_TEXT_QUERY_KIND)
  } else {
    // Prevent adding a duplicate term within the same category.
    const alreadySelected = chips.value.some(
      (chip) => chip.kind === kind && chip.term.toLowerCase() === term.toLowerCase(),
    )
    if (alreadySelected) return
  }

  chips.value.push(createSearchChip(kind, term))

  currentInput.value = ''
  dropdownDismissed.value = false
  focusInput()
}

function removeChip(id: string) {
  chips.value = chips.value.filter((c) => c.id !== id)
  focusInput()
}

function editChip(chip: SearchFilterChip) {
  // Put the term back into the input; the dropdown shows its matches again.
  chips.value = chips.value.filter((c) => c.id !== chip.id)
  currentInput.value = chip.term
  dropdownDismissed.value = false
  focusInput()
}

function clearAll() {
  chips.value = []
  currentInput.value = ''
  dropdownDismissed.value = false
  focusInput()
}

// ---- Search ----
function executeSearch() {
  const request = buildSearchQueryRequestFromChips(chips.value, currentInput.value)

  if (!request) {
    focusInput()
    return
  }

  inputRef.value?.blur()
  dropdownDismissed.value = true

  emit('querySearch', request)
}

// ---- Suggestion focus ----
function focusSuggestion(rowIndex: number, colIndex: number) {
  dropdownRef.value
    ?.querySelector<HTMLElement>(`[data-suggestion="${rowIndex}:${colIndex}"]`)
    ?.focus()
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
    focusSuggestion(0, 0)
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
  if (event.key === 'Escape') {
    event.preventDefault()
    dropdownDismissed.value = true
    focusInput()
    return
  }

  if (!SEARCH_SUGGESTION_NAVIGATION_KEYS.includes(event.key)) return

  event.preventDefault()
  const rowLengths = suggestionRows.value.map((row) => visibleTerms(row).length)
  const target = getNextSearchSuggestionFocus(
    event.key,
    event.shiftKey,
    { rowIndex, colIndex },
    rowLengths,
  )

  if (target === 'input') {
    focusInput()
  } else if (target) {
    focusSuggestion(target.rowIndex, target.colIndex)
  }
}

// ---- Watchers ----
watch(dropdownRef, observeDropdown)

watch(suggestionRows, () => {
  // Buttons may be replaced without firing mouseleave/blur, so drop any stale preview.
  hoveredSuggestion.value = null
  focusedSuggestion.value = null

  if (showDropdown.value) {
    recomputeVisibleCounts()
  }
})

watch(showDropdown, (show) => {
  if (show) {
    recomputeVisibleCounts()
  } else {
    hoveredSuggestion.value = null
    focusedSuggestion.value = null
  }
})

// ---- Lifecycle ----
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

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

// ---- Expose ----
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
            <component :is="getRowIcon(row.kind)" class="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
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
              :aria-label="getSearchSuggestionAriaLabel(row.kind, term)"
              :title="term"
              :class="suggestionButtonClass"
              :data-suggestion="`${rowIndex}:${colIndex}`"
              @click="selectSuggestion(row.kind, term)"
              @keydown="handleSuggestionKeydown($event, rowIndex, colIndex)"
              @mouseenter="hoveredSuggestion = { kind: row.kind, term }"
              @mouseleave="hoveredSuggestion = null"
              @focus="focusedSuggestion = { kind: row.kind, term }"
              @blur="focusedSuggestion = null"
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
      <div :class="dropdownFooterClass">
        <!--
          Clarify that choosing a suggestion adds it to the search rather than searching directly.
          The `py-0.5` is used to make the label same height as the keycaps to avoid layout shifts
          when the label is shown/hidden.
        -->
        <span v-if="previewedSuggestion" class="py-0.5">
          Add {{ previewedSuggestionCategoryLabel }}
          <strong class="text-gray-700 dark:text-gray-200">{{ previewedSuggestion.term }}</strong>
          to the search
        </span>
        <template v-else>
          <span>Press</span>
          <Keycap size="small">&crarr;</Keycap>
          <span>to search, or</span>
          <Keycap size="small">Tab</Keycap>
          <span>/</span>
          <Keycap size="small">&darr;</Keycap>
          <span>to choose a suggestion</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
