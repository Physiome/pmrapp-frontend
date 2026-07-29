<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CloseButton from '@/components/atoms/CloseButton.vue'
import { Cookie } from '@/utils/cookie'
import { COOKIE } from '@/constants/global'

const isVisible = ref(true)

const buttonClasses = [
  'px-3 py-1 rounded border border-primary bg-primary text-white',
  'hover:opacity-90 transition duration-200 ease-linear text-base',
  'rounded-md disabled:opacity-60 disabled:cursor-not-allowed',
  'inline-flex items-center justify-center gap-2 cursor-pointer',
  'focus:outline-none focus:ring-1 focus:ring-primary'
]

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
        <div class="text-xl font-semibold mb-2">This site uses cookies to improve your experience.</div>
        We use cookies to analyse traffic and understand how the Physiome Model Repository is used.
        By accepting, closing this banner, or continuing to use the site, you consent to the use of cookies.
      </div>
      <button
        type="button"
        :class="buttonClasses"
        @click="dismissCookieBanner"
      >
        Accept
      </button>
    </div>
    <CloseButton
      class="absolute top-4 right-4 w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      aria-label="Close cookie banner"
      @click="dismissCookieBanner"
    />
  </div>
</template>
