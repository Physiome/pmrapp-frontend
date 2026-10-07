<script setup lang="ts">
import { onMounted } from 'vue'
import List from '@/components/molecules/List.vue'
import { useExposureStore } from '@/stores/exposure'
import type { Exposure } from '@/types/exposure'

const emit = defineEmits<{
  updateFilteredCount: [filteredCount: number, totalCount: number, hasFilter: boolean]
}>()

const exposureStore = useExposureStore()

const handleRefresh = async () => {
  await exposureStore.fetchExposures(true)
}

const getTitle = (exposure: Exposure) => {
  return exposure.entity.description || `Exposure ${exposure.entity.id}`
}

onMounted(async () => {
  await exposureStore.fetchExposures()
})
</script>

<template>
  <List
    :items="exposureStore.exposures"
    :is-loading="exposureStore.isLoading"
    :error="exposureStore.error"
    content-section="Exposure Listing"
    error-title="Error loading exposures"
    empty-message="No exposures found."
    route-base="/exposure"
    :get-title="getTitle"
    @refresh="handleRefresh"
    @update-filtered-count="(...args) => emit('updateFilteredCount', ...args)"
  />
</template>
