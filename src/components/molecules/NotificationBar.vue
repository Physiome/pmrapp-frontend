<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CloseButton from '@/components/atoms/CloseButton.vue'
import { Cookie } from '@/utils/cookie'
import { COOKIE } from '@/constants/global'

const isVisible = ref(true)

const handleClose = async () => {
  isVisible.value = false
  await Cookie.set(COOKIE.NOTIFICATION_NAME, 'true', COOKIE.NOTIFICATION_DAYS)
}

onMounted(async () => {
  const dismissed = await Cookie.get(COOKIE.NOTIFICATION_NAME)
  if (dismissed === 'true') {
    isVisible.value = false
  }
})
</script>

<template>
  <div
    v-if="isVisible"
    class="bg-amber-100 dark:bg-amber-900/20 border-b border-amber-300 dark:border-amber-700 relative"
  >
    <div class="container mx-auto px-4 pr-10 lg:pr-4 py-2 flex items-center justify-center gap-2 text-sm text-amber-900 dark:text-amber-100">
      <span>⚠️</span>
      <span>
        This is a general notification message.
      </span>
    </div>
    <CloseButton
      class="absolute top-1/2 right-4 -translate-y-1/2"
      @click="handleClose"
      aria-label="Close notification"
    />
  </div>
</template>
