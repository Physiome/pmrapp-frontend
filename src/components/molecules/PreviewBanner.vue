<script setup lang="ts">
import ActionButton from '@/components/atoms/ActionButton.vue'
import NotificationBar from './NotificationBar.vue'
</script>

<template>
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
</template>
