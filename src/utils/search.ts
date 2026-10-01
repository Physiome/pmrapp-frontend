import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { SortableEntity } from '@/types/common'
import { SEARCH_KIND_LABEL_SINGULAR_MAP, SEARCH_TEXT_QUERY_KIND } from '@/constants/search'
import type {
  QueryFilterOptions,
  SearchFilter,
  SearchFilterChip,
  SearchQueryRequest,
  SearchResult,
  SearchSuggestionFocusTarget,
  SearchSuggestionPosition,
  TextSegment,
} from '@/types/search'
import { ensureTrailingSlash } from '@/utils/path'
import { DEFAULT_SORT_OPTION, isValidSortOption } from '@/utils/sort'

/**
 * Returns true if a search term is valid (non-empty and not a broken URN).
 * Filters out:
 * - Empty or whitespace-only strings.
 * - Incomplete URN-style terms ending with 'pubmed:' (e.g. "urn:miriam:pubmed:").
 * - Unknown author placeholders (e.g. "unknown", "unknown unknown", or "unknown, unknown").
 */
export const isValidTerm = (term: string): boolean => {
  const trimmed = term.trim()
  if (!trimmed) return false
  if (trimmed.endsWith('pubmed:')) return false
  if (/^unknown([, ]+unknown)?$/i.test(trimmed)) return false
  return true
}

/**
 * Returns the terms that partially match `query` (case-insensitive substring).
 * Terms starting with the query are listed first, then the remaining matches,
 * each group keeping its original order. Invalid terms and `excluded` terms
 * (compared case-insensitively) are skipped. At most `limit` terms are returned.
 */
export const findMatchingTerms = (
  terms: string[],
  query: string,
  excluded: string[] = [],
  limit = 20,
): string[] => {
  const needle = query.trim().toLowerCase()
  if (!needle || limit <= 0) return []

  const excludedSet = new Set(excluded.map((term) => term.toLowerCase()))
  const prefixMatches: string[] = []
  const otherMatches: string[] = []

  for (const term of terms) {
    if (prefixMatches.length >= limit) break
    if (!isValidTerm(term)) continue

    const lowerTerm = term.toLowerCase()
    if (excludedSet.has(lowerTerm)) continue

    const index = lowerTerm.indexOf(needle)
    if (index === 0) {
      prefixMatches.push(term)
    } else if (index > 0 && otherMatches.length < limit) {
      otherMatches.push(term)
    }
  }

  return [...prefixMatches, ...otherMatches].slice(0, limit)
}

/**
 * Normalises a string for fuzzy search by replacing non-alphanumeric characters
 * (dashes, hyphens, single/double quotes, commas, parentheses, dots, etc.) with
 * spaces, then collapsing multiple consecutive spaces and trimming.
 */
