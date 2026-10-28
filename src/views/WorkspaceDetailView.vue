<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import WorkspaceDetail from '@/components/organisms/WorkspaceDetail.vue'
import WorkspaceFileDetail from '@/components/organisms/WorkspaceFileDetail.vue'
import { useWorkspaceStore } from '@/stores/workspace'
import type { WorkspaceInfo } from '@/types/workspace'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const alias = computed(() => route.params.alias as string)
const commitId = computed(() => (route.params.commitId as string) || '')
const path = computed(() => (route.params.path as string) || '')
const workspaceInfo = ref<WorkspaceInfo | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(true)
const isWorkspaceFile = ref(false)
const requestCounter = ref(0)

const loadWorkspaceInfo = async () => {
  isLoading.value = true
  error.value = null

  const currentRequest = ++requestCounter.value

  try {
    const aliasValue = alias.value
    const commitIdValue = commitId.value || ''
    const pathValue = path.value || ''
    const workspaceData = await workspaceStore.getWorkspaceInfo(
      aliasValue,
      commitIdValue,
      pathValue,
    )

    if (currentRequest === requestCounter.value) {
      workspaceInfo.value = workspaceData
      if (workspaceInfo.value?.target?.TreeInfo) {
        isWorkspaceFile.value = false
      } else {
        isWorkspaceFile.value = true
      }
    }
  } catch (err) {
    if (currentRequest === requestCounter.value) {
      error.value = err instanceof Error ? err.message : 'Failed to load workspace.'
      console.error('Error loading workspace:', err)
    }
  } finally {
    if (currentRequest === requestCounter.value) {
      isLoading.value = false
    }
  }
}

onMounted(loadWorkspaceInfo)

// Watch for changes in props to reload data.
watch(() => [alias.value, commitId.value, path.value], loadWorkspaceInfo)
</script>

<template>
  <!--
    `isWorkspaceFile` lags behind the route until the new info loads, so check the `path` too:
    a route without a `path` is always the workspace root (e.g. going back from a file).
  -->
  <WorkspaceFileDetail
    v-if="isWorkspaceFile && path"
    :alias="alias"
    :commit-id="commitId"
    :path="path"
  />
  <WorkspaceDetail v-else :alias="alias" :commit-id="commitId" :path="path" />
</template>
