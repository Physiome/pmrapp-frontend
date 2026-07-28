<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ActionButton from '@/components/atoms/ActionButton.vue'
import CloseButton from '@/components/atoms/CloseButton.vue'
import { Cookie } from '@/utils/cookie'
import { COOKIE } from '@/constants/global'

const isVisible = ref(true)

const dismissCookieBanner = async () => {
  isVisible.value = false
  await Cookie.set(COOKIE.BANNER_NAME, 'true', COOKIE.BANNER_DAYS)
}

onMounted(async () => {
  const dismissed = await Cookie.get(COOKIE.BANNER_NAME)
  if (dismissed === 'true') {
    isVisible.value = false
  }
})
</script>

<template>
  <div
    v-if="isVisible"
    class="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 shadow-[0_-12px_32px_rgba(15,23,42,0.12)] backdrop-blur dark:border-gray-800 dark:bg-slate-950/95"
  >
    <div class="container mx-auto flex flex-col items-end gap-4 sm:gap-8 px-4 py-8 pt-12 sm:pt-8 text-gray-700 dark:text-gray-200 sm:flex-row sm:items-center sm:justify-between">
      <div class="leading-6">
        <div class="text-xl font-semibold mb-2">We use cookies to ensure you get the best experience.</div>
        This allows us to analyse site traffic and improve your browsing experience.
        By clicking "Accept" or continuing to use this site, you agree to the use of cookies.
      </div>
      <ActionButton variant="primary" type="button" @click="dismissCookieBanner">
        Accept
      </ActionButton>
    </div>
    <CloseButton
      class="absolute top-4 right-4 w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      aria-label="Close cookie banner"
      @click="dismissCookieBanner"
    />
  </div>
</template>
