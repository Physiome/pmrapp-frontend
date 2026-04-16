import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { SortableEntity } from '@/types/common'
import type { QueryFilterOptions, TextSegment } from '@/types/search'
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
 * Builds a /search query and preserves the current sort option when it is valid.
 */
export const buildSearchQuery = (
  kind: string,
  term: string,
  currentQuery: LocationQuery,
): LocationQueryRaw => {
  const query: LocationQueryRaw = { kind, term }
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
