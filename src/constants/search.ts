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

export const TEXT_QUERY_KIND = '_text_query'
export const TEXT_QUERY_LABEL = 'Free text'
