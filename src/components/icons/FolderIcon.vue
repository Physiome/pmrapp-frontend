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
    fill="currentColor"
    :class="$props.class"
  >
    <path
      d="M3.625 2.25A2.625 2.625 0 001 4.875v14.25A2.625 2.625 0 003.625 21.75h16.75A2.625 2.625 0 0023 19.125V4.875A2.625 2.625 0 0020.375 2.25H12.75A2.625 2.625 0 0010.5 4.875H3.625z"
    />
  </svg>
</template>
