<script setup lang="ts">
interface Props {
  title: string
  message: string
}

defineProps<Props>()
</script>

<template>
  <div class="warning-box">
    <h3 class="font-semibold mb-2">{{ title }}</h3>
    <p class="text-sm">{{ message }}</p>
    <div v-if="$slots.default" class="mt-4 flex flex-wrap gap-2">
      <slot />
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/warning-box.css';
</style>
