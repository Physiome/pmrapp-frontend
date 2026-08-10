<script setup lang="ts">
import BugIcon from '@/components/icons/BugIcon.vue'
import { GITHUB_ISSUES_URL } from '@/constants/global'
import ActionButton from './ActionButton.vue'
</script>

<template>
  <ActionButton
    :href="GITHUB_ISSUES_URL"
    target="_blank"
    rel="noopener noreferrer"
    variant="icon"
    class="fixed bottom-24 right-8 button-rounded-full z-40"
    aria-label="Report a bug or give feedback"
  >
    <BugIcon class="w-6 h-6" />
  </ActionButton>
</template>

<style scoped>
@import '@/assets/button.css';
</style>
