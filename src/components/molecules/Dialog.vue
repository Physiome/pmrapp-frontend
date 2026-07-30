<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import CloseButton from '@/components/atoms/CloseButton.vue'

const props = defineProps<{
  show: boolean
  title?: string
  position?: 'center' | 'top'
  isStatic?: boolean
}>()

const emit = defineEmits<(e: 'close') => void>()

const dialogRef = ref<HTMLElement | null>(null)

let isMouseDownOnBackdrop = false

const dialogClasses = [
  'relative flex w-full h-full md:h-auto md:max-h-[calc(100vh-4rem)] md:max-w-4xl flex-col',
  'bg-white dark:bg-gray-800 shadow-lg',
  'rounded-lg overflow-hidden focus-visible:outline-none',
]

const positionClasses = computed(() => {
  return props.position === 'top' ? 'items-start md:pt-8' : 'items-center'
})

const headerClasses = computed(() => {
  if (!props.title) {
    return 'justify-end'
  }

  const withTitle = 'items-center border-b border-gray-200 dark:border-gray-700'
  return props.isStatic ? `justify-center ${withTitle}` : `justify-between ${withTitle}`
})

const handleBackdropMouseDown = (event: MouseEvent) => {
  if (event.button !== 0) return
  isMouseDownOnBackdrop = true
}

const handleBackdropMouseUp = (event: MouseEvent) => {
  if (isMouseDownOnBackdrop && event.target === event.currentTarget && !props.isStatic) {
    emit('close')
  }
  isMouseDownOnBackdrop = false
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !props.isStatic) {
    emit('close')
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        dialogRef.value?.focus()
      })
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      isMouseDownOnBackdrop = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-800/75 dark:bg-gray-900/75 backdrop-blur-sm z-250 flex justify-center"
    :class="positionClasses"
    @mousedown.self="handleBackdropMouseDown"
    @mouseup="handleBackdropMouseUp"
  >
    <div
      ref="dialogRef"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      :aria-label="title || 'Dialog'"
      :class="dialogClasses"
    >
      <div class="flex p-4" :class="headerClasses">
        <h2 v-if="title" class="text-lg font-semibold">{{ title }}</h2>
        <CloseButton @click="emit('close')" v-if="!props.isStatic" />
      </div>
      <div class="min-h-0 flex-1 p-4 overflow-y-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
