<script setup lang="ts">
interface Props {
  title: string
  error: string
}

defineProps<Props>()
</script>

<template>
  <div class="error-box">
    <h3 class="font-semibold mb-2 text-error">{{ title }}</h3>
    <p class="text-sm">{{ error }}</p>
  </div>
</template>

<style scoped>
@import "@/assets/error-box.css";
</style>
