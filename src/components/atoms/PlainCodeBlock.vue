<script setup lang="ts">
import { CODE_VIEW_MAX_HEIGHT } from '@/constants/codeLanguage';

defineProps<{
  code: string;
  startWrapped?: boolean;
}>();
</script>

<template>
  <!-- Plain-text code view, used when the code viewer cannot be loaded. -->
  <div
    class="code-block rounded overflow-hidden outline outline-gray-200 dark:outline-gray-700"
    data-language="plaintext"
    :data-wrapped="startWrapped ? 'true' : 'false'"
  >
    <pre
      class="code-block-fallback m-0 p-4 overflow-auto text-sm leading-normal"
      :style="{ maxHeight: CODE_VIEW_MAX_HEIGHT, whiteSpace: startWrapped ? 'pre-wrap' : 'pre' }"
    >{{ code }}</pre>
  </div>
</template>

<style scoped>
.code-block-fallback {
  font-family: "Consolas", "Monaco", "Courier New", monospace;
}
</style>
