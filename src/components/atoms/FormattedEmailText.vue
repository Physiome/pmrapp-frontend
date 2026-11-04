<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
}>()

type Segment = {
  value: string
  email: string
  isLinked: boolean
}

const segments = computed<Segment[]>(() => {
  const input = props.text || ''
  if (!input) return []

  const trimmedInput = input.trim()
  const validEmailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  const wrappedEmailRegex =
    /^(.*?)\s*(?:<\s*([^<>@\s]+@[^<>\s]+)\s*>|\(\s*([^()@\s]+@[^()\s]+)\s*\))$/

  // Handles both: "Author Name <author@email.com>" and "Author Name (author@email.com)".
  const wrappedEmailMatch = trimmedInput.match(wrappedEmailRegex)
  if (wrappedEmailMatch) {
    const authorName = wrappedEmailMatch[1].trim()
    const email = (wrappedEmailMatch[2] || wrappedEmailMatch[3] || '').trim()

    if (validEmailRegex.test(email)) {
      return [
        {
          value: authorName || email,
          email,
          isLinked: true,
        },
      ]
    }

    // For invalid bracketed emails (e.g. user@localhost), keep only the name.
    return [
      {
        value: authorName || input,
        email: '',
        isLinked: false,
      },
    ]
  }

  // Fallback: the entire input is a plain email address.
  if (validEmailRegex.test(trimmedInput)) {
    return [
      {
        value: trimmedInput,
        email: trimmedInput,
        isLinked: true,
      },
    ]
  }

  return [
    {
      value: input,
      email: '',
      isLinked: false,
    },
  ]
})
</script>

<template>
  <span>
    <template v-for="(segment, index) in segments" :key="`${index}-${segment.value}`">
      <a v-if="segment.isLinked" :href="`mailto:${segment.email}`" class="text-link">
        {{ segment.value }}
      </a>
      <span v-else>{{ segment.value }}</span>
    </template>
  </span>
</template>

<style scoped>
@import "@/assets/text-link.css";
</style>
