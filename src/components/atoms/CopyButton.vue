<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import Tooltip from '@/components/atoms/Tooltip.vue'
import CopyIcon from '@/components/icons/CopyIcon.vue'

const props = defineProps<{
  text: string
  title?: string
  withHTML?: boolean
  disabled?: boolean
}>()

const isCopied = ref(false)
const isHovered = ref(false)
const buttonRef = ref<HTMLElement | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const buttonClasses = [
  'relative p-2 rounded transition-colors',
  'text-gray-700 dark:text-gray-300 ',
  'hover:enabled:bg-gray-100 dark:hover:enabled:bg-gray-700',
  'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
]

const handleCopy = async () => {
  if (props.withHTML) {
    await handleCopyHTML()
  } else {
    await handleCopyText()
  }
}

// General use, especially for codesnippets
const handleCopyText = async () => {
  try {
    await navigator.clipboard.writeText(props.text)
    isCopied.value = true

    if (copiedTimer) {
      clearTimeout(copiedTimer)
    }

    copiedTimer = setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// mainly used for citations with clickable URL
const handleCopyHTML = async () => {
  try {
    const htmlContent = props.text.replaceAll('\n', '<br>')
    const tempElement = document.createElement('div')
    tempElement.innerHTML = props.text
    const plainTextContent = tempElement.textContent ?? ''

    const htmlBlob = new Blob([htmlContent], { type: 'text/html' })
    const textBlob = new Blob([plainTextContent], { type: 'text/plain' })

    const clipboardItem = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob,
    })

    await navigator.clipboard.write([clipboardItem])
    isCopied.value = true

    if (copiedTimer) {
      clearTimeout(copiedTimer)
    }

    copiedTimer = setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Error when trying to use navigator.clipboard.write()', err)
  }
}

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
})
</script>

<template>
  <button
    ref="buttonRef"
    :disabled="props.disabled"
    @click="handleCopy"
    :class="buttonClasses"
    :aria-label="isCopied ? 'Copied!' : (title || 'Copy')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focus="isHovered = true"
    @blur="isHovered = false"
  >
    <CopyIcon class="w-4 h-4" />
    <Tooltip
      :visible="(isHovered || isCopied) && !props.disabled"
      :anchor-el="buttonRef"
    >
      {{ isCopied ? 'Copied!' : (title || 'Copy') }}
    </Tooltip>
  </button>
</template>
