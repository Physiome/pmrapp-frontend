/**
 * Sort options for list displays.
 */
export type SortOption =
  | 'description-asc'
  | 'description-desc'
  | 'id-asc'
  | 'id-desc'
  | 'date-asc'
  | 'date-desc';

export interface SortOptionConfig {
  value: SortOption;
  label: string;
}

export interface SortableEntity {
  entity: {
    id: number;
    description: string | null;
    created_ts: number;
  };
}
