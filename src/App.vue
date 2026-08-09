<script setup lang="ts">
import BackToTop from '@/components/atoms/BackToTop.vue'
import BetaRibbon from '@/components/atoms/BetaRibbon.vue'
import CookieBanner from '@/components/molecules/CookieBanner.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import NotificationBar from './components/molecules/NotificationBar.vue';
import ActionButton from '@/components/atoms/ActionButton.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <NotificationBar>
      You are viewing a preview version of PMR.
      <ActionButton
        href="#"
        variant="secondary"
        size="sm"
      >
        View classic site
      </ActionButton>
      <ActionButton
        to="/feature-comparison"
        variant="primary"
        size="sm"
      >
        Compare features
      </ActionButton>
    </NotificationBar>
    <DefaultLayout>
      <RouterView />
    </DefaultLayout>
    <BackToTop />
  </div>
  <CookieBanner />
  <BetaRibbon />
</template>
