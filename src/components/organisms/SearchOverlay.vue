<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Keycap from '@/components/atoms/Keycap.vue'
import Dialog from '@/components/molecules/Dialog.vue'
import { SEARCH_KIND_NAMES } from '@/constants/search'
import { buildQuerySearchQuery, buildSearchQuery, parseQueryFiltersFromQuery } from '@/utils/search'
import SearchComboBox from '../molecules/SearchComboBox.vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<(e: 'close') => void>()

const router = useRouter()
const route = useRoute()

const searchComboBoxRef = ref<InstanceType<typeof SearchComboBox> | null>(null)
const dropdownSpacerHeight = ref(0)

watch(
  () => props.show,
  (show) => {
    if (show) {
      nextTick(() => {
        searchComboBoxRef.value?.focusInput()
      })
    }
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => {
    if (props.show) {
      emit('close')
    }
  },
)

const handleSearch = (searchKind: string, searchTerm: string) => {
  router.push({ path: '/search', query: buildSearchQuery(searchKind, searchTerm, route.query) })
  emit('close')
}

const handleQuerySearch = (request: {
  query?: string
  filters?: Array<{ kind: string; term: string }>
}) => {
  router.push({
    path: '/search',
    query: buildQuerySearchQuery(request.query ?? '', request.filters ?? [], route.query),
  })
  emit('close')
}

const getInitialTerm = (): string => {
  const queryParam = route.query.query

  if (typeof queryParam === 'string') {
    return queryParam
  }

  return ''
}
</script>

<template>
  <Dialog
    :show="show"
    title="Search"
    position="top"
    :overflow-content="false"
    @close="emit('close')"
  >
    <!-- <div class="mb-4 text-sm text-gray-500 dark:text-gray-400">
      Type a term and press <Keycap>Enter</Keycap> to search the repository,
      or use the more options to filter by category (author, keyword, publication references), or combine both.
    </div> -->
    <!-- <SearchInput
      ref="searchInputRef"
      :inOverlay="true"
      :initial-kind="''"
      :initial-term="getInitialTerm()"
      :initial-filters="parseQueryFiltersFromQuery(route.query, SEARCH_KIND_NAMES)"
      @search="handleSearch"
      @querySearch="handleQuerySearch"
      @close="emit('close')"
    /> -->
    <SearchComboBox
      ref="searchComboBoxRef"
      class="flex-1 w-full md:w-auto"
      :initial-query="getInitialTerm()"
      :initial-filters="parseQueryFiltersFromQuery(route.query, SEARCH_KIND_NAMES)"
      :in-overlay="true"
      @query-search="handleQuerySearch"
      @dropdown-height-change="(h) => (dropdownSpacerHeight = h)"
    />
    <!-- Spacer that grows the dialog to accommodate the absolute-positioned dropdown -->
    <div :style="{ height: dropdownSpacerHeight > 0 ? `${dropdownSpacerHeight}px` : '0' }" aria-hidden="true" />
  </Dialog>
</template>
