<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'small' | 'default'
}>(), { size: 'default' })

const keycapCLasses = [
  'inline-flex items-center justify-center',
  'px-1.5 py-0.5',
  'font-semibold',
  'rounded border border-gray-300 dark:border-gray-600',
  'text-gray-700 dark:text-gray-200',
  'bg-gray-100 dark:bg-gray-800',
  props.size === 'small' ? 'text-xs h-5' : 'text-sm',
]
</script>

<template>
  <kbd :class="keycapCLasses">
    <slot />
  </kbd>
</template>
