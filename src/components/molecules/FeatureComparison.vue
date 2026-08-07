<script setup lang="ts">
import Papa from 'papaparse'
import { onMounted, ref } from 'vue'

const tableData = ref([])
const tableHeaders = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const SHEET_CSV_URL = import.meta.env.VITE_FEATURE_COMPARISON_SHEET_CSV_URL

onMounted(() => {
  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results) => {
      tableData.value = results.data;
      tableHeaders.value = results.meta.fields.filter(header => header !== 'id');
      isLoading.value = false;
    },
    error: (error) => {
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
  <div v-else class="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
    <table class="min-w-full divide-y divide-gray-300">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="header in tableHeaders"
            :key="header"
            scope="col"
            class="py-3.5 px-4 text-left text-sm font-semibold text-gray-900 capitalize"
          >
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        <tr v-for="row in tableData" :key="row.id" class="hover:bg-gray-50 transition-colors">
          <td
            v-for="header in tableHeaders"
            :key="header + row.id"
            class="px-4 py-4 text-sm"
            :class="header === 'feature' ? 'font-medium text-gray-900' : 'text-gray-600'"
          >
            {{ row[header] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
