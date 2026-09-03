import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { SortableEntity } from '@/types/common'
import type { QueryFilterOptions, SearchFilter, SearchResult, TextSegment } from '@/types/search'
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
