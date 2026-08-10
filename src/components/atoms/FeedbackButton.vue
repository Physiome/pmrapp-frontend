<script setup lang="ts">
import BugIcon from '@/components/icons/BugIcon.vue'
import { GITHUB_ISSUES_URL } from '@/constants/global'
import ActionButton from './ActionButton.vue'
import Popover from './Popover.vue'

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
  <div class="fixed bottom-8 right-8 z-40">
    <Popover placement="left">
      <template #trigger>
        <ActionButton
          :href="newIssueUrl()"
          target="_blank"
          rel="noopener noreferrer"
          variant="icon"
          class="button-rounded-full"
          aria-label="Report a bug or give feedback"
        >
          <BugIcon class="w-6 h-6" />
        </ActionButton>
      </template>
      <template #content>
        <p class="mb-2">
          This website is a work in progress. Some parts have bugs and others have
          outright infestations. We are working to fix these issues but feel free
          to add an issue by clicking this button.
        </p>
        <p>
          Before adding a new bug, you may find some features are listed on the
          <RouterLink
            to="/feature-comparison"
            class="text-primary underline underline-offset-2 hover:opacity-80"
          >feature-comparison</RouterLink> page.
        </p>
      </template>
    </Popover>
  </div>
</template>

<style scoped>
@import '@/assets/button.css';
</style>
