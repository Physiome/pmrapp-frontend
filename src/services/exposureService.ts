import type { Exposure, ExposureFileInfo, ExposureInfo } from '@/types/exposure';
import { resolveHtmlPaths } from '@/utils/path';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const exposureService = {
  async listAliasedExposures(): Promise<Exposure[]> {
    const response = await fetch(`${API_BASE_URL}/api/list_aliased_exposures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const payload = await response.json();
    return payload.inner;
  },

  async getExposureInfo(alias: string): Promise<ExposureInfo> {
    const response = await fetch(`${API_BASE_URL}/api/get_exposure_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: { Aliased: alias },
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();

      // Check for not found error.
      if (response.status === 404 || responseText.includes('NotFound')) {
        throw new Error('Exposure not found');
      }

      throw new Error(`Request failed: ${response.status}`);
    }

    const payload = await response.json();
    return payload.inner;
  },

  async getExposureFileInfo(id: string, path: string): Promise<ExposureFileInfo> {
    const response = await fetch(`${API_BASE_URL}/api/resolve_exposure_path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: {
          Aliased: id,
        },
        path,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const payload = await response.json();
    return payload.inner;
  },

  async getExposureSafeHTML(
    exposureId: number,
    exposureFileId: number,
    viewKey: string,
    path: string,
    routePath: string,
  ): Promise<string> {
    const apiURL = `${API_BASE_URL}/api/exposure/safe_html/${exposureId}/${exposureFileId}/${viewKey}/${path}`;
    const response = await fetch(apiURL);

    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status}`);
    }

    const responseText = await response.text();
    return resolveHtmlPaths(responseText, API_BASE_URL, routePath);
  },

  async getExposureRawContent(
    exposureId: number,
    exposureFileId: number,
    viewKey: string,
    path: string,
  ): Promise<string> {
    const apiURL = `${API_BASE_URL}/api/exposure/${exposureId}/${exposureFileId}/${viewKey}/${path}`;
    const response = await fetch(apiURL);

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`);
    }

    return await response.text();
  },
};
