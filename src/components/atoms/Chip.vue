<script setup lang="ts">
import { computed } from 'vue'
import CloseButton from '@/components/atoms/CloseButton.vue'

interface Props {
  label: string
  category?: string
  removable?: boolean
  onRemove?: () => void
  onClick?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  removable: false,
})

const fullLabel = computed(() => (props.category ? `${props.category}: ${props.label}` : props.label))

const transitionClasses = 'transition duration-200 ease-linear'

const chipClasses = [
  'inline-flex items-center gap-1 py-1',
  'text-xs',
  'text-gray-700 dark:text-gray-200',
  'rounded-full',
  'bg-gray-200 hover:bg-gray-200/80 dark:bg-gray-700 dark:hover:bg-gray-700/80',
  'group/chip',
  'cursor-default',
  transitionClasses,
].join(' ')

const closeButtonClasses = [
  'w-4 h-4 p-0',
  'rounded-full',
  'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600',
  'focus-visible:ring-2 focus-visible:ring-primary focus:outline-none',
  'cursor-pointer',
  'opacity-50 group-hover/chip:opacity-100',
  transitionClasses,
].join(' ')

const handleRemoveChip = () => {
  if (props.onRemove) {
    props.onRemove()
  }
}

const handleClickChip = () => {
  if (props.onClick) {
    props.onClick()
  }
}
</script>

<template>
  <div
    :class="[chipClasses, removable ? 'pl-2.5 pr-1' : 'px-2.5']"
    @click="handleClickChip"
  >
  <span class="group-hover/chip:opacity-75 whitespace-nowrap" :class="[transitionClasses]">
    <span v-if="category" class="mr-1 text-gray-500 dark:text-gray-400">{{ category }}:</span>
    <span :class="{ 'font-medium': category }">{{ label }}</span>
  </span>
  <span v-if="removable" @click.stop>
    <CloseButton
      :class="closeButtonClasses"
      @click="handleRemoveChip"
      :aria-label="`Remove ${fullLabel}`"
    />
  </span>
  </div>
</template>
