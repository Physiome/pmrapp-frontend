import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FileBrowserBreadcrumb from '@/components/molecules/FileBrowserBreadcrumb.vue'

describe('FileBrowserBreadcrumb', () => {
  const mountBreadcrumb = (path: string) => {
    const onPathChange = vi.fn()
    const wrapper = mount(FileBrowserBreadcrumb, { props: { path, onPathChange } })
    return { wrapper, onPathChange }
  }

  it('marks the last segment as the current folder', () => {
    const { wrapper } = mountBreadcrumb('src/models')

    expect(wrapper.find('[aria-current="page"]').text()).toBe('models')
  })

  it('navigates to the root and to each parent folder', async () => {
    const { wrapper, onPathChange } = mountBreadcrumb('/src//models/cellml/')
    const buttons = wrapper.findAll('button')

    expect(buttons.map((button) => button.text())).toEqual(['Files', 'src', 'models'])

    await buttons[0].trigger('click')
    await buttons[2].trigger('click')

    expect(onPathChange).toHaveBeenNthCalledWith(1, undefined)
    expect(onPathChange).toHaveBeenNthCalledWith(2, 'src/models')
  })

  describe('as workspace links', () => {
    const RouterLinkStub = {
      props: ['to'],
      template: '<a :href="to"><slot /></a>',
    }

    const mountLinks = (path: string) =>
      mount(FileBrowserBreadcrumb, {
        props: { path, alias: 'abc', commitId: '123' },
        global: { stubs: { RouterLink: RouterLinkStub } },
      })

    it('links the root and each parent folder to its workspace page', () => {
      const wrapper = mountLinks('sub dir/models/cellml')

      expect(wrapper.findAll('a').map((a) => [a.text(), a.attributes('href')])).toEqual([
        ['Files', '/workspace/abc/file/123'],
        ['sub dir', '/workspace/abc/file/123/sub%20dir'],
        ['models', '/workspace/abc/file/123/sub%20dir/models'],
      ])
      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('does not link the current folder', () => {
      const wrapper = mountLinks('src/models')

      expect(wrapper.find('[aria-current="page"]').text()).toBe('models')
      expect(wrapper.findAll('a').map((a) => a.text())).not.toContain('models')
    })
  })
})
