<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchField from '@/components/atoms/SearchField.vue'
import TermButton from '@/components/atoms/TermButton.vue'
import { useSearchStore } from '@/stores/search'
import { buildSearchQuery, isValidTerm } from '@/utils/search'

interface Props {
  inSidebar: boolean
}

const props = defineProps<Props>()

const searchStore = useSearchStore()
const router = useRouter()
const categoryFilters = ref<Map<string, string>>(new Map())
const cellmlKeywordKind = 'cellml_keyword'
const cellmlKeywordCategory = computed(() =>
  searchStore.categories.filter((cat) => cat.kind === cellmlKeywordKind),
)

onMounted(async () => {
  if (!searchStore.isLoading && searchStore.categories.length === 0) {
    await searchStore.fetchCategories([cellmlKeywordKind])
  }
})

const handleTermClick = async (kind: string, term: string) => {
  const currentRoute = router.currentRoute.value
  const query = buildSearchQuery(kind, term, currentRoute.query)
  // If already on search page, replace query params to avoid duplicate navigation.
  // Otherwise, push to search page.
  if (currentRoute.path === '/search') {
    await router.replace({ path: '/search', query })
  } else {
    await router.push({ path: '/search', query })
  }
}

const getFilteredTerms = (terms: string[] | null | undefined, kind: string): string[] => {
  const filter = categoryFilters.value.get(kind)?.toLowerCase() || ''
  const safeTerms = terms ?? []
  return safeTerms.filter(
    (t) => isValidTerm(t) && (filter === '' || t.toLowerCase().includes(filter)),
  )
}

const updateFilter = (kind: string, value: string) => {
  categoryFilters.value.set(kind, value)
}

const searchFieldInputClass = computed(() => {
  const baseClass = 'input-field input-field-sm'
  if (props.inSidebar) {
    return `${baseClass} w-full`
  }
  return baseClass
})
</script>

<template>
  <div :class="{ 'box box-small': inSidebar }">
    <h2 class="text-3xl font-bold mb-6" v-if="!inSidebar">
      Browse by keyword
    </h2>

    <div v-if="searchStore.isLoading" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">Loading categories...</p>
    </div>

    <div v-else-if="searchStore.error" class="text-center py-8">
      <p class="text-red-600 dark:text-red-400">{{ searchStore.error }}</p>
    </div>

    <div v-else class="space-y-4">
      <h3 v-if="inSidebar" class="font-semibold">Keywords</h3>
      <div
        v-for="category in cellmlKeywordCategory"
        :key="category.kind"
        :class="{ 'box p-6': !inSidebar }"
      >
        <div
          class="flex items-center mb-4 gap-4"
          :class="{ 'justify-end mb-6': !inSidebar }"
        >
          <SearchField
            v-if="category.kindInfo"
            :model-value="categoryFilters.get(category.kind) || ''"
            placeholder="Filter keywords..."
            aria-label="Filter keywords"
            :input-class="searchFieldInputClass"
            @update:model-value="(value) => updateFilter(category.kind, value)"
          />
        </div>

        <div v-if="category.loading" class="text-gray-500 dark:text-gray-400">
          Loading...
        </div>

        <div v-else-if="category.error" class="text-red-600 dark:text-red-400">
          {{ category.error }}
        </div>

        <div
          v-else-if="category.kindInfo"
          class="flex flex-wrap gap-2 overflow-y-auto border border-gray-200 dark:border-gray-700 p-2 rounded-md scrollbar-thin"
          :class="inSidebar ? 'max-h-[300px]' : 'max-h-40'"
        >
          <TermButton
            v-for="term in getFilteredTerms(category.kindInfo.terms, category.kind)"
            :key="term"
            :term="term"
            @click="handleTermClick(category.kind, term)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/box.css';
</style>
