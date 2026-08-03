<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  term: string
  active?: boolean
}

const props = defineProps<Props>()

const buttonBaseClass = [
  'px-2 md:px-3',
  'py-1 md:py-1.5',
  'rounded-md',
  'text-xs md:text-sm',
  'transition-colors',
  'relative',
  'focus:outline-none',
  'transition duration-200 ease-linear',
].join(' ')

const buttonActiveClass = [
  'text-white hover:text-gray-600 dark:hover:text-gray-300',
  'bg-gray-400 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700',
  'cursor-pointer',
].join(' ')

const buttonInactiveClass = [
  'text-gray-600 dark:text-gray-300',
  'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700',
  'cursor-pointer',
].join(' ')

const buttonClass = computed(
  () => `${buttonBaseClass} ${props.active ? buttonActiveClass : buttonInactiveClass}`,
)

const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  emit('click')
}
</script>

<template>
  <button
    :class="buttonClass"
    :aria-label="`Search for ${term}`"
    @click="handleClick"
  >
    {{ term }}
  </button>
</template>
