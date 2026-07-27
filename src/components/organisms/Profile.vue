<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/atoms/ActionButton.vue'
import ConfirmDialog from '@/components/atoms/ConfirmDialog.vue'
import GitHubIcon from '@/components/icons/GitHubIcon.vue'
import LogoutIcon from '@/components/icons/LogoutIcon.vue'
import UserIcon from '@/components/icons/UserIcon.vue'
import { GITHUB_AUTH_ERROR_MESSAGES, LOGOUT_ERROR_MESSAGES } from '@/constants/auth'
import { getAuthService } from '@/services'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const authService = getAuthService()

const isGitHubUser = computed(() => authStore.loginMethod === 'github')

const showLogOutConfirm = ref(false)
const showDisconnectGitHubConfirm = ref(false)

const confirmLogOut = () => {
  showLogOutConfirm.value = true
}

const handleLogOut = async () => {
  showLogOutConfirm.value = false
  try {
    await authService.logout()
    authStore.clearAuth()
    router.push('/')
  } catch (error) {
    console.error(LOGOUT_ERROR_MESSAGES.generic, error)
  }
}

const cancelLogOut = () => {
  showLogOutConfirm.value = false
}

const confirmDisconnectGitHub = () => {
  showDisconnectGitHubConfirm.value = true
}

const handleDisconnectGitHub = async () => {
  showDisconnectGitHubConfirm.value = false
  try {
    await authService.revokeGitHub()
    authStore.clearAuth()
    router.push('/')
  } catch (error) {
    console.error(GITHUB_AUTH_ERROR_MESSAGES.revoke, error)
  }
}

const cancelDisconnectGitHub = () => {
  showDisconnectGitHubConfirm.value = false
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">

    <!-- Avatar and display name. -->
    <div class="box flex items-center gap-5">
      <div
        class="avatar"
        aria-hidden="true"
      >
        <img
          v-if="authStore.avatarUrl"
          :src="authStore.avatarUrl"
          alt="Profile picture"
          class="avatar-img"
        />
        <UserIcon v-else class="w-8 h-8" />
      </div>
      <div class="min-w-0">
        <p class="text-xl font-semibold truncate text-heading">
          {{ authStore.name || authStore.username }}
        </p>
      </div>
    </div>

    <!-- Account information. -->
    <section class="box space-y-5" aria-labelledby="account-info-heading">
      <h2 id="account-info-heading" class="section-heading">Account information</h2>

      <div class="info-row">
        <span class="label-field">Username</span>
        <span class="info-value">{{ authStore.username }}</span>
      </div>

      <div class="info-row" v-if="authStore.name">
        <span class="label-field">Full name</span>
        <span class="info-value">{{ authStore.name }}</span>
      </div>

      <div class="info-row" v-if="authStore.email">
        <span class="label-field">Email</span>
        <span class="info-value">{{ authStore.email }}</span>
      </div>
    </section>

    <!-- Account actions. -->
    <section class="box" aria-labelledby="account-actions-heading">
      <h2 id="account-actions-heading" class="section-heading mb-4">Account actions</h2>

      <!-- GitHub user: show disconnect option. -->
      <ActionButton
        v-if="isGitHubUser"
        type="button"
        variant="secondary"
        size="md"
        contentSection="profile_page"
        @click="confirmDisconnectGitHub"
      >
        <GitHubIcon class="w-4 h-4 text-black dark:text-white" />
        Disconnect GitHub
      </ActionButton>

      <!-- Password user: show logout option. -->
      <ActionButton
        v-else
        type="button"
        variant="secondary"
        size="md"
        contentSection="profile_page"
        @click="confirmLogOut"
      >
        <LogoutIcon class="w-4 h-4" />
        Log out
      </ActionButton>
    </section>

  </div>

  <ConfirmDialog
    :show="showLogOutConfirm"
    title="Log out"
    message="Are you sure you want to log out?"
    confirm-label="Log out"
    cancel-label="Cancel"
    @confirm="handleLogOut"
    @cancel="cancelLogOut"
  />

  <ConfirmDialog
    :show="showDisconnectGitHubConfirm"
    title="Disconnect GitHub"
    message="Are you sure you want to disconnect your GitHub account? This will revoke the application's authorisation."
    confirm-label="Disconnect"
    cancel-label="Cancel"
    @confirm="handleDisconnectGitHub"
    @cancel="cancelDisconnectGitHub"
  />
</template>

<style scoped>
@import '@/assets/label.css';
@import '@/assets/box.css';

.avatar {
  @apply flex-shrink-0 w-16 h-16 rounded-full bg-primary text-white
         flex items-center justify-center text-xl font-bold select-none overflow-hidden;
}

.avatar-img {
  @apply w-full h-full object-cover;
}

.section-heading {
  @apply text-base font-semibold text-heading border-b border-gray-200 pb-3;
}

.info-row {
  @apply flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4;
}

.info-row .label-field {
  @apply sm:w-32 shrink-0 font-bold;
}

.info-value {
  @apply text-foreground;
}

@media (prefers-color-scheme: dark) {
  .section-heading {
    @apply border-gray-700;
  }
}
</style>
