<script
  setup
  lang="ts"
  generic="
    T extends {
      alias: string
      entity: { id: number; created_ts: number; description: string | null }
    },
  "
>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ListContent from '@/components/molecules/ListContent.vue'
import ListItem from '@/components/molecules/ListItem.vue'
import ListToolbar from '@/components/molecules/ListToolbar.vue'
import type { SortOption } from '@/types/common'
import { formatDate } from '@/utils/format'
import { filterItemsByQuery, highlightTokens, normaliseSearchText } from '@/utils/search'
import { DEFAULT_SORT_OPTION, isValidSortOption, sortEntities } from '@/utils/sort'

interface Props<T> {
  items: T[]
  isLoading: boolean
  error: string | null
  errorTitle: string
  contentSection: string
  emptyMessage: string
  routeBase: string
  getTitle: (item: T) => string
}

const props = defineProps<Props<T>>()

const emit = defineEmits<{
  refresh: []
  updateFilteredCount: [filteredCount: number, totalCount: number, hasFilter: boolean]
}>()

const route = useRoute()
const router = useRouter()
const filterQuery = ref((route.query.filter as string) || '')

const activeQueryTokens = computed<string[]>(() => {
  if (!filterQuery.value.trim()) return []
  return normaliseSearchText(filterQuery.value.toLowerCase())
    .split(' ')
    .filter((t) => t.length > 0)
})

const sortQuery = route.query.sort
const initialSort: SortOption =
  typeof sortQuery === 'string' && isValidSortOption(sortQuery) ? sortQuery : DEFAULT_SORT_OPTION
const sortBy = ref<SortOption>(initialSort)

watch(
  () => route.query.filter,
  (newFilter) => {
    const nextFilter = typeof newFilter === 'string' ? newFilter : ''
    if (filterQuery.value !== nextFilter) {
      filterQuery.value = nextFilter
    }
  },
)

watch(
  () => route.query.sort,
  (newSort) => {
    const nextSort =
      typeof newSort === 'string' && isValidSortOption(newSort) ? newSort : DEFAULT_SORT_OPTION
    if (sortBy.value !== nextSort) {
      sortBy.value = nextSort
    }
  },
)

// Sync filter and sort with URL query parameters.
watch([filterQuery, sortBy], ([newFilter, newSort]) => {
  const query: Record<string, string> = {}
  const trimmedFilter = newFilter.trim()
  if (trimmedFilter) query.filter = trimmedFilter
  if (newSort !== DEFAULT_SORT_OPTION) query.sort = newSort
  router.replace({ query })
})

const handleRefresh = async () => {
  emit('refresh')
}

const filteredItems = computed(() => {
  const filtered = filterItemsByQuery({
    query: filterQuery.value,
    items: props.items,
  })

  return sortEntities(filtered, sortBy.value)
})

const filteredItemSegments = computed(() =>
  filteredItems.value.map((item) => highlightTokens(props.getTitle(item), activeQueryTokens.value)),
)

const filteredItemIdSegments = computed(() =>
  filteredItems.value.map((item) =>
    highlightTokens(item.entity.id.toString(), activeQueryTokens.value),
  ),
)

watch(
  [filteredItems, () => props.items.length],
  () => {
    emit(
      'updateFilteredCount',
      filteredItems.value.length,
      props.items.length,
      !!filterQuery.value.trim(),
    )
  },
  { immediate: true },
)
</script>

<template>
  <ListToolbar
    v-model:filter-query="filterQuery"
    v-model:sort-by="sortBy"
    :is-loading="props.isLoading"
    :content-section="props.contentSection"
    @refresh="handleRefresh"
  />

  <ListContent
    :items="filteredItems"
    :error="props.error"
    :is-loading="props.isLoading"
    :error-title="props.errorTitle"
    :empty-message="props.emptyMessage"
  >
    <template #item>
      <ListItem
        v-for="(item, index) in filteredItems"
        :key="item.alias"
        :title="props.getTitle(item)"
        :link="`${props.routeBase}/${item.alias}`"
      >
        <template #title>
          <template v-for="(segment, si) in filteredItemSegments[index]" :key="si">
            <mark v-if="segment.highlighted" class="text-highlight">{{ segment.text }}</mark>
            <span v-else>{{ segment.text }}</span>
          </template>
        </template>
        <p class="text-gray-600 dark:text-gray-400">
          <small>
            #<template v-for="(segment, si) in filteredItemIdSegments[index]" :key="`id-${si}`">
              <mark v-if="segment.highlighted" class="text-highlight">{{ segment.text }}</mark>
              <span v-else>{{ segment.text }}</span>
            </template>
            · Created on {{ formatDate(item.entity.created_ts) }}
          </small>
        </p>
      </ListItem>
    </template>
  </ListContent>
</template>
