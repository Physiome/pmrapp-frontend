<script setup lang="ts">
import BackToTop from '@/components/atoms/BackToTop.vue'
import BetaRibbon from '@/components/atoms/BetaRibbon.vue'
import CookieBanner from '@/components/molecules/CookieBanner.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PreviewBanner from '@/components/molecules/PreviewBanner.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <PreviewBanner />
    <DefaultLayout>
      <RouterView />
    </DefaultLayout>
    <BackToTop />
  </div>
  <CookieBanner />
  <BetaRibbon />
</template>
