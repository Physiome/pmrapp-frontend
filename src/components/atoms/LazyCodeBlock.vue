<script setup lang="ts">
import { type Component, onMounted, ref, shallowRef } from 'vue';
import PlainCodeBlock from '@/components/atoms/PlainCodeBlock.vue';

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
</template>
