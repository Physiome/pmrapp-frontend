<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  description?: string;
  centered?: boolean;
  titleSize?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  titleSize: 'large',
});

const titleFontSize = computed((): string => {
  switch (props.titleSize) {
    case 'small':
      return 'text-2xl';
    case 'medium':
      return 'text-3xl';
    default:
      return 'text-4xl';
  }
});
</script>

<template>
  <div :class="{ 'text-center': centered }">
    <h1 :class="`${titleFontSize} font-bold mb-6`">
      {{ title }}
    </h1>
    <p v-if="description" class="text-lg mb-8">
      {{ description }}
    </p>
  </div>
</template>
