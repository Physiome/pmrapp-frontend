<script setup lang="ts">
import Keycap from '@/components/atoms/Keycap.vue';
import { formatSearchKey } from '@/utils/format';

withDefaults(defineProps<{ query: string; suffix?: string }>(), { suffix: '' });
</script>

<template>
  Press <Keycap>Enter</Keycap> to search for
  <span v-html="formatSearchKey(query)"></span>
  anywhere in the repository{{ suffix }}.
</template>
