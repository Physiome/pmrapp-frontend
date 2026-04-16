import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGlobalStateStore = defineStore('globalState', () => {
  const isSearchFocusRequested = ref(false)
  const isLoginUsernameFocusRequested = ref(false)

  const requestSearchFocus = () => {
    isSearchFocusRequested.value = true
  }

  const consumeSearchFocus = () => {
    isSearchFocusRequested.value = false
  }

  const requestLoginUsernameFocus = () => {
    isLoginUsernameFocusRequested.value = true
  }

  const consumeLoginUsernameFocus = () => {
    isLoginUsernameFocusRequested.value = false
  }

  return {
    isSearchFocusRequested,
    isLoginUsernameFocusRequested,
    requestSearchFocus,
    consumeSearchFocus,
    requestLoginUsernameFocus,
    consumeLoginUsernameFocus,
  }
})
