// CookieStore get and set methods are supported in modern browsers.
// https://developer.mozilla.org/en-US/docs/Web/API/CookieStore#browser_compatibility
export const Cookie = {
  get: async (name: string): Promise<string | null> => {
    const cookie = await cookieStore.get(name);
    return cookie?.value ?? null;
  },
  set: async (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    await cookieStore.set({
      name,
      value,
      expires: expires.getTime(),
      path: '/',
    });
  },
};
