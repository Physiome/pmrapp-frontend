<script setup lang="ts">
import { computed } from 'vue'
import { getPathSegments } from '@/utils/path'
import { getWorkspacePathLink } from '@/utils/workspace'

// Pass onPathChange to browse folders in place (e.g. inside an exposure),
// or alias and commitId to link to the workspace folder pages.
const props = defineProps<{
  path: string
  alias?: string
  commitId?: string
  onPathChange?: (path: string | undefined) => void
}>()

const pathSegments = computed(() => getPathSegments(props.path))

const linkTo = (path: string) => getWorkspacePathLink(props.alias ?? '', props.commitId ?? '', path)
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
    <RouterLink v-else :to="linkTo('')" class="text-link shrink-0 truncate text-left cursor-pointer">
      Files
    </RouterLink>

    <template v-for="(segment, index) in pathSegments" :key="index">
      <span class="text-gray-400 dark:text-gray-500 shrink-0" aria-hidden="true">/</span>
      <span
        v-if="index === pathSegments.length - 1"
        class="text-gray-800 dark:text-gray-200 font-medium truncate"
        aria-current="page"
      >
        {{ segment.name }}
      </span>
      <button
        v-else-if="props.onPathChange"
        type="button"
        class="text-link truncate text-left cursor-pointer"
        @click="props.onPathChange(segment.path)"
      >
        {{ segment.name }}
      </button>
      <RouterLink
        v-else
        :to="linkTo(segment.path)"
        class="text-link truncate text-left cursor-pointer"
      >
        {{ segment.name }}
      </RouterLink>
    </template>
  </nav>
</template>

<style scoped>
@import '@/assets/text-link.css';
</style>
