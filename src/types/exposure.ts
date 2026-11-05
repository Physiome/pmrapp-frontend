import type { Citation } from './citation';
import type { WorkspaceEntity } from './workspace';

export interface ViewEntry {
  name: string;
  view_key: string;
}

export interface Metadata {
  model_title?: string;
  model_author?: string;
  model_author_org?: string;
  keywords?: string[][];
  citations?: Citation[];
  citation_title?: string;
  citation_issued?: string;
  citation_id?: string;
  citation_bibliographicCitation?: string;
  citation_authors?: string[][];
}

export interface ExposureFileView {
  id: number;
  exposure_file_id: number;
  view_task_template_id: number;
  exposure_file_view_task_id: number;
  view_key: string;
  updated_ts: number;
}

export interface ExposureFileTarget {
  id: number;
  exposure_id: number;
  workspace_file_path: string;
  default_view_id: number | null;
  views: ExposureFileView[];
}

export interface ExposureEntity {
  id: number;
  description: string | null;
  workspace_id: number;
  workspace_tag_id: number | null;
  commit_id: string;
  created_ts: number;
  default_file_id: number | null;
  files: ExposureFileTarget[] | null;
}

export interface Exposure {
  alias: string;
  entity: ExposureEntity;
}

export type ExposureFile = [string, boolean];

export interface ExposureInfo {
  exposure: ExposureEntity;
  exposure_alias: string;
  files: ExposureFile[];
  workspace: WorkspaceEntity;
  workspace_alias: string;
}

export type ExposureFileInfo = {
  Target: ExposureFileTarget[];
  Redirect?: string;
};
