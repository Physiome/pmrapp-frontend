<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>

<template>
  <div class="warning-box">
    <h3 class="font-semibold mb-2">{{ title }}</h3>
    <slot name="content" />
    <div v-if="$slots.footer" class="mt-4 flex flex-wrap gap-4">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/warning-box.css';
</style>
