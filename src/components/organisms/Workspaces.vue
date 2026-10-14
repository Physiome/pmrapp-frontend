<script setup lang="ts">
import { onMounted } from 'vue'
import List from '@/components/molecules/List.vue'
import { useWorkspaceStore } from '@/stores/workspace'
import type { Workspace } from '@/types/workspace'

const emit = defineEmits<{
  updateFilteredCount: [filteredCount: number, totalCount: number, hasFilter: boolean]
}>()

const workspaceStore = useWorkspaceStore()

const handleRefresh = async () => {
  await workspaceStore.fetchWorkspaces(true)
}

const getTitle = (workspace: Workspace) => {
  return workspace.entity.description || workspace.alias
}

onMounted(async () => {
  await workspaceStore.fetchWorkspaces()
})
</script>

<template>
  <List
    :items="workspaceStore.workspaces"
    :is-loading="workspaceStore.isLoading"
    :error="workspaceStore.error"
    content-section="Workspace Listing"
    error-title="Error loading workspaces"
    empty-message="No workspaces found."
    route-base="/workspace"
    :get-title="getTitle"
    @refresh="handleRefresh"
    @update-filtered-count="(...args) => emit('updateFilteredCount', ...args)"
  />
</template>
