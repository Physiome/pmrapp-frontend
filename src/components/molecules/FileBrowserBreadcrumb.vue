<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  alias: string
  commitId: string
  path: string
  onPathChange?: (path: string | undefined) => void
}>()

const pathSegments = computed(() => props.path.split('/').filter(Boolean))
</script>

<template>
  <nav aria-label="File path" class="flex items-center gap-1 text-sm min-w-0 flex-1 overflow-hidden">
    <button
      v-if="props.onPathChange"
      type="button"
      class="text-link shrink-0 truncate text-left cursor-pointer"
      @click="props.onPathChange(undefined)"
    >
      Files
    </button>
    <RouterLink
      v-else
      :to="`/workspace/${props.alias}/file/${props.commitId}`"
      class="text-link shrink-0 truncate text-left cursor-pointer"
    >
      Files
    </RouterLink>

    <template v-for="(segment, index) in pathSegments" :key="index">
      <span class="text-gray-400 dark:text-gray-500 shrink-0" aria-hidden="true">/</span>
      <button
        v-if="index < pathSegments.length - 1 && props.onPathChange"
        type="button"
        class="text-link truncate text-left cursor-pointer"
        @click="props.onPathChange(pathSegments.slice(0, index + 1).join('/'))"
      >
        {{ segment }}
      </button>
      <RouterLink
        v-else-if="index < pathSegments.length - 1"
        :to="`/workspace/${props.alias}/file/${props.commitId}/${pathSegments.slice(0, index + 1).join('/')}`"
        class="text-link truncate text-left cursor-pointer"
      >
        {{ segment }}
      </RouterLink>
      <span v-else class="text-gray-800 dark:text-gray-200 font-medium truncate" aria-current="page">
        {{ segment }}
      </span>
    </template>
  </nav>
</template>

<style scoped>
@import '@/assets/text-link.css';
</style>
