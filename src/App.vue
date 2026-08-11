<script setup lang="ts">
import BackToTop from '@/components/atoms/BackToTop.vue'
import BetaRibbon from '@/components/atoms/BetaRibbon.vue'
import FeedbackButton from '@/components/atoms/FeedbackButton.vue'
import CookieBanner from '@/components/molecules/CookieBanner.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <DefaultLayout>
      <RouterView />
    </DefaultLayout>
    <BackToTop />
    <FeedbackButton />
  </div>
  <CookieBanner />
  <BetaRibbon />
</template>
