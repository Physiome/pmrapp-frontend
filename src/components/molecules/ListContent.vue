<script setup lang="ts" generic="T">
import ErrorBlock from '@/components/molecules/ErrorBlock.vue'

interface Props {
  items: T[]
  error: string | null
  errorTitle: string
  emptyMessage: string
  isLoading?: boolean
}

defineProps<Props>()
</script>

<template>
  <ErrorBlock v-if="error" :title="errorTitle" :error="error" />

  <div v-else-if="isLoading" class="text-center box">Loading...</div>

  <div v-else-if="items.length === 0" class="text-center box">
    {{ emptyMessage }}
  </div>

  <div v-else class="box">
    <slot name="item" />
  </div>
</template>

<style scoped>
@import "@/assets/box.css";
</style>
