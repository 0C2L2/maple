// Web: the browser's localStorage keeps you signed in. Undefined while pages are pre-rendered at build time.
export const sessionStorageAdapter = typeof localStorage === 'undefined' ? undefined : localStorage;
