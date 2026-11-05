<script setup lang="ts">
interface Props {
  message?: string;
}

withDefaults(defineProps<Props>(), {
  message: 'Loading...',
});
</script>

<template>
  <div class="text-center box">
    {{ message }}
  </div>
</template>

<style scoped>
@import "@/assets/box.css";
</style>
