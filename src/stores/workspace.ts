import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getWorkspaceService } from '@/services';
import type { Workspace, WorkspaceInfo } from '@/types/workspace';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([]);
  const workspaceInfoCache = ref<Map<string, WorkspaceInfo>>(new Map());
  const lastFetchTime = ref<number | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const fetchWorkspacesInFlight = ref<Promise<void> | null>(null);

  const isCacheValid = (): boolean => {
    if (!lastFetchTime.value) return false;
    const now = Date.now();
    return now - lastFetchTime.value < CACHE_TTL;
  };

  const fetchWorkspaces = async (forceRefresh = false): Promise<void> => {
    if (fetchWorkspacesInFlight.value) {
      return fetchWorkspacesInFlight.value;
    }

    // Use cache if valid and not forcing refresh.
    if (!forceRefresh && isCacheValid() && workspaces.value.length > 0) {
      return;
    }

    const fetchPromise = (async () => {
      isLoading.value = true;
      error.value = null;

      try {
        const data = await getWorkspaceService().listAliasedWorkspaces();

        workspaces.value = data;
        lastFetchTime.value = Date.now();
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load workspaces';
        console.error('Error loading workspaces:', err);
      } finally {
        isLoading.value = false;
        fetchWorkspacesInFlight.value = null;
      }
    })();

    fetchWorkspacesInFlight.value = fetchPromise;
    return fetchPromise;
  };

  const getWorkspaceInfo = async (
    alias: string,
    commitId: string,
    path: string,
  ): Promise<WorkspaceInfo> => {
    // Check cache first.
    const cacheId = `${alias}:${commitId}:${path}`;
    const cached = workspaceInfoCache.value.get(cacheId);

    if (cached) {
      return cached;
    }

    try {
      const info = await getWorkspaceService().getWorkspaceInfo(alias, commitId, path);
      workspaceInfoCache.value.set(cacheId, info);
      return info;
    } catch (err) {
      console.error(`Error loading workspace info for ${cacheId}:`, err);
      throw err;
    }
  };

  const clearCache = (): void => {
    workspaces.value = [];
    workspaceInfoCache.value.clear();
    lastFetchTime.value = null;
    error.value = null;
    fetchWorkspacesInFlight.value = null;
  };

  return {
    workspaces,
    isLoading,
    error,
    lastFetchTime,
    fetchWorkspaces,
    getWorkspaceInfo,
    clearCache,
  };
});
