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
    <path
      d="M5 7H19M5 12H16C17 12 19 12.5 19 14.5C19 16.5 17.3333 17 16.5 17H12M5 17H9M12 17L14 15M12 17L14 19"
    />
  </svg>
</template>
