// Metro selects storage.native.ts on native; never import its web shim here.
export function getSessionStorage() {
  if (typeof window === 'undefined') return undefined;
  return {
    getItem: (key: string) => window.localStorage.getItem(key),
    setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
    removeItem: (key: string) => window.localStorage.removeItem(key),
  };
}
