<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/atoms/ActionButton.vue'
import { getAuthService } from '@/services'
import { useAuthStore } from '@/stores/auth'
import CloseButton from '@/components/atoms/CloseButton.vue'
import { useGlobalStateStore } from '@/stores/globalState'

const router = useRouter()
const authStore = useAuthStore()
const globalStateStore = useGlobalStateStore()
const username = ref('')
const usernameInput = ref<HTMLInputElement | null>(null)
const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)
const ERROR_AUTO_HIDE_MS = 5000
let errorTimer: ReturnType<typeof setTimeout> | null = null

const authService = getAuthService()

const clearErrorTimer = () => {
  if (!errorTimer) {
    return
  }

  clearTimeout(errorTimer)
  errorTimer = null
}

const focusUsernameInput = () => {
  usernameInput.value?.focus()
}

onMounted(() => {
  focusUsernameInput()

  if (globalStateStore.isLoginUsernameFocusRequested) {
    focusUsernameInput()
    globalStateStore.consumeLoginUsernameFocus()
  }
})

watch(
  () => globalStateStore.isLoginUsernameFocusRequested,
  (isFocusRequested) => {
    if (!isFocusRequested) {
      return
    }

    focusUsernameInput()
    globalStateStore.consumeLoginUsernameFocus()
  }
)

watch(error, (newError) => {
  clearErrorTimer()

  if (!newError) {
    return
  }

  errorTimer = setTimeout(() => {
    error.value = null
    errorTimer = null
  }, ERROR_AUTO_HIDE_MS)
})

onBeforeUnmount(() => {
  clearErrorTimer()
})

const handleSubmit = async () => {
  error.value = null

  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password'
    focusUsernameInput()
    return
  }

  isLoading.value = true

  try {
    const token = await authService.login({
      login: username.value,
      password: password.value,
    })

    // Store auth state.
    authStore.setAuth(token, username.value)

    // Redirect to home page.
    router.push('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
    focusUsernameInput()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- Error message -->
  <div
    class="error-box flex items-center max-w-md mx-auto mb-4 transition-all"
    :class="error ? 'visible opacity-100 translate-y-0 pointer-events-auto' : 'invisible opacity-0 translate-y-[100%] pointer-events-none'"
  >
    <p class="text-sm">{{ error }}</p>
    <CloseButton
      @click="error = null"
      class="ml-auto"
      aria-label="Close error message"
    />
  </div>

  <div class="max-w-md mx-auto box relative">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Username field -->
      <div>
        <label for="username" class="label-field block mb-2">
          Username
        </label>
        <input
          ref="usernameInput"
          id="username"
          v-model="username"
          type="text"
          autocomplete="username"
          required
          class="input-field w-full"
          placeholder="Enter your username"
        />
      </div>

      <!-- Password field -->
      <div>
        <label for="password" class="label-field block mb-2">
          Password
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="input-field w-full"
          placeholder="Enter your password"
        />
      </div>

      <!-- Submit button -->
      <ActionButton
        type="submit"
        variant="primary"
        size="lg"
        :disabled="isLoading"
        class="w-full"
        contentSection="login_page"
      >
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </ActionButton>
    </form>
  </div>
</template>

<style scoped>
@import '@/assets/label.css';
@import '@/assets/input.css';
@import '@/assets/box.css';
@import '@/assets/error-box.css';
</style>
