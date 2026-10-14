<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="box p-0! overflow-hidden">
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <span>{{ title }}</span>
      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </div>
</template>

<style scoped>
@import '@/assets/box.css';
</style>
