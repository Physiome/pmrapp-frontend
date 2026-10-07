<script setup lang="ts">
interface Props {
  lines?: number
  media?: boolean
}

withDefaults(defineProps<Props>(), {
  lines: 3,
  media: false,
})
</script>

<template>
  <div class="animate-pulse space-y-3" role="status" aria-label="Loading">
    <div
      v-for="line in lines"
      :key="line"
      class="h-3 rounded bg-gray-200 dark:bg-gray-700"
      :class="line === lines ? 'w-2/3' : 'w-full'"
    ></div>
    <div v-if="media" class="h-48 w-full max-w-md mx-auto rounded bg-gray-200 dark:bg-gray-700"></div>
    <span class="sr-only">Loading...</span>
  </div>
</template>
