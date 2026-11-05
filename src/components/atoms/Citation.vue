<script setup lang="ts">
defineProps<{
  content: string;
}>();
</script>

<template>
  <div
    class="group p-4 text-sm bg-gray-50 dark:bg-gray-900 rounded-md break-words relative"
    v-html="content"
  ></div>
</template>

<style scoped>
@import "@/assets/text-link.css";

:deep(a) {
  @apply text-link dark:underline dark:decoration-dotted hover:text-link-hover transition;
}
</style>
