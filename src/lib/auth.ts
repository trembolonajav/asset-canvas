export type AppRole = "ADMIN" | "OPERATOR";

export interface StoredAuthCredentials {
  username: string;
  token: string;
}

const AUTH_STORAGE_KEY = "asset-guardian.auth";

export const buildBasicToken = (username: string, password: string) =>
  `Basic ${btoa(`${username}:${password}`)}`;

export const getStoredAuth = (): StoredAuthCredentials | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthCredentials;
  } catch {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const setStoredAuth = (value: StoredAuthCredentials) => {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
  }
};

export const clearStoredAuth = () => {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const getCurrentUsername = () => getStoredAuth()?.username || null;
