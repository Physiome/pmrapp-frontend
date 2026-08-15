import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import WorkspaceDetail from '@/components/organisms/WorkspaceDetail.vue'
import { GITHUB_ISSUES_URL } from '@/constants/global'
import { mockWorkspaceInfo } from '@/mocks/workspaceInfo'
import { useWorkspaceStore } from '@/stores/workspace'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    resolve: vi.fn(() => ({ href: '/workspaces/test-alias' })),
    options: {
      history: {
        state: {
          back: '/workspaces',
        },
      },
    },
  }),
}))

vi.mock('@/utils/analytics', () => ({
  trackButtonClick: vi.fn(),
}))

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
        stubs: {
          BackButton: true,
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
        },
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
      `workspace-url=${encodeURIComponent(`${window.location.origin}/workspaces/test-alias`)}`,
    )
  })
})
