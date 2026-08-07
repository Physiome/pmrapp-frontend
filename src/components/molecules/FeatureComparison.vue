<script setup lang="ts">
import Papa from 'papaparse'
import { onMounted, ref } from 'vue'
import type { ComparisonRow, ParseCompleteResults, ParseErrorEvent } from '@/types/featureComparison'

const tableData = ref<ComparisonRow[]>([])
const tableHeaders = ref<string[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const SHEET_CSV_URL = import.meta.env.VITE_FEATURE_COMPARISON_SHEET_CSV_URL

onMounted(() => {
  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    newline: '', // auto-detect
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results: ParseCompleteResults) => {
      tableData.value = results.data;
      tableHeaders.value = results.meta.fields?.filter((header: string) => header !== 'id') ?? [];
      isLoading.value = false;
    },
    error: (error: ParseErrorEvent) => {
      console.error("Error fetching sheet:", error);
      errorMessage.value = "Failed to load comparison data.";
      isLoading.value = false;
    }
  });
});
</script>

<template>
  <!-- Loading -->
  <div v-if="isLoading" class="text-center text-gray-500 py-10 animate-pulse">
    Loading latest data from Google Sheets...
  </div>

  <!-- Error -->
  <div v-else-if="errorMessage" class="text-center text-red-500 py-10 bg-red-50 rounded-lg">
    {{ errorMessage }}
  </div>

  <!-- Success: Comparison Table -->
  <div v-else class="box p-0! overflow-hidden">
    <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
      <div class="flex-1 grid gap-4" :style="{ gridTemplateColumns: `repeat(${tableHeaders.length}, 1fr)` }">
        <div
          v-for="header in tableHeaders"
          :key="header"
          class="text-left font-semibold text-gray-900 dark:text-gray-100 capitalize"
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
      >
        <div class="px-4 py-3 grid gap-4" :style="{ gridTemplateColumns: `repeat(${tableHeaders.length}, 1fr)` }">
          <div
            v-for="header in tableHeaders"
            :key="header + row.id"
            class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words"
            :class="header === 'feature' ? 'font-medium text-gray-900 dark:text-gray-100' : ''"
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
