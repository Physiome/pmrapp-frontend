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
})
