import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FormattedEmailText from '@/components/atoms/FormattedEmailText.vue'

type Case = {
  input: string
  expectedText: string
  expectedLinked: boolean
  expectedHref?: string
}

const cases: Case[] = [
  {
    input: '  ',
    expectedText: '',
    expectedLinked: false,
  },
  {
    input: 'Author Name <authorname@gmail.com>',
    expectedText: 'Author Name',
    expectedLinked: true,
    expectedHref: 'mailto:authorname@gmail.com',
  },
  {
    input: 'Author Name<123+author.name456@users.noreply.github.com>',
    expectedText: 'Author Name',
    expectedLinked: true,
    expectedHref: 'mailto:123+author.name456@users.noreply.github.com',
  },
  {
    input: 'Author Name <authorname@localhost>',
    expectedText: 'Author Name',
    expectedLinked: false,
  },
  {
    input: 'Name <foo@bar@example.com>',
    expectedText: 'Name',
    expectedLinked: false,
  },
  {
    input: 'Name <user@example.com.>',
    expectedText: 'Name',
    expectedLinked: false,
  },
  {
    input: 'author name',
    expectedText: 'author name',
    expectedLinked: false,
  },
  {
    input: 'author (author@example.com)',
    expectedText: 'author',
    expectedLinked: true,
    expectedHref: 'mailto:author@example.com',
  },
  {
    input: 'author@example.com',
    expectedText: 'author@example.com',
    expectedLinked: true,
    expectedHref: 'mailto:author@example.com',
  },
  {
    input: 'author',
    expectedText: 'author',
    expectedLinked: false,
  },
  {
    input: 'author.name@example.co.nz',
    expectedText: 'author.name@example.co.nz',
    expectedLinked: true,
    expectedHref: 'mailto:author.name@example.co.nz',
  },
  {
    input: 'author@localhost',
    expectedText: 'author@localhost',
    expectedLinked: false,
  },
  {
    input: 'author (author@localhost)',
    expectedText: 'author',
    expectedLinked: false,
  },
]

describe('FormattedEmailText', () => {
  it.each(cases)(
    'renders "$input" correctly',
    ({ input, expectedText, expectedLinked, expectedHref }) => {
      const wrapper = mount(FormattedEmailText, {
        props: {
          text: input,
        },
      })

      if (expectedLinked) {
        const link = wrapper.find('a')
        expect(link.exists()).toBe(true)
        expect(link.text()).toBe(expectedText)
        expect(link.attributes('href')).toBe(expectedHref)
      } else {
        const link = wrapper.find('a')
        expect(link.exists()).toBe(false)
        expect(wrapper.text()).toBe(expectedText)
      }

      wrapper.unmount()
    },
  )
})
