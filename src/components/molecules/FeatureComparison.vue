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

const headerRowClasses = [
  'sticky top-[76px] z-10',
  'px-4 py-3',
  'flex items-center gap-4',
  'bg-gray-50 dark:bg-gray-800',
  'rounded-t-lg border-b border-gray-200 dark:border-gray-700'
]

const categoryTitleClasses = [
  'sticky top-[120px] z-10',
  'px-4 py-3',
  'bg-gray-100 dark:bg-gray-700',
  'border-t border-gray-200 dark:border-gray-700 -mt-[1px]',
]

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
 * The set of middle columns (neither the feature column nor the last column)
 * which hold the tick/cross availability icons and are centred.
 */
const iconColumns = computed(() =>
  tableHeaders.value.filter(
    (header: string, index: number) =>
      header !== featureColumn.value && index !== tableHeaders.value.length - 1,
  ),
)

/**
 * Groups the parsed rows by category. Rows with an integer id (e.g. 1, 2)
 * are treated as category group titles, and subsequent non-integer rows are
 * grouped under the most recent category row (ordering in the CSV matters).
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
  <LoadingBox v-if="isLoading" message="Loading latest data..." />

  <ErrorBlock
    v-else-if="errorMessage"
    title="Feature Comparison Error"
    :error="errorMessage"
  />

  <div v-else class="box p-0!" role="table">
    <div :class="headerRowClasses" role="row">
      <div class="flex-1 grid gap-4" :style="{ gridTemplateColumns }">
        <div
          v-for="header in tableHeaders"
          :key="header"
          class="font-semibold text-gray-900 dark:text-gray-100 capitalize"
          :class="iconColumns.includes(header) ? 'place-items-center text-center' : 'text-left'"
          role="columnheader"
        >
          {{ header }}
        </div>
      </div>
    </div>
    <ul class="divide-y divide-gray-200 dark:divide-gray-700" role="rowgroup">
      <template v-for="(group, groupIndex) in groupedData" :key="groupIndex">
        <li :class="categoryTitleClasses" role="row">
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
              :class="[
                header === featureColumn
                  ? 'font-medium text-gray-900 dark:text-gray-100 md:pl-8'
                  : '',
                iconColumns.includes(header) ? 'place-items-center' : '',
              ]"
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
