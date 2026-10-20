import type { CategoryData } from '@/stores/search'
import type { Exposure } from '@/types/exposure'
import type { Workspace } from '@/types/workspace'

export const workspaces: Workspace[] = [
  {
    alias: '4e4',
    entity: {
      id: 505,
      url: 'https://models.physiomeproject.org/workspace/4e4/',
      superceded_by_id: null,
      description: "O'Hara-Rudy-CiPA-v1.0 (2017)",
      long_description: null,
      created_ts: 1768823981,
      exposures: null,
    },
  },
  {
    alias: 'mcallister_noble_tsien_1975',
    entity: {
      id: 961,
      url: 'https://models.physiomeproject.org/workspace/mcallister_noble_tsien_1975/',
      superceded_by_id: null,
      description: 'Mcallister, Noble, Tsien, 1975',
      long_description: null,
      created_ts: 1768823987,
      exposures: null,
    },
  },
  {
    alias: 'add',
    entity: {
      id: 164,
      url: 'https://models.physiomeproject.org/workspace/add/',
      superceded_by_id: null,
      description:
        'A 3D human whole-body model with integrated organs, vasculature, musculoskeletal and nervous systems for mapping nerves',
      long_description: null,
      created_ts: 1768823977,
      exposures: null,
    },
  },
]

export const exposures: Exposure[] = [
  {
    alias: '5a0',
    entity: {
      id: 386,
      description: "O'Hara-Rudy-CiPA-v1.0 (2017)",
      workspace_id: 505,
      workspace_tag_id: null,
      commit_id: '2c2629a8e2b60c2cde677903e03c9c9be3f39a00',
      created_ts: 1768824104,
      default_file_id: null,
      files: null,
    },
  },
  {
    alias: '60e23c3228a3e455699846704006a8fe',
    entity: {
      id: 797,
      description: 'Mcallister, Noble, Tsien, 1975',
      workspace_id: 961,
      workspace_tag_id: null,
      commit_id: 'b84d9a62c623f1f77c96d02729ef294084c463f8',
      created_ts: 1768824221,
      default_file_id: null,
      files: null,
    },
  },
  {
    alias: 'b03',
    entity: {
      id: 137,
      description:
        'A 3D human whole-body model with integrated organs, vasculature, musculoskeletal and nervous systems for mapping nerves',
      workspace_id: 164,
      workspace_tag_id: null,
      commit_id: 'bd99a30c9c9a13f7aac892ebac2fba8c8db882cb',
      created_ts: 1768824019,
      default_file_id: null,
      files: null,
    },
  },
]

export const searchCategories: CategoryData[] = [
  {
    kind: 'citation_author_family_name',
    kindInfo: {
      kind: { id: 1, description: 'citation_author_family_name' },
      terms: ['Hodgkin', 'Huxley', 'Noble', 'unknown', 'Unknown, Unknown', ' '],
    },
    loading: false,
    error: null,
  },
  {
    kind: 'model_author',
    kindInfo: {
      kind: { id: 2, description: 'model_author' },
      terms: ['Catherine Lloyd', 'Noble', 'Penny Noble'],
    },
    loading: false,
    error: null,
  },
  {
    kind: 'cellml_keyword',
    kindInfo: {
      kind: { id: 3, description: 'cellml_keyword' },
      terms: ['calcium', 'cardiac', 'electrophysiology'],
    },
    loading: false,
    error: null,
  },
  {
    kind: 'citation_id',
    kindInfo: {
      kind: { id: 4, description: 'citation_id' },
      terms: ['pubmed:1185607', 'pubmed:'],
    },
    loading: false,
    error: null,
  },
]
