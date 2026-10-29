import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import BreadcrumbsBar from '@/components/molecules/BreadcrumbsBar.vue'
import WorkspaceDetail from '@/components/organisms/WorkspaceDetail.vue'
import { GITHUB_ISSUES_URL } from '@/constants/global'
import { mockWorkspaceInfo } from '@/mocks/workspaceInfo'
import { useWorkspaceStore } from '@/stores/workspace'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    resolve: vi.fn(() => ({ href: '/workspace/test-alias' })),
  }),
}))

vi.mock('@/utils/analytics', () => ({
  trackButtonClick: vi.fn(),
}))

const stubs = {
  BreadcrumbsBar: true,
  ActionButton: {
    props: ['href', 'target', 'rel', 'contentSection', 'variant', 'size'],
    template: '<a :href="href" :target="target" :rel="rel"><slot /></a>',
  },
  FormattedEmailText: true,
  LoadingBox: true,
  ErrorBlock: true,
  PageHeader: true,
  WorkspaceFileBrowser: true,
  DownloadIcon: true,
  BugIcon: true,
}

describe('WorkspaceDetail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders a report issue button that pre-fills the workspace issue template', async () => {
    const workspaceStore = useWorkspaceStore()
    vi.spyOn(workspaceStore, 'getWorkspaceInfo').mockResolvedValue(mockWorkspaceInfo)

    const wrapper = mount(WorkspaceDetail, {
      props: {
        alias: 'test-alias',
      },
      global: {
        stubs,
      },
    })

    await flushPromises()
    await nextTick()

    const issueLink = wrapper.find('a[href*="/issues/new"]')

    expect(issueLink.exists()).toBe(true)
    expect(issueLink.attributes('href')).toContain(`${GITHUB_ISSUES_URL}/new`)
    expect(issueLink.attributes('href')).toContain('template=workspace.yml')
    expect(issueLink.attributes('href')).toContain('labels=workspace')
    expect(issueLink.attributes('href')).toContain('title=%5BWorkspace%5D%3A+')
    expect(issueLink.attributes('href')).toContain(
      `workspace-url=${encodeURIComponent(`${window.location.origin}/workspace/test-alias`)}`,
    )
  })

  it('ends the breadcrumb at the workspace on the workspace root', async () => {
    const workspaceStore = useWorkspaceStore()
    vi.spyOn(workspaceStore, 'getWorkspaceInfo').mockResolvedValue(mockWorkspaceInfo)

    const wrapper = mount(WorkspaceDetail, {
      props: { alias: 'test-alias' },
      global: { stubs },
    })

    await flushPromises()

    expect(wrapper.findComponent(BreadcrumbsBar).props('items')).toEqual([
      { label: mockWorkspaceInfo.workspace.description, to: undefined, loading: false },
    ])
  })

  it('links the workspace crumb to the root at the same commit and adds each folder inside a folder', async () => {
    const workspaceStore = useWorkspaceStore()
    vi.spyOn(workspaceStore, 'getWorkspaceInfo').mockResolvedValue(mockWorkspaceInfo)

    const wrapper = mount(WorkspaceDetail, {
      props: { alias: 'test-alias', commitId: 'abc123', path: 'src/models' },
      global: { stubs },
    })

    await flushPromises()

    expect(wrapper.findComponent(BreadcrumbsBar).props('items')).toEqual([
      {
        label: mockWorkspaceInfo.workspace.description,
        to: {
          name: 'workspace-detail-alias-commit',
          params: { alias: 'test-alias', commitId: 'abc123' },
        },
        loading: false,
      },
      { label: 'src', to: '/workspace/test-alias/file/abc123/src' },
      { label: 'models' },
    ])
  })

  it('shows a loading crumb until the workspace loads', () => {
    const workspaceStore = useWorkspaceStore()
    vi.spyOn(workspaceStore, 'getWorkspaceInfo').mockReturnValue(new Promise(() => {}))

    const wrapper = mount(WorkspaceDetail, {
      props: { alias: 'test-alias' },
      global: { stubs },
    })

    expect(wrapper.findComponent(BreadcrumbsBar).props('items')[0]).toMatchObject({ loading: true })
  })
})
