<script setup lang="ts">
withDefaults(defineProps<{ class?: string }>(), {
  class: 'w-6 h-6',
})
</script>

<template>
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="$props.class"
  >
    <path d="M14 3h7v7"></path>
    <path d="M10 14L21 3"></path>
    <path d="M21 14v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4"></path>
  </svg>
</template>
