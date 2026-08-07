<script setup lang="ts">
import Papa from 'papaparse'
import { onMounted, ref } from 'vue'
import ErrorBlock from '@/components/molecules/ErrorBlock.vue'
import LoadingBox from '@/components/atoms/LoadingBox.vue'
import type {
  ComparisonRow,
  ParseCompleteResults,
  ParseErrorEvent,
} from '@/types/featureComparison'

const tableData = ref<ComparisonRow[]>([])
const tableHeaders = ref<string[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const SHEET_CSV_URL = import.meta.env.VITE_FEATURE_COMPARISON_SHEET_CSV_URL

if (!SHEET_CSV_URL) {
  errorMessage.value = 'Feature comparison data URL is not configured.'
}

onMounted(() => {
  if (!SHEET_CSV_URL) {
    isLoading.value = false
    return
  }

  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results: ParseCompleteResults) => {
      tableData.value = results.data
      tableHeaders.value = results.meta.fields?.filter((header: string) => header !== 'id') ?? []
      isLoading.value = false
    },
    error: (error: ParseErrorEvent) => {
      console.error('Error fetching sheet:', error)
      errorMessage.value = 'Failed to load comparison data.'
      isLoading.value = false
    },
  })
})
</script>

<template>
  <LoadingBox v-if="isLoading" message="Loading latest data from Google Sheets..." />

  <ErrorBlock
    v-else-if="errorMessage"
    title="Feature Comparison Error"
    :error="errorMessage"
  />

  <div v-else class="box p-0! overflow-hidden" role="table">
    <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4" role="row">
      <div class="flex-1 grid gap-4" :style="{ gridTemplateColumns: `repeat(${tableHeaders.length}, 1fr)` }">
        <div
          v-for="header in tableHeaders"
          :key="header"
          class="text-left font-semibold text-gray-900 dark:text-gray-100 capitalize"
          role="columnheader"
        >
          {{ header }}
        </div>
      </div>
    </div>
    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
      <li
        v-for="row in tableData"
        :key="row.id"
        class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        role="row"
      >
        <div class="px-4 py-3 grid gap-4" :style="{ gridTemplateColumns: `repeat(${tableHeaders.length}, 1fr)` }">
          <div
            v-for="header in tableHeaders"
            :key="header + row.id"
            class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words"
            :class="header === 'feature' ? 'font-medium text-gray-900 dark:text-gray-100' : ''"
            role="cell"
          >
            {{ row[header] }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@import '@/assets/box.css';
</style>
