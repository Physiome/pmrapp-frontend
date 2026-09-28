import type { SortableEntity } from './common'

export interface IndexesResponse {
  indexes: string[]
}

export interface KindInfo {
  id: number
  description: string
}

export interface IndexKindResponse {
  kind: KindInfo
  terms: string[]
}

export interface SearchResult {
  data: {
    aliased_uri: string[]
    cellml_keyword: string[]
    commit_authored_ts: string[]
    created_ts: string[]
    description: string[]
    exposure_alias: string[]
    citation_author_family_name: string[]
    citation_id: string[]
    model_author: string[]
    _title?: string[]
    _brief?: string[]
  }
  resource_path: string
}

export interface IndexSearchResult {
  kind: {
    description: string
    id: number
  }
  resource_paths: SearchResult[]
  term: string
}

export interface SearchQueryResponse {
  results: SearchResult[]
}

export interface SearchFilter {
  kind: string
  term: string
}

export interface SearchQueryRequest {
  query?: string
  filters?: SearchFilter[]
}

export interface TextSegment {
  text: string
  highlighted: boolean
}

export interface QueryFilterOptions<T extends SortableEntity> {
  query: string
  items: T[]
}

export interface SearchFilterChip extends SearchFilter {
  id: string
  displayLabel: string
}

export interface SearchSuggestionRow {
  kind: string
  label: string
  terms: string[]
}

export interface SearchSuggestionPosition {
  rowIndex: number
  colIndex: number
}

// Where focus should move next: a suggestion button, or back to the search input.
export type SearchSuggestionFocusTarget = SearchSuggestionPosition | 'input'