export const normaliseSearchText = (text: string): string => {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Builds a /search query for a single filter in flat format and preserves the
 * current sort option when it is valid.
 */
export const buildSearchQuery = (
  kind: string,
  term: string,
  currentQuery: LocationQuery,
): LocationQueryRaw => {
  return buildQuerySearchQuery('', [{ kind, term }], currentQuery)
}

export const getQueryTextFromRouteQuery = (query: LocationQuery): string => {
  const value = query.query ?? query.SearchableText

  if (Array.isArray(value)) {
    const firstValue = value.find(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    )
    return firstValue?.trim() ?? ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

export const buildQuerySearchQuery = (
  queryText: string,
  filters: SearchFilter[],
  currentQuery: LocationQuery,
): LocationQueryRaw => {
  const query: LocationQueryRaw = {}
  const trimmedQueryText = queryText.trim()

  if (trimmedQueryText) {
    query.query = trimmedQueryText
  }

  const termsByKind = new Map<string, string[]>()
  for (const filter of filters) {
    const normalisedKind = filter.kind.trim()
    const normalisedTerm = filter.term.trim()
    if (!normalisedKind || !normalisedTerm) continue

    const terms = termsByKind.get(normalisedKind) ?? []
    terms.push(normalisedTerm)
    termsByKind.set(normalisedKind, terms)
  }

  for (const [kind, terms] of termsByKind) {
    query[kind] = terms.length === 1 ? (terms[0] as string) : terms
  }

  const sortQuery = currentQuery.sort
  if (
    typeof sortQuery === 'string' &&
    isValidSortOption(sortQuery) &&
    sortQuery !== DEFAULT_SORT_OPTION
  ) {
    query.sort = sortQuery
  }

  return query
}

const queryParamToStringArray = (value: LocationQuery[string]): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string') {
    return [value]
  }

  return []
}

/**
 * Parses flat kind-named filter params used for search API (api/search) queries.
 * e.g. ?cellml_keyword=cardiac&model_author=Noble
 */
export const parseQueryFiltersFromQuery = (
  query: LocationQuery,
  knownKinds: readonly string[],
): SearchFilter[] => {
  const filters: SearchFilter[] = []

  for (const kind of knownKinds) {
    for (const term of queryParamToStringArray(query[kind])) {
      if (term.trim()) {
        filters.push({ kind, term: term.trim() })
      }
    }
  }

  return filters
}

/**
 * Splits `original` into segments marking which parts match any of the given
 * `tokens`.
 *
 * Matching is case-insensitive and performed directly on the original text so
 * highlighted slices always align with the exact displayed characters.
 */
export const highlightTokens = (original: string, tokens: string[]): TextSegment[] => {
  if (!tokens.length || !original) return [{ text: original, highlighted: false }]

  const highlightMask = Array.from({ length: original.length }, () => false)
  const uniqueTokens = [...new Set(tokens.map((t) => t.trim()).filter((t) => t.length > 0))]

  for (const token of uniqueTokens) {
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedToken, 'gi')
    let match = regex.exec(original)

    while (match !== null) {
      const start = match.index
      const end = start + match[0].length
      for (let index = start; index < end; index += 1) {
        highlightMask[index] = true
      }
      match = regex.exec(original)
    }
  }

  const segments: TextSegment[] = []
  let segmentStart = 0

  for (let index = 1; index <= original.length; index += 1) {
    const prevHighlighted = highlightMask[index - 1]
    const nextHighlighted = index < original.length ? highlightMask[index] : prevHighlighted
    if (index === original.length || prevHighlighted !== nextHighlighted) {
      segments.push({
        text: original.slice(segmentStart, index),
        highlighted: prevHighlighted,
      })
      segmentStart = index
    }
  }

  return segments
}

export function filterItemsByQuery<T extends SortableEntity>(options: QueryFilterOptions<T>): T[] {
  const { query, items } = options
  const trimmedQuery = query.trim()

  if (!trimmedQuery) return items

  const tokens = normaliseSearchText(trimmedQuery.toLowerCase())
    .split(' ')
    .filter((t) => t.length > 0)

  if (tokens.length === 0) return items

  return items.filter((item) => {
    const searchableText = normaliseSearchText((item.entity.description || '').toLowerCase())
    const matchesSearchText = tokens.every((token) => searchableText.includes(token))
    const matchesId = item.entity.id.toString().includes(trimmedQuery)
    return matchesSearchText || matchesId
  })
}

/**
 * Resolves the destination link for a search result item.
 * Ensures a single trailing slash is present without duplicate slashes.
 * Falls back to exposure alias or empty string.
 */
export const getSearchResultLink = (item: SearchResult): string => {
  const uri = item.data?.aliased_uri?.[0]?.trim()
  if (uri) {
    return ensureTrailingSlash(uri)
  }

  const alias = item.data?.exposure_alias?.[0]?.trim()
  if (alias) {
    return `/exposure/${alias}/`
  }

  return ''
}

/**
 * Returns the label shown on a search chip, e.g. "Model author: Noble".
 * Free-text chips show the term only.
 */
export const getSearchChipLabel = (kind: string, term: string): string => {
  if (kind === SEARCH_TEXT_QUERY_KIND) return term
  const singularLabel = SEARCH_KIND_LABEL_SINGULAR_MAP[kind] || kind
  return `${singularLabel}: ${term}`
}

