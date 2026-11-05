import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const username = ref<string | null>(null);
  const name = ref<string | null>(null);
  const email = ref<string | null>(null);
  const avatarUrl = ref<string | null>(null);
  const isAuthenticated = ref(false);
  const loginMethod = ref<'password' | 'github' | null>(null);

  function setAuth(
    authToken: string,
    user: string,
    fullName?: string | null,
    userEmail?: string | null,
    avatarUrlParam?: string | null,
  ) {
    token.value = authToken;
    username.value = user;
    name.value = fullName ?? null;
    email.value = userEmail ?? null;
    avatarUrl.value = avatarUrlParam ?? null;
    isAuthenticated.value = true;

    // TEMPORARY: Using localStorage for token persistence
    // so that the login state is shared across all tabs in the same browser.
    // This is not the most secure approach as it's still vulnerable to XSS attacks.
    // This can be HttpOnly cookies or other secure storage mechanisms in the future.
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('username', user);
    if (fullName) localStorage.setItem('name', fullName);
    else localStorage.removeItem('name');
    if (userEmail) localStorage.setItem('email', userEmail);
    else localStorage.removeItem('email');
    if (avatarUrlParam) localStorage.setItem('avatar_url', avatarUrlParam);
    else localStorage.removeItem('avatar_url');
  }

  function setLoginMethod(method: 'password' | 'github') {
    loginMethod.value = method;
    localStorage.setItem('auth_method', method);
  }

  function clearAuth() {
    token.value = null;
    username.value = null;
    name.value = null;
    email.value = null;
    avatarUrl.value = null;
    isAuthenticated.value = false;
    loginMethod.value = null;

    // Clear authentication data from localStorage.
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('avatar_url');
    localStorage.removeItem('auth_method');
  }

  function initAuth() {
    const storedToken = localStorage.getItem('auth_token');
    const storedUsername = localStorage.getItem('username');

    if (storedToken && storedUsername) {
      token.value = storedToken;
      username.value = storedUsername;
      name.value = localStorage.getItem('name');
      email.value = localStorage.getItem('email');
      avatarUrl.value = localStorage.getItem('avatar_url');
      loginMethod.value = localStorage.getItem('auth_method') as 'password' | 'github' | null;
      isAuthenticated.value = true;
    } else {
      token.value = null;
      username.value = null;
      name.value = null;
      email.value = null;
      avatarUrl.value = null;
      loginMethod.value = null;
      isAuthenticated.value = false;
    }
  }

  return {
    token,
    username,
    name,
    email,
    avatarUrl,
    isAuthenticated,
    loginMethod,
    setAuth,
    setLoginMethod,
    clearAuth,
    initAuth,
  };
});
