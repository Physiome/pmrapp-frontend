<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CloseButton from '@/components/atoms/CloseButton.vue'
import SearchInput from '@/components/molecules/SearchInput.vue'
import { buildSearchQuery } from '@/utils/search'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<(e: 'close') => void>()

const router = useRouter()
const route = useRoute()
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null)

let isMouseDownOnBackdrop = false

const handleBackdropMouseDown = (event: MouseEvent) => {
  if (event.button !== 0) return
  isMouseDownOnBackdrop = true
}

const handleBackdropMouseUp = (event: MouseEvent) => {
  if (isMouseDownOnBackdrop && event.target === event.currentTarget) {
    emit('close')
  }
  isMouseDownOnBackdrop = false
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        searchInputRef.value?.searchInputRef?.focus()
      })
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      isMouseDownOnBackdrop = false
    }
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

const handleSearch = (searchKind: string, searchTerm: string) => {
  router.push({ path: '/search', query: buildSearchQuery(searchKind, searchTerm, route.query) })
  emit('close')
}

const getInitialTerm = (): string => {
  const filterQuery = route.query.filter
  const termQuery = route.query.term

  if (typeof filterQuery === 'string') {
    return filterQuery
  }

  if (typeof termQuery === 'string') {
    return termQuery
  }

  return ''
}

const getInitialKind = (): string => {
  const kindQuery = route.query.kind
  return typeof kindQuery === 'string' ? kindQuery : ''
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-800/75 dark:bg-gray-900/75 z-50 flex justify-center items-start pt-20"
    @mousedown.self="handleBackdropMouseDown"
    @mouseup="handleBackdropMouseUp"
  >
    <div class="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <div class="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <h2 class="text-lg font-semibold">Search</h2>
        <CloseButton @click="emit('close')" />
      </div>
      <div class="my-4 text-sm text-gray-500 dark:text-gray-400">
        <p class="lg:w-3/4">
          Search for models across authors, CellML keywords, and publication references.
          Start typing to see available terms grouped by category.
        </p>
      </div>
      <div class="py-4">
        <SearchInput
          ref="searchInputRef"
          :inOverlay="true"
          :initial-kind="getInitialKind()"
          :initial-term="getInitialTerm()"
          @search="handleSearch"
          @close="emit('close')"
        />
      </div>
    </div>
  </div>
</template>
