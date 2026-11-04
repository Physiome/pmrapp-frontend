<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import Exposures from '@/components/organisms/Exposures.vue'
import { useExposureStore } from '@/stores/exposure'
import { formatNumber } from '@/utils/format'

const exposureStore = useExposureStore()
const filteredCount = ref(0)
const totalCount = ref(0)
const hasFilter = ref(false)

const handleFilteredCountUpdate = (filtered: number, total: number, isFiltering: boolean) => {
  filteredCount.value = filtered
  totalCount.value = total
  hasFilter.value = isFiltering
}

const description = computed(() => {
  if (exposureStore.isLoading) {
    return 'Loading exposures...'
  }

  if (exposureStore.error) {
    return 'Unable to load exposures. Please try refreshing.'
  }

  if (totalCount.value === 0) {
    return 'No exposures found. Please try refreshing.'
  }

  if (hasFilter.value) {
    if (filteredCount.value === 0) return 'No exposures found. Try a different keyword.'
    if (filteredCount.value !== totalCount.value)
      return `Showing ${formatNumber(filteredCount.value)} of ${formatNumber(totalCount.value)} exposure${totalCount.value !== 1 ? 's' : ''}.`
  }

  const count = totalCount.value
  return `Browse and explore ${count > 1 ? 'all ' : ''}${formatNumber(count)} exposure${count > 1 ? 's' : ''}.`
})
</script>

<template>
  <PageHeader title="Exposure listing" :description="description" />
  <Exposures @update-filtered-count="handleFilteredCountUpdate" />
</template>
