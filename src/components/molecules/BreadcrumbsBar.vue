<script setup lang="ts">
import { computed } from 'vue'
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue'
import type { BreadcrumbItem } from '@/types/breadcrumb'

const props = defineProps<{
  items: BreadcrumbItem[]
}>()

// A lone crumb is just the current page, so the bar adds nothing.
const isVisible = computed(() => props.items.length > 1)
</script>

<template>
  <!-- Rendered in the layout under the header so the bar spans the full page width. -->
  <Teleport v-if="isVisible" defer to="#breadcrumbs-bar">
    <div class="bg-muted border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4 py-2">
        <Breadcrumbs :items="items" />
      </div>
    </div>
  </Teleport>
</template>
