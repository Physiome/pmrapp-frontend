import { describe, expect, it } from 'vitest'
import { TITLE } from '@/constants/global'
import { mockWorkspaceInfo } from '@/mocks/workspaceInfo'
import {
  generateWorkspaceBreadcrumbs,
  generateWorkspacePathBreadcrumbs,
  generateWorkspaceTitle,
} from './workspace'

describe('generateWorkspaceTitle', () => {
  const { description, id } = mockWorkspaceInfo.workspace
  const commitId = mockWorkspaceInfo.commit.commit_id

  it('returns generic title when both description and id are null', () => {
    expect(generateWorkspaceTitle(null, null)).toBe('Workspace Detail')
  })

  it('uses description from mock data', () => {
    expect(generateWorkspaceTitle(description, id)).toBe(description)
  })

  it('accepts description with surrounding whitespace', () => {
    expect(generateWorkspaceTitle('  My Workspace  ', id)).toBe('  My Workspace  ')
  })

  it('falls back to ID when description is null', () => {
    expect(generateWorkspaceTitle(null, id)).toBe(`Workspace ${id}`)
  })

  it('falls back to ID when description is empty', () => {
    expect(generateWorkspaceTitle('', id)).toBe(`Workspace ${id}`)
  })

  describe('with commitId and path', () => {
    const filePath = 'baylor_hollingworth_chandler_2002_a.cellml'

    it('appends commit hash and path when both are provided', () => {
      expect(generateWorkspaceTitle(description, id, commitId, filePath)).toBe(
        `${description} @ ${commitId.substring(0, 12)} / ${filePath}`,
      )
    })

    it('does not append commit info when commitId is undefined', () => {
      expect(generateWorkspaceTitle(description, id, undefined, filePath)).toBe(description)
    })

    it('does not append commit info when path is undefined', () => {
      expect(generateWorkspaceTitle(description, id, commitId, undefined)).toBe(description)
    })

    it('replaces forward slashes with space-slash-space in path', () => {
      const nestedPath = 'a/b/c/file.txt'
      expect(generateWorkspaceTitle(description, id, commitId, nestedPath)).toBe(
        `${description} @ ${commitId.substring(0, 12)} / a / b / c / file.txt`,
      )
    })

    it('works with generic title when description and id are null', () => {
      expect(generateWorkspaceTitle(null, null, commitId, 'path/to/file')).toBe(
        `Workspace Detail @ ${commitId.substring(0, 12)} / path / to / file`,
      )
    })
  })

  describe('with title suffix', () => {
    it('appends site title suffix when withTitleSuffix is true', () => {
      expect(generateWorkspaceTitle(description, id, undefined, undefined, true)).toBe(
        `${description} – ${TITLE}`,
      )
    })

    it('appends suffix with generic title', () => {
      expect(generateWorkspaceTitle(null, null, undefined, undefined, true)).toBe(
        `Workspace Detail – ${TITLE}`,
      )
    })

    it('appends suffix with ID fallback', () => {
      expect(generateWorkspaceTitle(null, id, undefined, undefined, true)).toBe(
        `Workspace ${id} – ${TITLE}`,
      )
    })

    it('appends suffix along with commit and path info', () => {
      expect(generateWorkspaceTitle(description, id, commitId, 'file.txt', true)).toBe(
        `${description} @ ${commitId.substring(0, 12)} / file.txt – ${TITLE}`,
      )
    })
  })
})

describe('generateWorkspacePathBreadcrumbs', () => {
  it('returns no items for the workspace root', () => {
    expect(generateWorkspacePathBreadcrumbs('abc', '123', '')).toEqual([])
  })

  it('links each folder and leaves the last segment as the current page', () => {
    expect(generateWorkspacePathBreadcrumbs('abc', '123', 'src/models/model.cellml')).toEqual([
      { label: 'src', to: '/workspace/abc/file/123/src' },
      { label: 'models', to: '/workspace/abc/file/123/src/models' },
      { label: 'model.cellml' },
    ])
  })

  it('ignores leading, trailing and repeated slashes', () => {
    expect(generateWorkspacePathBreadcrumbs('abc', '123', '/src//models/')).toEqual([
      { label: 'src', to: '/workspace/abc/file/123/src' },
      { label: 'models' },
    ])
  })

  it('encodes special characters in folder links', () => {
    expect(generateWorkspacePathBreadcrumbs('abc', '123', 'a#b/x?y/model.cellml')).toEqual([
      { label: 'a#b', to: '/workspace/abc/file/123/a%23b' },
      { label: 'x?y', to: '/workspace/abc/file/123/a%23b/x%3Fy' },
      { label: 'model.cellml' },
    ])
  })
})

describe('generateWorkspaceBreadcrumbs', () => {
  const { description } = mockWorkspaceInfo.workspace

  it('ends at the unlinked workspace crumb on the workspace root', () => {
    expect(generateWorkspaceBreadcrumbs(mockWorkspaceInfo, 'abc', '', '', false)).toEqual([
      { label: description, to: undefined, loading: false },
    ])
  })

  it('links the workspace crumb to the root at the same commit inside a path', () => {
    expect(
      generateWorkspaceBreadcrumbs(mockWorkspaceInfo, 'abc', '123', 'src/model.cellml', false),
    ).toEqual([
      {
        label: description,
        to: { name: 'workspace-detail-alias-commit', params: { alias: 'abc', commitId: '123' } },
        loading: false,
      },
      { label: 'src', to: '/workspace/abc/file/123/src' },
      { label: 'model.cellml' },
    ])
  })

  it('links the workspace crumb to the latest root when there is no commit', () => {
    const [root] = generateWorkspaceBreadcrumbs(mockWorkspaceInfo, 'abc', '', 'src', false)

    expect(root.to).toEqual({ name: 'workspace-detail', params: { alias: 'abc' } })
  })

  it('falls back to the alias and passes the loading flag through without info', () => {
    const [root] = generateWorkspaceBreadcrumbs(null, 'abc', '123', 'src', true)

    expect(root).toMatchObject({ label: 'abc', loading: true })
  })
})
