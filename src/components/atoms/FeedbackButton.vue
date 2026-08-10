<script setup lang="ts">
import BugIcon from '@/components/icons/BugIcon.vue'
import { GITHUB_ISSUES_URL } from '@/constants/global'
import ActionButton from './ActionButton.vue'

/**
 * Build the GitHub "new issue" URL with the current page URL
 * prefilled in the issue body.
 */
const newIssueUrl = (): string => {
  const currentUrl = window.location.href
  const body = `**Page:** ${currentUrl}\n\n`
  return `${GITHUB_ISSUES_URL}/new?title=&body=${encodeURIComponent(body)}`
}
</script>

<template>
  <ActionButton
    :href="newIssueUrl()"
    target="_blank"
    rel="noopener noreferrer"
    variant="icon"
    class="fixed bottom-8 right-8 button-rounded-full z-40"
    aria-label="Report a bug or give feedback"
  >
    <BugIcon class="w-6 h-6" />
  </ActionButton>
</template>

<style scoped>
@import '@/assets/button.css';
</style>
