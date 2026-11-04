<script setup lang="ts">
import ArrowRightIcon from '@/components/icons/ArrowRightIcon.vue'

defineProps<{
  to: string
  title: string
  description: string
}>()
</script>

<template>
  <RouterLink
    :to="to"
    class="box p-8 flex items-center gap-6 hover:shadow-lg transition-shadow group"
  >
    <div class="flex-1">
      <h2 class="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
        {{ title }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400 text-base">
        {{ description }}
      </p>
    </div>
    <div class="flex-shrink-0">
      <ArrowRightIcon
        class="w-6 h-6 text-primary transform group-hover:translate-x-1 transition-transform"
      />
    </div>
  </RouterLink>
</template>

<style scoped>
@import "@/assets/box.css";
</style>
