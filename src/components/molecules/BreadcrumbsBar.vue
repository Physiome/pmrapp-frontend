<script setup lang="ts">
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue'
import type { BreadcrumbItem } from '@/types/breadcrumb'

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <!-- Rendered in the layout under the header so the bar spans the full page width. -->
  <Teleport defer to="#breadcrumbs-bar">
    <div class="bg-muted border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4 py-2">
        <Breadcrumbs :items="items" />
      </div>
    </div>
  </Teleport>
</template>
