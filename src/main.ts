import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createGtag } from 'vue-gtag'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { LOGIN_DISABLED } from './constants/auth'
import { useAuthStore } from './stores/auth'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
const isCypress = typeof window !== 'undefined' && 'Cypress' in window

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

if (GA_MEASUREMENT_ID && !isCypress) {
  const gtag = createGtag({
    tagId: GA_MEASUREMENT_ID,
    pageTracker: {
      router,
    },
  })
  app.use(gtag)
}

// Initialise authentication state from local storage.
const authStore = useAuthStore()

// When login is disabled, any previously stored authentication data is stale
// and should be removed so that it is not left behind in storage.
if (LOGIN_DISABLED) {
  authStore.clearAuth()
} else {
  authStore.initAuth()
}

// Synchronises authentication state across browser tabs.
// When another tab logs in or out, localStorage updates and triggers the storage event in all other tabs.
// Listens for changes to both 'auth_token' and 'username', and debounces reinitialisation
// so that initAuth() executes only once after both keys are set during login.
// This listener persists for the application's lifetime and requires no explicit cleanup.
let authStorageSyncTimeout: number | undefined

window.addEventListener('storage', (event) => {
  if (event.key === 'auth_token' || event.key === 'username') {
    if (authStorageSyncTimeout !== undefined) {
      clearTimeout(authStorageSyncTimeout)
    }
    authStorageSyncTimeout = window.setTimeout(() => {
      authStore.initAuth()
    }, 50)
  }
})

app.mount('#app')
