<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import CloseButton from '@/components/atoms/CloseButton.vue'
import { COOKIE } from '@/constants/global'
import { Cookie } from '@/utils/cookie'

const isVisible = ref(true)
const notificationBarEl = ref<HTMLElement | null>(null)
const notificationContainerEl = ref<HTMLElement | null>(null)

const updateNotificationBarHeight = () => {
  const height = isVisible.value ? '46px' : '0'
  document.documentElement.style.setProperty('--notification-bar-height', height)
}

const handleClose = async () => {
  isVisible.value = false
  await Cookie.set(COOKIE.NOTIFICATION_NAME, 'true', COOKIE.NOTIFICATION_DAYS)
}

const handleResize = () => {
  if (!notificationBarEl.value || !notificationContainerEl.value) return

  const CLOSE_BUTTON_WIDTH = 24 // w-6 in Tailwind.
  const CLOSE_BUTTON_RIGHT_OFFSET = 16 // right-4 in Tailwind.
  const GAP = 8 // gap-2 in Tailwind.

  const REQUIRED_PADDING = CLOSE_BUTTON_WIDTH + CLOSE_BUTTON_RIGHT_OFFSET + GAP

  const notificationBarWidth = notificationBarEl.value.offsetWidth - REQUIRED_PADDING
  const containerWidth = notificationContainerEl.value.offsetWidth

  if (containerWidth >= notificationBarWidth) {
    notificationContainerEl.value.style.paddingRight = `${REQUIRED_PADDING}px`
  } else {
    // Remove inline style to restore default CSS class padding.
    notificationContainerEl.value.style.paddingRight = ''
  }
}

watch(isVisible, () => {
  updateNotificationBarHeight()
})

onMounted(async () => {
  const dismissed = await Cookie.get(COOKIE.NOTIFICATION_NAME)
  if (dismissed === 'true') {
    isVisible.value = false
  }
  updateNotificationBarHeight()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div
    v-if="isVisible"
    ref="notificationBarEl"
    class="bg-amber-100 dark:bg-amber-900/20 relative"
  >
    <div
      ref="notificationContainerEl"
      class="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm">
      <slot />
    </div>
    <CloseButton
      class="absolute top-1/2 right-4 -translate-y-1/2 w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      @click="handleClose"
      aria-label="Close notification"
    />
  </div>
</template>
