<script setup lang="ts">
import ActionButton from '@/components/atoms/ActionButton.vue'
import { PMR2_URL } from '@/constants/global'
import NotificationBar from './NotificationBar.vue'
</script>

<template>
  <NotificationBar>
    <ActionButton
      :href="PMR2_URL"
      variant="secondary"
      class="lg:absolute lg:left-4"
      size="sm"
    >
      Go back to production
    </ActionButton>
    <div class="flex items-center gap-2 ml-auto lg:ml-0">
      <span>You are viewing a preview version.</span>
      <ActionButton
        to="/feature-comparison"
        variant="primary"
        size="sm"
      >
        Feature comparison
      </ActionButton>
    </div>
  </NotificationBar>
</template>
