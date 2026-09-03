<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  link: string
}>()
</script>

<template>
  <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 last:mb-0 last:pb-0 last:border-b-0">
    <RouterLink v-if="link" :to="link">
      <h3 class="inline-block text-lg font-semibold text-link">
        <slot name="title">{{ title }}</slot>
      </h3>
    </RouterLink>
    <h3 v-else class="inline-block text-lg font-semibold">
      <slot name="title">{{ title }}</slot>
    </h3>
    <p v-if="subtitle" class="text-sm">
      {{ subtitle }}
    </p>
    <slot />
  </div>
</template>

<style scoped>
@import '@/assets/text-link.css';
</style>
