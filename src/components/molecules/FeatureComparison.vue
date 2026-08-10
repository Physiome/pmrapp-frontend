<script setup lang="ts">
import Papa from 'papaparse'
import { computed, onMounted, ref } from 'vue'
import LoadingBox from '@/components/atoms/LoadingBox.vue'
import CheckmarkIcon from '@/components/icons/CheckmarkIcon.vue'
import CrossIcon from '@/components/icons/CrossIcon.vue'
import ErrorBlock from '@/components/molecules/ErrorBlock.vue'
import type {
  ComparisonRow,
  ParseCompleteResults,
  ParseErrorEvent,
} from '@/types/featureComparison'

interface ComparisonGroup {
  title: string
  rows: ComparisonRow[]
}

const tableData = ref<ComparisonRow[]>([])
const tableHeaders = ref<string[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const SHEET_CSV_URL = import.meta.env.VITE_FEATURE_COMPARISON_SHEET_CSV_URL

if (!SHEET_CSV_URL) {
  errorMessage.value = 'Feature comparison data URL is not configured.'
}

/**
 * The name of the column that holds the feature/category title.
 * Papa Parse preserves the original header casing, so this is matched
 * case-insensitively to be robust against variations such as "Feature".
 */
const featureColumn = computed(() =>
  tableHeaders.value.find((header: string) => header.toLowerCase() === 'feature'),
)

/**
 * Defines the relative widths of the table columns.
 * The feature column and note column are given more space,
 * while the remaining columns (which typically hold the
 * tick/cross availability icons) are kept narrower.
 */
const gridTemplateColumns = computed(() =>
  tableHeaders.value
    .map((header: string, index: number) => {
      if (header === featureColumn.value) {
        return '1fr'
      }
      // The last column is given a wider width than the middle icon columns.
      return index === tableHeaders.value.length - 1 ? '1fr' : '0.5fr'
    })
    .join(' '),
)

/**
 * Groups the parsed rows by category. Rows with an integer id (e.g. 1, 2)
 * are treated as category group titles, while rows with a decimal id
 * (e.g. 1.1, 1.2) are grouped under the category matching their integer part.
 * Rows without an id (all-null rows) are stripped out.
 */
const groupedData = computed<ComparisonGroup[]>(() => {
  const groups: ComparisonGroup[] = []
  let currentGroup: ComparisonGroup | null = null

  for (const row of tableData.value) {
    const id = row.id

    // Skip rows without an id, such as the all-null separator rows.
    if (id === null || id === undefined || id === '') {
      continue
    }

    const numericId = Number(id)
    if (Number.isInteger(numericId)) {
      // This row is a category group title.
      currentGroup = {
        title: featureColumn.value ? String(row[featureColumn.value] ?? '') : '',
        rows: [],
      }
      groups.push(currentGroup)
    } else if (currentGroup) {
      // This row belongs to the current category group.
      currentGroup.rows.push(row)
    }
  }

  return groups
})

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
      <div class="flex-1 grid gap-4" :style="{ gridTemplateColumns }">
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
      <template v-for="group in groupedData" :key="group.title">
        <li
          class="bg-gray-100 dark:bg-gray-700 px-4 py-3"
          role="row"
        >
          <div class="font-semibold dark:font-normal text-sm text-gray-700 dark:text-gray-200">
            {{ group.title }}
          </div>
        </li>
        <li
          v-for="(row, index) in group.rows"
          :key="row.id ?? index"
          class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          role="row"
        >
          <div class="px-4 py-3 grid gap-4" :style="{ gridTemplateColumns }">
            <div
              v-for="header in tableHeaders"
              :key="header + row.id"
              class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words"
              :class="header === featureColumn ? 'font-medium text-gray-900 dark:text-gray-100' : ''"
              role="cell"
            >
              <CheckmarkIcon
                v-if="String(row[header]).trim().toLowerCase() === 'yes'"
                class="w-5 h-5 text-green-600 dark:text-green-400"
                aria-label="Yes"
              />
              <CrossIcon
                v-else-if="String(row[header]).trim().toLowerCase() === 'no'"
                class="w-5 h-5 text-red-600 dark:text-red-400"
                aria-label="No"
              />
              <template v-else>
                {{ row[header] }}
              </template>
            </div>
          </div>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
@import '@/assets/box.css';
</style>
