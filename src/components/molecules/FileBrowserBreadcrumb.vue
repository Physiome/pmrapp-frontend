<script setup lang="ts">
import { computed } from 'vue'
import { getPathSegments } from '@/utils/path'

const props = defineProps<{
  path: string
  onPathChange: (path: string | undefined) => void
}>()

const pathSegments = computed(() => getPathSegments(props.path))
</script>

<template>
  <nav aria-label="File path" class="flex items-center gap-1 text-sm min-w-0 flex-1 overflow-hidden">
    <button
      type="button"
      class="text-link shrink-0 truncate text-left cursor-pointer"
      @click="props.onPathChange(undefined)"
    >
      Files
    </button>

    <template v-for="(segment, index) in pathSegments" :key="index">
      <span class="text-gray-400 dark:text-gray-500 shrink-0" aria-hidden="true">/</span>
      <button
        v-if="index < pathSegments.length - 1"
        type="button"
        class="text-link truncate text-left cursor-pointer"
        @click="props.onPathChange(segment.path)"
      >
        {{ segment.name }}
      </button>
      <span v-else class="text-gray-800 dark:text-gray-200 font-medium truncate" aria-current="page">
        {{ segment.name }}
      </span>
    </template>
  </nav>
</template>

<style scoped>
@import '@/assets/text-link.css';
</style>