/**
 * Returns the accessible label for a search suggestion button.
 */
export const getSearchSuggestionAriaLabel = (kind: string, term: string): string => {
  if (kind === SEARCH_TEXT_QUERY_KIND) return `Add free text: ${term}`
  return `Add ${getSearchChipLabel(kind, term)}`
}

const generateSearchChipId = (): string => {
  return `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Creates a search chip with a unique id and its display label.
 */
export const createSearchChip = (kind: string, term: string): SearchFilterChip => ({
  id: generateSearchChipId(),
  kind,
  term,
  displayLabel: getSearchChipLabel(kind, term),
})

/**
 * Builds the search request from the chips and the current input text.
 * The typed text takes priority over an existing free-text chip as the query.
 * Returns null when there is nothing to search for.
 */
export const buildSearchQueryRequestFromChips = (
  chips: SearchFilterChip[],
  inputText: string,
): SearchQueryRequest | null => {
  const existingTextChip = chips.find((c) => c.kind === SEARCH_TEXT_QUERY_KIND)
  const queryText = inputText.trim() || existingTextChip?.term || ''

  const filters: SearchFilter[] = chips
    .filter((c) => c.kind !== SEARCH_TEXT_QUERY_KIND)
    .map((c) => ({ kind: c.kind, term: c.term }))

  if (!queryText && filters.length === 0) return null

  return {
    query: queryText || undefined,
    filters: filters.length > 0 ? filters : undefined,
  }
}

/**
 * Resolves where focus moves when a navigation key is pressed on a suggestion
 * button, given the number of visible buttons in each row.
 * - ArrowRight/ArrowLeft move along a row, wrapping into the adjacent row.
 * - ArrowDown/ArrowUp move to the same column in the adjacent row (clamped).
 * - Tab/Shift+Tab step through buttons in order, returning to the input at either end.
 * Returns null when focus should stay where it is.
 */
export const getNextSearchSuggestionFocus = (
  key: string,
  shiftKey: boolean,
  { rowIndex, colIndex }: SearchSuggestionPosition,
  rowLengths: number[],
): SearchSuggestionFocusTarget | null => {
  const lastRowIndex = rowLengths.length - 1
  const lastColIndexOf = (row: number) => (rowLengths[row] ?? 0) - 1

  switch (key) {
    case 'ArrowRight': {
      if (colIndex < lastColIndexOf(rowIndex)) return { rowIndex, colIndex: colIndex + 1 }
      return { rowIndex: rowIndex < lastRowIndex ? rowIndex + 1 : 0, colIndex: 0 }
    }
    case 'ArrowLeft': {
      if (colIndex > 0) return { rowIndex, colIndex: colIndex - 1 }
      if (rowIndex > 0) return { rowIndex: rowIndex - 1, colIndex: lastColIndexOf(rowIndex - 1) }
      return 'input'
    }
    case 'ArrowDown': {
      if (rowIndex < lastRowIndex) {
        return {
          rowIndex: rowIndex + 1,
          colIndex: Math.min(colIndex, lastColIndexOf(rowIndex + 1)),
        }
      }
      return null
    }
    case 'ArrowUp': {
      if (rowIndex > 0) {
        return {
          rowIndex: rowIndex - 1,
          colIndex: Math.min(colIndex, lastColIndexOf(rowIndex - 1)),
        }
      }
      return 'input'
    }
    case 'Tab': {
      if (shiftKey) {
        if (rowIndex === 0 && colIndex === 0) return 'input'
        if (colIndex > 0) return { rowIndex, colIndex: colIndex - 1 }
        return { rowIndex: rowIndex - 1, colIndex: lastColIndexOf(rowIndex - 1) }
      }
      if (rowIndex === lastRowIndex && colIndex === lastColIndexOf(rowIndex)) return 'input'
      if (colIndex < lastColIndexOf(rowIndex)) return { rowIndex, colIndex: colIndex + 1 }
      return { rowIndex: rowIndex + 1, colIndex: 0 }
    }
    default:
      return null
  }
}
