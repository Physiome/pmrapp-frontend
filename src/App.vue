<script setup lang="ts">
import BackToTop from '@/components/atoms/BackToTop.vue'
import BetaRibbon from '@/components/atoms/BetaRibbon.vue'
import CookieBanner from '@/components/molecules/CookieBanner.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <DefaultLayout>
      <RouterView />
    </DefaultLayout>
    <BackToTop />
  </div>
  <CookieBanner>
    <div class="text-xl mb-2">This website uses cookies to ensure that you get the best experience.</div>
    We use cookies, including Google Analytics, to improve your experience and understand how visitors use our site. By clicking Accept or closing
    this banner, you consent to our use of cookies.
  </CookieBanner>
  <BetaRibbon />
</template>
