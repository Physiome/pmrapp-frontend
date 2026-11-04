<script setup lang="ts">
import { computed, ref } from 'vue'
import Tooltip from '@/components/atoms/Tooltip.vue'
import WrapIcon from '@/components/icons/WrapIcon.vue'

const props = defineProps<{
  title?: string
  active?: boolean
  disabled?: boolean
}>()

const buttonRef = ref<HTMLElement | null>(null)
const isHovered = ref(false)

const buttonClasses = computed(() => [
  'relative p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all',
  'text-gray-700 dark:text-gray-300 hover:enabled:bg-gray-100 dark:hover:enabled:bg-gray-700',
  { 'bg-gray-100 dark:bg-gray-700': props.active },
])

const buttonTitle = computed(() => {
  if (props.title) return props.title
  return props.active ? 'Unwrap words' : 'Wrap words'
})
</script>

<template>
  <button
    type="button"
    ref="buttonRef"
    :disabled="props.disabled"
    :class="buttonClasses"
    :aria-label="buttonTitle"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focus="isHovered = true"
    @blur="isHovered = false"
  >
    <WrapIcon class="w-4 h-4" />
    <Tooltip :visible="isHovered && !props.disabled" :anchor-el="buttonRef">{{
      buttonTitle
    }}</Tooltip>
  </button>
</template>
