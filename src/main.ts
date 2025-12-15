import { createPinia } from 'pinia'
import { createGtag } from 'vue-gtag'
import { createApp } from 'vue'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
const gtag = createGtag({
  tagId: GA_MEASUREMENT_ID,
  pageTracker: {
    router,
  }
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(gtag)

// Initialise authentication state from local storage.
const authStore = useAuthStore()
authStore.initAuth()

app.mount('#app')
