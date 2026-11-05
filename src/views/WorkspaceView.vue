<script setup lang="ts">
import { computed, ref } from 'vue';
import PageHeader from '@/components/molecules/PageHeader.vue';
import Workspaces from '@/components/organisms/Workspaces.vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { formatNumber } from '@/utils/format';

const workspaceStore = useWorkspaceStore();
const filteredCount = ref(0);
const totalCount = ref(0);
const hasFilter = ref(false);

const handleFilteredCountUpdate = (filtered: number, total: number, isFiltering: boolean) => {
  filteredCount.value = filtered;
  totalCount.value = total;
  hasFilter.value = isFiltering;
};

const description = computed(() => {
  if (workspaceStore.isLoading) {
    return 'Loading workspaces...';
  }

  if (workspaceStore.error) {
    return 'Unable to load workspaces. Please try refreshing.';
  }

  if (totalCount.value === 0) {
    return 'No workspaces found. Please try refreshing.';
  }

  if (hasFilter.value) {
    if (filteredCount.value === 0) return 'No workspaces found. Try a different keyword.';
    if (filteredCount.value !== totalCount.value)
      return `Showing ${formatNumber(filteredCount.value)} of ${formatNumber(totalCount.value)} workspace${totalCount.value !== 1 ? 's' : ''}.`;
  }

  const count = totalCount.value;
  return `Browse and explore ${count > 1 ? 'all ' : ''}${formatNumber(count)} workspace${count > 1 ? 's' : ''}.`;
});
</script>

<template>
  <PageHeader title="Workspace listing" :description="description" />
  <Workspaces @update-filtered-count="handleFilteredCountUpdate" />
</template>
