<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ActionButton from '@/components/atoms/ActionButton.vue'
import GitHubIcon from '@/components/icons/GitHubIcon.vue'
import LoadingIcon from '@/components/icons/LoadingIcon.vue'
import Dialog from '@/components/molecules/Dialog.vue'
import { GITHUB_AUTH_ERROR_MESSAGES, GITHUB_OAUTH_AUTHORIZE_URL } from '@/constants/auth'
import router from '@/router'
import { getAuthService } from '@/services'
import { useAuthStore } from '@/stores/auth'
import {
  generateOAuthState,
  getGitHubOAuthParams,
  getGitHubRedirectUri,
  storeOAuthState,
  validateOAuthState,
} from '@/utils/auth'

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID
const APP_BASE_URL = import.meta.env.BASE_URL
const REDIRECT_URI = getGitHubRedirectUri(APP_BASE_URL)
const GITHUB_OAUTH_PARAMS = getGitHubOAuthParams(GITHUB_CLIENT_ID, REDIRECT_URI)

const authService = getAuthService()
const authStore = useAuthStore()
const emit = defineEmits<{
  error: [message: string]
  busyChange: [isBusy: boolean]
}>()

const hasAuthorizationCode = new URLSearchParams(window.location.search).has('code')
const isRedirectingToGitHub = ref(false)
const isAuthenticating = ref(hasAuthorizationCode)
const isBusy = computed(() => isRedirectingToGitHub.value || isAuthenticating.value)

watch(
  isBusy,
  (busyState) => {
    emit('busyChange', busyState)
  },
  { immediate: true },
)

const handleGitHubLoginClick = () => {
  isRedirectingToGitHub.value = true

  const state = generateOAuthState()
  storeOAuthState(state)

  const githubUrl = new URL(GITHUB_OAUTH_AUTHORIZE_URL)
  githubUrl.search = new URLSearchParams({
    ...GITHUB_OAUTH_PARAMS,
    state,
  }).toString()
  window.location.href = githubUrl.toString()
}

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  // Handle explicit GitHub OAuth error responses (e.g. user denied access).
  const oauthError = urlParams.get('error')
  if (oauthError) {
    const errorDescription = urlParams.get('error_description') ?? oauthError
    emit('error', `${GITHUB_AUTH_ERROR_MESSAGES.oAuthErrorPrefix} ${errorDescription}`)
    return
  }

  if (code) {
    isAuthenticating.value = true
    window.history.replaceState({}, document.title, window.location.pathname)
    // Validate the state parameter to prevent CSRF/login injection attacks.
    const state = urlParams.get('state')
    if (!validateOAuthState(state)) {
      emit('error', GITHUB_AUTH_ERROR_MESSAGES.stateVerification)
      isAuthenticating.value = false
      return
    }

    try {
      const { token, username, name, email, avatar_url } = await authService.loginWithGitHub(code)

      authStore.setAuth(token, username, name, email, avatar_url)
      authStore.setLoginMethod('github')
      router.push('/profile')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : GITHUB_AUTH_ERROR_MESSAGES.generic
      emit('error', errorMessage)
      isAuthenticating.value = false
    }
  }
})
</script>

<template>
  <ActionButton
    type="button"
    variant="secondary"
    size="lg"
    :disabled="isBusy"
    class="w-full"
    contentSection="login_page"
    @click="handleGitHubLoginClick"
  >
    <LoadingIcon v-if="isBusy" class="w-5 h-5" />
    <GitHubIcon v-else class="w-5 h-5 text-black dark:text-white" />
    {{
      isAuthenticating
        ? 'Signing in with GitHub...'
        : isRedirectingToGitHub
          ? 'Redirecting to GitHub...'
          : 'Continue with GitHub'
    }}
  </ActionButton>

  <Dialog
    :show="isAuthenticating"
    title="Signing in with GitHub"
    :isStatic="true"
  >
    <div class="flex flex-col items-center justify-center py-6 text-center">
      <div class="mb-6 flex items-center gap-3 relative">
        <LoadingIcon class="h-12 w-12" />
        <GitHubIcon class="h-10 w-10 bg-white dark:bg-gray-700 rounded-full absolute inset-0 m-auto" />
      </div>
      <p class="text-base font-medium text-gray-900 dark:text-gray-100">
        Completing authentication...
      </p>
      <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        This may take a few seconds.
        After sign-in, you will be taken to the profile page automatically.
      </p>
    </div>
  </Dialog>
</template>
