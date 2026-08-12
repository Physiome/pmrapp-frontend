<script setup lang="ts">
import ActionButton from '@/components/atoms/ActionButton.vue'
import { PMR2_URL } from '@/constants/global'
import NotificationBar from '@/components/molecules/NotificationBar.vue'
import ArrowRightIcon from '@/components/icons/ArrowRightIcon.vue'
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
        <ArrowRightIcon class="w-4 h-4 -ml-1 transform rotate-180" />
        Production
      </span>
    </ActionButton>
    <div class="flex items-center gap-2 ml-auto lg:ml-0">
      <span class="hidden md:block">You are viewing a preview version.</span>
      <span class="md:hidden">You're on preview.</span>
      <ActionButton
        to="/feature-comparison"
        variant="primary"
        size="sm"
      >
        <span class="hidden md:block">Feature comparison</span>
        <span class="md:hidden flex items-center gap-1">
          Features
          <ArrowRightIcon class="w-4 h-4 -mr-1" />
        </span>
      </ActionButton>
    </div>
  </NotificationBar>
</template>
