<script setup lang="ts">
import ActionButton from '@/components/atoms/ActionButton.vue'
import { PMR2_URL } from '@/constants/global'
import NotificationBar from './NotificationBar.vue'
</script>

<template>
  <NotificationBar>
    You are viewing a preview version.
    <ActionButton
      :href="PMR2_URL"
      variant="secondary"
      size="sm"
    >
      Go back to production
    </ActionButton>
    <ActionButton
      to="/feature-comparison"
      variant="primary"
      class="ml-auto"
      size="sm"
    >
      Feature comparison
    </ActionButton>
  </NotificationBar>
</template>
