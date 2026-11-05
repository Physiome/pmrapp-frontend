<script setup lang="ts">
withDefaults(defineProps<{ class?: string }>(), {
  class: 'w-6 h-6',
});
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
</template>
