import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('initialises with unauthenticated state', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.token).toBeNull();
    expect(store.username).toBeNull();
    expect(store.name).toBeNull();
    expect(store.email).toBeNull();
    expect(store.loginMethod).toBeNull();
  });

  describe('setAuth', () => {
    it('sets authenticated state in the store', () => {
      const store = useAuthStore();
      store.setAuth('test-token', 'testuser');
      expect(store.isAuthenticated).toBe(true);
      expect(store.token).toBe('test-token');
      expect(store.username).toBe('testuser');
      expect(store.name).toBeNull();
      expect(store.email).toBeNull();
    });

    it('stores name and email when provided', () => {
      const store = useAuthStore();
      store.setAuth('test-token', 'testuser', 'Test User', 'test@example.com');
      expect(store.name).toBe('Test User');
      expect(store.email).toBe('test@example.com');
    });

    it('persists auth token and username to localStorage', () => {
      const store = useAuthStore();
      store.setAuth('test-token', 'testuser');
      expect(localStorage.getItem('auth_token')).toBe('test-token');
      expect(localStorage.getItem('username')).toBe('testuser');
    });

    it('persists name and email to localStorage when provided', () => {
      const store = useAuthStore();
      store.setAuth('test-token', 'testuser', 'Test User', 'test@example.com');
      expect(localStorage.getItem('name')).toBe('Test User');
      expect(localStorage.getItem('email')).toBe('test@example.com');
    });

    it('removes name and email from localStorage when not provided', () => {
      const store = useAuthStore();
      localStorage.setItem('name', 'Old Name');
      localStorage.setItem('email', 'old@example.com');
      store.setAuth('test-token', 'testuser');
      expect(localStorage.getItem('name')).toBeNull();
      expect(localStorage.getItem('email')).toBeNull();
    });
  });

  describe('setLoginMethod', () => {
    it('sets login method to password', () => {
      const store = useAuthStore();
      store.setLoginMethod('password');
      expect(store.loginMethod).toBe('password');
      expect(localStorage.getItem('auth_method')).toBe('password');
    });

    it('sets login method to github', () => {
      const store = useAuthStore();
      store.setLoginMethod('github');
      expect(store.loginMethod).toBe('github');
      expect(localStorage.getItem('auth_method')).toBe('github');
    });
  });

  describe('clearAuth', () => {
    it('clears authenticated state from the store', () => {
      const store = useAuthStore();
      store.setAuth('test-token', 'testuser', 'Test User', 'test@example.com');
      store.setLoginMethod('github');
      store.clearAuth();
      expect(store.isAuthenticated).toBe(false);
      expect(store.token).toBeNull();
      expect(store.username).toBeNull();
      expect(store.name).toBeNull();
      expect(store.email).toBeNull();
      expect(store.loginMethod).toBeNull();
    });

    it('removes auth token, username, name and email from localStorage', () => {
      const store = useAuthStore();
      store.setAuth('test-token', 'testuser', 'Test User', 'test@example.com');
      store.clearAuth();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(localStorage.getItem('name')).toBeNull();
      expect(localStorage.getItem('email')).toBeNull();
      expect(localStorage.getItem('auth_method')).toBeNull();
    });
  });

  describe('initAuth', () => {
    it('restores authenticated state from localStorage', () => {
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('username', 'storeduser');
      localStorage.setItem('name', 'Stored User');
      localStorage.setItem('email', 'stored@example.com');
      const store = useAuthStore();
      store.initAuth();
      expect(store.isAuthenticated).toBe(true);
      expect(store.token).toBe('stored-token');
      expect(store.username).toBe('storeduser');
      expect(store.name).toBe('Stored User');
      expect(store.email).toBe('stored@example.com');
      expect(store.loginMethod).toBeNull();
    });

    it('restores login method from localStorage', () => {
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('username', 'storeduser');
      localStorage.setItem('auth_method', 'github');
      const store = useAuthStore();
      store.initAuth();
      expect(store.isAuthenticated).toBe(true);
      expect(store.loginMethod).toBe('github');
    });

    it('remains unauthenticated when localStorage has no stored credentials', () => {
      const store = useAuthStore();
      store.initAuth();
      expect(store.isAuthenticated).toBe(false);
      expect(store.token).toBeNull();
      expect(store.username).toBeNull();
    });

    it('clears authenticated state when localStorage credentials are removed (cross-tab logout)', () => {
      const store = useAuthStore();
      store.setAuth('test-token', 'testuser');
      // Simulate another tab clearing localStorage on logout.
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');
      store.initAuth();
      expect(store.isAuthenticated).toBe(false);
      expect(store.token).toBeNull();
      expect(store.username).toBeNull();
    });

    it('updates state when localStorage credentials change (cross-tab login)', () => {
      const store = useAuthStore();
      // Simulate another tab logging in and writing to localStorage.
      localStorage.setItem('auth_token', 'new-token');
      localStorage.setItem('username', 'newuser');
      store.initAuth();
      expect(store.isAuthenticated).toBe(true);
      expect(store.token).toBe('new-token');
      expect(store.username).toBe('newuser');
    });
  });
});
