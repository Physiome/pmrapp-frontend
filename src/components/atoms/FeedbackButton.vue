<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BugIcon from '@/components/icons/BugIcon.vue'
import { GITHUB_ISSUES_URL } from '@/constants/global'
import ActionButton from './ActionButton.vue'
import Popover from './Popover.vue'

const route = useRoute()

/**
 * Build the GitHub "new issue" URL with the current page URL
 * prefilled in the issue body.
 */
const newIssueUrl = computed((): string => {
  // Make this computed update on navigation (window.location is not reactive).
  void route.fullPath

  if (typeof window === 'undefined') {
    return `${GITHUB_ISSUES_URL}/new`
  }

  const pageUrl = new URL(window.location.href)

  // Avoid leaking OAuth and other sensitive query params into a public GitHub issue.
  for (const key of ['code', 'state', 'error', 'error_description', 'access_token']) {
    pageUrl.searchParams.delete(key)
  }

  const params = new URLSearchParams({
    template: 'preview_feedback.yml',
    title: '[Preview Feedback]: ',
    'page-url': pageUrl.toString(),
  })

  return `${GITHUB_ISSUES_URL}/new?${params.toString()}`
})
</script>

<template>
  <div class="fixed bottom-8 right-8 z-40">
    <Popover placement="left" maxWidth="320px">
      <template #trigger>
        <ActionButton
          :href="newIssueUrl"
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
          This website is a work in progress, so you may come across bugs or
          unfinished features. We are working to fix these, but please feel free
          to report any issues you find by clicking this button.
        </p>
        <p>
          Before reporting a bug, you may want to check the
          <RouterLink
            to="/feature-comparison"
            class="text-primary underline underline-offset-2 hover:opacity-80"
          >feature-comparison</RouterLink> page, as some features may already be
          listed there.
        </p>
      </template>
    </Popover>
  </div>
</template>

<style scoped>
@import '@/assets/button.css';
</style>
