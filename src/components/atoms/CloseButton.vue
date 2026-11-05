<script setup lang="ts">
withDefaults(defineProps<{ class?: string }>(), {
  class: 'w-6 h-6 hover:opacity-70 transition-opacity',
});
</script>

<template>
  <button
    @click="$emit('click')"
    class="cursor-pointer"
    :class="$props.class"
    aria-label="Close"
    type="button"
  >
    <span aria-hidden="true">✕</span>
  </button>
</template>
