import type { WorkspaceInfo } from '@/types/workspace';

export const mockWorkspaceInfo: WorkspaceInfo = {
  workspace: {
    id: 682,
    url: 'https://models.physiomeproject.org/workspace/baylor_hollingworth_chandler_2002/',
    superceded_by_id: null,
    description: 'Baylor, Hollingworth, Chandler, 2002',
    long_description: null,
    created_ts: 1768823983,
    exposures: null,
  },
  commit: {
    commit_id: '29a94f9c5718c0aa7438593c2e55d1a2088eeb19',
    author: 'Catherine Lloyd <c.lloyd@auckland.ac.nz>',
    committer: 'Catherine Lloyd <c.lloyd@auckland.ac.nz>',
  },
  path: '',
  target: {
    TreeInfo: {
      filecount: 7,
      entries: [
        {
          filemode: '100644',
          kind: 'blob',
          id: '7f7ce349b399233d7c5a5b41766e56d1366e32c0',
          name: 'baylor_2002.png',
        },
        {
          filemode: '100644',
          kind: 'blob',
          id: 'a2decb757768a2d7808efb0011fc969238cdc48b',
          name: 'baylor_hollingworth_chandler_2002_a.cellml',
        },
        {
          filemode: '100644',
          kind: 'blob',
          id: 'cdb994d0a55aa55f1d72b65edd82f56f2b2d4597',
          name: 'baylor_hollingworth_chandler_2002_b.cellml',
        },
        {
          filemode: '100644',
          kind: 'blob',
          id: 'a2f45202334e461958b210e5033eac091992998a',
          name: 'baylor_hollingworth_chandler_2002_c.cellml',
        },
        {
          filemode: '100644',
          kind: 'blob',
          id: 'db07220ae71b962498335a1269bc9d78a25ebe91',
          name: 'baylor_hollingworth_chandler_2002_d.cellml',
        },
        {
          filemode: '100644',
          kind: 'blob',
          id: '0e068ff346418d635be2b13294375540f777d881',
          name: 'baylor_hollingworth_chandler_2002_e.cellml',
        },
        {
          filemode: '100644',
          kind: 'blob',
          id: 'b02dfb9a39443bc23a0922b27310d90728086cbb',
          name: 'baylor_hollingworth_chandler_2002_f.cellml',
        },
      ],
    },
  },
};
