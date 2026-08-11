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
      size="sm"
    >
      Go back to production
    </ActionButton>
    <div class="ml-auto flex items-center gap-2">
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
