import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import WorkspaceFileBrowser from '@/components/molecules/WorkspaceFileBrowser.vue'
import { mockWorkspaceInfo } from '@/mocks/workspaceInfo'
import { useWorkspaceStore } from '@/stores/workspace'

describe('WorkspaceFileBrowser', () => {
  let workspaceStore: ReturnType<typeof useWorkspaceStore>

  const mountComponent = async () => {
    vi.spyOn(workspaceStore, 'getWorkspaceInfo').mockResolvedValue(mockWorkspaceInfo)

    const wrapper = mount(WorkspaceFileBrowser, {
      props: {
        alias: 'test-alias',
        commitId: mockWorkspaceInfo.commit.commit_id,
      },
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          ActionButton: { template: '<button><slot /></button>' },
          ErrorBlock: true,
          FileBrowserBreadcrumb: true,
          FolderIcon: true,
          GitIcon: true,
          FileIcon: true,
          ExternalLinkIcon: true,
          DownloadIcon: true,
        },
      },
    })

    await flushPromises()
    await nextTick()

    return wrapper
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    workspaceStore = useWorkspaceStore()
    vi.clearAllMocks()
  })

  it('renders 7 file items and the correct file count text', async () => {
    const wrapper = await mountComponent()

    const listItems = wrapper.findAll('ul.divide-y > li')
    expect(listItems).toHaveLength(7)

    const fileCountText = wrapper.find('.text-gray-600')
    expect(fileCountText.exists()).toBe(true)
    expect(fileCountText.text()).toContain('7 items')
  })

  it('shows a skeleton while the files are loading', async () => {
    vi.spyOn(workspaceStore, 'getWorkspaceInfo').mockReturnValue(new Promise(() => {}))

    const wrapper = mount(WorkspaceFileBrowser, {
      props: {
        alias: 'test-alias',
        commitId: mockWorkspaceInfo.commit.commit_id,
      },
    })
    await nextTick()

    expect(wrapper.findComponent({ name: 'SkeletonBlock' }).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('items')
  })
})
