<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import CloseButton from '@/components/atoms/CloseButton.vue'
import { COOKIE } from '@/constants/global'
import { Cookie } from '@/utils/cookie'

const isVisible = ref(true)

const updateNotificationBarHeight = () => {
  const height = isVisible.value ? '47px' : '0'
  document.documentElement.style.setProperty('--notification-bar-height', height)
}

const handleClose = async () => {
  isVisible.value = false
  await Cookie.set(COOKIE.NOTIFICATION_NAME, 'true', COOKIE.NOTIFICATION_DAYS)
}

onMounted(async () => {
  const dismissed = await Cookie.get(COOKIE.NOTIFICATION_NAME)
  if (dismissed === 'true') {
    isVisible.value = false
  }
  updateNotificationBarHeight()
})

watch(isVisible, () => {
  updateNotificationBarHeight()
})
</script>

<template>
  <div
    v-if="isVisible"
    class="bg-amber-100 dark:bg-amber-900/20 border-b border-amber-300 dark:border-amber-700 relative"
  >
    <div class="container mx-auto px-4 pr-10 lg:pr-4 py-2 flex items-center justify-center gap-2 text-sm">
      <slot />
    </div>
    <CloseButton
      class="absolute top-1/2 right-4 -translate-y-1/2 w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      @click="handleClose"
      aria-label="Close notification"
    />
  </div>
</template>
