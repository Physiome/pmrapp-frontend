export interface WorkspaceEntity {
  id: number;
  url: string;
  superceded_by_id: number | null;
  description: string | null;
  long_description: string | null;
  created_ts: number;
  exposures: unknown | null;
}

export interface Workspace {
  alias: string;
  entity: WorkspaceEntity;
}

export interface WorkspaceCommit {
  commit_id: string;
  author: string;
  committer: string;
}

export interface WorkspaceFileEntry {
  filemode: string;
  kind: string;
  id: string;
  name: string;
}

export interface WorkspaceTreeInfo {
  filecount: number;
  entries: WorkspaceFileEntry[];
}

export interface WorkspaceTarget {
  TreeInfo: WorkspaceTreeInfo;
}

export interface WorkspaceInfo {
  workspace: WorkspaceEntity;
  commit: WorkspaceCommit;
  path: string;
  target: WorkspaceTarget;
}
