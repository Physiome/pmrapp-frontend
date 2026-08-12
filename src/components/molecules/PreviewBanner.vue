<script setup lang="ts">
import ActionButton from '@/components/atoms/ActionButton.vue'
import ArrowRightIcon from '@/components/icons/ArrowRightIcon.vue'
import NotificationBar from '@/components/molecules/NotificationBar.vue'
import { PMR2_URL } from '@/constants/global'
</script>

<template>
  <NotificationBar>
    <ActionButton
      :href="PMR2_URL"
      variant="secondary"
      class="lg:absolute lg:left-4"
      size="sm"
    >
      <span class="hidden md:block">Go back to production</span>
      <span class="md:hidden flex items-center gap-1">
        <ArrowRightIcon class="w-4 h-4 -ml-1 transform rotate-180" aria-hidden="true" focusable="false" />
        Production
      </span>
    </ActionButton>
    <div class="flex items-center gap-2 ml-auto lg:ml-0">
      <span class="hidden md:block">You are viewing a preview version.</span>
      <span class="md:hidden">You are on preview.</span>
      <ActionButton
        to="/feature-comparison"
        variant="primary"
        size="sm"
      >
        <span class="hidden md:block">Feature comparison</span>
        <span class="md:hidden flex items-center gap-1">
          Features
          <ArrowRightIcon class="w-4 h-4 -mr-1" aria-hidden="true" focusable="false" />
        </span>
      </ActionButton>
    </div>
  </NotificationBar>
</template>
