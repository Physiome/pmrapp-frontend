<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ActionButton from '@/components/atoms/ActionButton.vue'
import CloseButton from '@/components/atoms/CloseButton.vue'
import { Cookie } from '@/utils/cookie'

const COOKIE_NAME = 'pmr_cookie_banner_dismissed'
const COOKIE_DAYS = 30

const isVisible = ref(true)

const dismissCookieBanner = async () => {
  isVisible.value = false
  await Cookie.set(COOKIE_NAME, 'true', COOKIE_DAYS)
}

onMounted(async () => {
  const dismissed = await Cookie.get(COOKIE_NAME)
  if (dismissed === 'true') {
    isVisible.value = false
  }
})
</script>

<template>
  <div
    v-if="isVisible"
    class="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 shadow-[0_-12px_32px_rgba(15,23,42,0.12)] backdrop-blur dark:border-stone-800 dark:bg-slate-950/95"
  >
    <div class="container mx-auto flex flex-col gap-4 px-4 py-4 pr-10 text-sm text-stone-700 dark:text-stone-200 sm:flex-row sm:items-center sm:justify-between">
      <div class="leading-6">
        <div class="text-xl mb-2">This website uses cookies to ensure that you get the best experience.</div>
        We use cookies, including Google Analytics, to improve your experience and understand how visitors use our site. By clicking Accept or closing
        this banner, you consent to our use of cookies.
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
