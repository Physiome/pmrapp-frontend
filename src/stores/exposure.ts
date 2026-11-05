import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getExposureService } from '@/services';
import type { Exposure, ExposureFileInfo, ExposureInfo } from '@/types/exposure';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export const useExposureStore = defineStore('exposure', () => {
  const exposures = ref<Exposure[]>([]);
  const exposureInfoCache = ref<Map<string, ExposureInfo>>(new Map());
  const exposureFileInfoCache = ref<Map<string, ExposureFileInfo>>(new Map());
  const exposureHTMLCache = ref<Map<string, string>>(new Map());
  const lastFetchTime = ref<number | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const fetchExposuresInFlight = ref<Promise<void> | null>(null);

  const isCacheValid = (): boolean => {
    if (!lastFetchTime.value) return false;
    const now = Date.now();
    return now - lastFetchTime.value < CACHE_TTL;
  };

  const fetchExposures = async (forceRefresh = false): Promise<void> => {
    if (fetchExposuresInFlight.value) {
      return fetchExposuresInFlight.value;
    }

    // Use cache if valid and not forcing refresh.
    if (!forceRefresh && isCacheValid() && exposures.value.length > 0) {
      return;
    }

    const fetchPromise = (async () => {
      isLoading.value = true;
      error.value = null;

      try {
        const data = await getExposureService().listAliasedExposures();

        exposures.value = data;
        lastFetchTime.value = Date.now();
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load exposures';
        console.error('Error loading exposures:', err);
      } finally {
        isLoading.value = false;
        fetchExposuresInFlight.value = null;
      }
    })();

    fetchExposuresInFlight.value = fetchPromise;
    return fetchPromise;
  };

  const getExposureInfo = async (alias: string): Promise<ExposureInfo> => {
    // Check cache first.
    const cached = exposureInfoCache.value.get(alias);
    if (cached) {
      return cached;
    }

    try {
      const info = await getExposureService().getExposureInfo(alias);
      exposureInfoCache.value.set(alias, info);
      return info;
    } catch (err) {
      console.error(`Error loading exposure info for ${alias}:`, err);
      throw err;
    }
  };

  const getExposureFileInfo = async (alias: string, file: string): Promise<ExposureFileInfo> => {
    const cacheKey = `${alias}:${file}`;

    // Check cache first.
    const cached = exposureFileInfoCache.value.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const info = await getExposureService().getExposureFileInfo(alias, file);
      exposureFileInfoCache.value.set(cacheKey, info);
      return info;
    } catch (err) {
      console.error(`Error loading exposure file info for ${alias}/${file}:`, err);
      throw err;
    }
  };

  const getExposureSafeHTML = async (
    exposureId: number,
    exposureFileId: number,
    viewKey: string,
    path: string,
    routePath: string,
  ): Promise<string> => {
    const cacheKey = `${exposureId}:${exposureFileId}:${viewKey}:${path}:${routePath}`;

    // Check cache first.
    const cached = exposureHTMLCache.value.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const html = await getExposureService().getExposureSafeHTML(
        exposureId,
        exposureFileId,
        viewKey,
        path,
        routePath,
      );
      exposureHTMLCache.value.set(cacheKey, html);
      return html;
    } catch (err) {
      console.error(`Error loading safe HTML for exposure ${exposureId}:`, err);
      throw err;
    }
  };

  const getExposureRawContent = async (
    exposureId: number,
    exposureFileId: number,
    viewKey: string,
    path: string,
  ): Promise<string> => {
    const cacheKey = `${exposureId}:${exposureFileId}:${viewKey}:${path}:raw`;

    // Check cache first.
    const cached = exposureHTMLCache.value.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const content = await getExposureService().getExposureRawContent(
        exposureId,
        exposureFileId,
        viewKey,
        path,
      );
      exposureHTMLCache.value.set(cacheKey, content);
      return content;
    } catch (err) {
      console.error(`Error loading raw content for exposure ${exposureId}:`, err);
      throw err;
    }
  };

  const clearCache = (): void => {
    exposures.value = [];
    exposureInfoCache.value.clear();
    exposureFileInfoCache.value.clear();
    exposureHTMLCache.value.clear();
    lastFetchTime.value = null;
    error.value = null;
    fetchExposuresInFlight.value = null;
  };

  return {
    exposures,
    isLoading,
    error,
    lastFetchTime,
    fetchExposures,
    getExposureInfo,
    getExposureFileInfo,
    getExposureSafeHTML,
    getExposureRawContent,
    clearCache,
  };
});
