<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import ActionButton from '@/components/atoms/ActionButton.vue'

interface Props {
  show: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm',
  message: 'Are you sure?',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('cancel')
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.removeEventListener('keydown', handleKeyDown)
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
    class="fixed inset-0 bg-gray-800/75 dark:bg-gray-900/85 z-50 flex justify-center items-center text-left"
    @click.self="emit('cancel')"
  >
    <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">{{ message }}</p>
      <div class="flex justify-end gap-2">
        <ActionButton variant="secondary" @click="emit('cancel')" content-section="Confirm dialog">
          {{ cancelLabel }}
        </ActionButton>
        <ActionButton variant="primary" @click="emit('confirm')" content-section="Confirm dialog">
          {{ confirmLabel }}
        </ActionButton>
      </div>
    </div>
  </div>
</template>
