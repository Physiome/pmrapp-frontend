import type { SortableEntity, SortOption } from '@/types/common'
import type { SearchResult } from '@/types/search'
import { getExposureIdFromResourcePath } from '@/utils/exposure'

/**
 * Grouped sort options for dropdown with two groups: Fields and Direction
 */
export interface SortOptionGroup {
  group: string
  options: Array<{ value: string; label: string; type: 'field' | 'direction' }>
}

export const SORT_OPTIONS_GROUPED: SortOptionGroup[] = [
  {
    group: 'Fields',
    options: [
      { value: 'description', label: 'Description', type: 'field' },
      { value: 'id', label: 'ID', type: 'field' },
      { value: 'date', label: 'Date', type: 'field' },
    ],
  },
  {
    group: 'Direction',
    options: [
      { value: 'asc', label: 'Ascending', type: 'direction' },
      { value: 'desc', label: 'Descending', type: 'direction' },
    ],
  },
]

export const DEFAULT_SORT_OPTION: SortOption = 'description-asc'

interface SortValues {
  description: string | null
  id: number | null
  date: number | null
}

/**
 * Returns true if the given runtime value is a valid SortOption.
 */
export const isValidSortOption = (value: unknown): value is SortOption => {
  if (typeof value !== 'string') {
    return false
  }

  const fields =
    SORT_OPTIONS_GROUPED.find((g) => g.group === 'Fields')?.options.map((o) => o.value) ?? []
  const directions =
    SORT_OPTIONS_GROUPED.find((g) => g.group === 'Direction')?.options.map((o) => o.value) ?? []
  return fields.some((f) => directions.some((d) => `${f}-${d}` === value))
}

const compareNullableString = (a: string | null, b: string | null, desc = false): number => {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return desc ? b.localeCompare(a) : a.localeCompare(b)
}

const compareNullableNumber = (a: number | null, b: number | null, desc = false): number => {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return desc ? b - a : a - b
}

const sortByValues = <T>(
  items: T[],
  sortBy: SortOption,
  getValues: (item: T) => SortValues,
): T[] => {
  return [...items].sort((a, b) => {
    const valuesA = getValues(a)
    const valuesB = getValues(b)

    switch (sortBy) {
      case 'description-asc':
        return compareNullableString(valuesA.description, valuesB.description)
      case 'description-desc':
        return compareNullableString(valuesA.description, valuesB.description, true)
      case 'id-asc':
        return compareNullableNumber(valuesA.id, valuesB.id)
      case 'id-desc':
        return compareNullableNumber(valuesA.id, valuesB.id, true)
      case 'date-asc':
        return compareNullableNumber(valuesA.date, valuesB.date)
      case 'date-desc':
        return compareNullableNumber(valuesA.date, valuesB.date, true)
      default:
        return 0
    }
  })
}

const parseNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Sorting function for search results, which use a different data shape to SortableEntity.
 */
export function sortSearchResults(items: SearchResult[], sortBy: SortOption): SearchResult[] {
  return sortByValues(items, sortBy, (item) => {
    const createdTs = item.data.created_ts?.[0] ?? null

    return {
      description: item.data.description?.[0] ?? null,
      id: getExposureIdFromResourcePath(item.resource_path),
      date: parseNullableNumber(createdTs),
    }
  })
}

/**
 * Generic sorting function for entities with id, description, and created_ts.
 */
export function sortEntities<T extends SortableEntity>(items: T[], sortBy: SortOption): T[] {
  return sortByValues(items, sortBy, (item) => {
    return {
      description: item.entity.description,
      id: item.entity.id,
      date: item.entity.created_ts,
    }
  })
}
