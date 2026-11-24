<script setup lang="ts">
import { type Component, onMounted, ref, shallowRef } from 'vue';
import PlainCodeBlock from '@/components/atoms/PlainCodeBlock.vue';
import SkeletonBlock from '@/components/atoms/SkeletonBlock.vue';

const props = defineProps<{
  code: string;
  filename: string;
  startWrapped?: boolean;
}>();

// The code viewer is loaded on demand so that Monaco is not part of the main bundle.
const codeBlock = shallowRef<Component | null>(null);
const loadFailed = ref(false);

onMounted(async () => {
  try {
    codeBlock.value = (await import('@/components/atoms/CodeBlock.vue')).default;
  } catch (err) {
    // For example, the chunk no longer exists after a new deployment, or the network is down.
    console.error('Error loading the code viewer:', err);
    loadFailed.value = true;
  }
});
</script>

<template>
  <PlainCodeBlock v-if="loadFailed" :code="props.code" :start-wrapped="props.startWrapped" />
  <component :is="codeBlock" v-else-if="codeBlock" v-bind="props" />
  <!-- Show loading while the code viewer loads. -->
  <div v-else class="rounded overflow-hidden outline outline-gray-200 dark:outline-gray-700">
    <SkeletonBlock class="p-4" />
  </div>
</template>
