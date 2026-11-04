<script setup lang="ts">
withDefaults(defineProps<{ class?: string }>(), {
  class: 'w-6 h-6',
})
</script>

<template>
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    fill="currentColor"
    :class="$props.class"
  >
    <path d="M6 9L1 4h10z" />
  </svg>
</template>
