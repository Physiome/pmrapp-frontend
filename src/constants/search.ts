export const SEARCH_CATEGORIES = [
  {
    value: 'citation_author_family_name',
    label: 'Publication authors',
    labelSingular: 'Publication author',
  },
  { value: 'model_author', label: 'Model authors', labelSingular: 'Model author' },
  { value: 'cellml_keyword', label: 'CellML keywords', labelSingular: 'CellML keyword' },
  { value: 'citation_id', label: 'Publication references', labelSingular: 'Publication reference' },
] as const

export const SEARCH_KIND_LABEL_MAP: Record<string, string> = Object.fromEntries(
  SEARCH_CATEGORIES.map((cat) => [cat.value, cat.label]),
)

export const SEARCH_KIND_LABEL_SINGULAR_MAP: Record<string, string> = Object.fromEntries(
  SEARCH_CATEGORIES.map((cat) => [cat.value, cat.labelSingular]),
)

export const SEARCH_KIND_NAMES = SEARCH_CATEGORIES.map((c) => c.value) as readonly string[]

// Kind and label used for the free-text query chip and suggestion row.
export const SEARCH_TEXT_QUERY_KIND = '_text_query'
export const SEARCH_TEXT_QUERY_LABEL = 'Free text'

// Maximum number of candidate terms per category; only those that fit the dropdown width are shown.
export const SEARCH_SUGGESTIONS_MAX_TERMS_PER_CATEGORY = 20

// Keys handled when moving focus between search suggestion buttons.
export const SEARCH_SUGGESTION_NAVIGATION_KEYS: readonly string[] = [
  'ArrowRight',
  'ArrowLeft',
  'ArrowDown',
  'ArrowUp',
  'Tab',
]
