<script setup lang="ts">
import ActionButton from '@/components/atoms/ActionButton.vue'
import SearchField from '@/components/atoms/SearchField.vue'
import RefreshIcon from '@/components/icons/RefreshIcon.vue'
import SortDropdown from '@/components/molecules/SortDropdown.vue'
import type { SortOption } from '@/types/common'
import { DEFAULT_SORT_OPTION, SORT_OPTIONS_GROUPED } from '@/utils/sort'

interface Props {
  filterQuery: string
  isLoading: boolean
  filterPlaceholder?: string
  contentSection: string
  sortBy?: SortOption
}

const props = withDefaults(defineProps<Props>(), {
  filterPlaceholder: 'Filter by description or ID...',
  sortBy: DEFAULT_SORT_OPTION,
})

const emit = defineEmits<{
  'update:filterQuery': [value: string]
  'update:sortBy': [value: SortOption]
  refresh: []
}>()

const handleRefresh = () => {
  emit('refresh')
}
</script>

<template>
  <div class="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
    <div class="flex-1 w-full sm:w-auto flex flex-col sm:flex-row gap-4">
      <SearchField
        class="flex-1"
        :model-value="filterQuery"
        :placeholder="filterPlaceholder"
        input-class="input-field w-full sm:flex-1"
        @update:model-value="(value) => emit('update:filterQuery', value)"
      />
      <div class="flex items-center gap-2">
        <SortDropdown
          :model-value="sortBy"
          :options="SORT_OPTIONS_GROUPED"
          @update:model-value="(value) => emit('update:sortBy', value)"
        />
      </div>
    </div>
    <ActionButton
      variant="secondary"
      size="lg"
      :disabled="isLoading"
      :content-section="contentSection"
      @click="handleRefresh"
    >
      <RefreshIcon />
      <span>{{ isLoading ? 'Loading...' : 'Refresh' }}</span>
    </ActionButton>
  </div>
</template>
