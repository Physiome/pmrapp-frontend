<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ExposureDetail from '@/components/organisms/ExposureDetail.vue'

const route = useRoute()
const alias = computed(() => route.params.alias as string)
// The :file(.+) route param greedily captures a trailing slash, so strip it here.
const file = computed(() => ((route.params.file as string) || '').replace(/\/+$/, ''))
const view = computed(() => (route.params.view as string) || '')
</script>

<template>
  <ExposureDetail :alias="alias" :file="file" :view="view" />
</template>
