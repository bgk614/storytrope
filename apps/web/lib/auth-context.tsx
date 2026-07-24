'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

export interface AuthUser {
  email: string;
  nickname: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'storytrope_user';

// The API only exposes login/logout (no "current user" endpoint), so the
// client remembers who logged in locally. This is a best-effort UI hint,
// not a source of truth — the httpOnly session cookie is what the API trusts.
// localStorage is read via useSyncExternalStore (not effect+setState) so the
// client's first render can safely differ from the server's without a
// hydration mismatch, and other components sync when setUser runs.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// useSyncExternalStore compares snapshots with Object.is, so getSnapshot must
// return the same object until the stored value actually changes — parsing
// fresh on every call would trigger an infinite re-render loop.
let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

function getSnapshot(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  if (!raw) {
    cachedUser = null;
    return null;
  }
  try {
    cachedUser = JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedUser = null;
  }
  return cachedUser;
}

function getServerSnapshot(): AuthUser | null {
  return null;
}

function writeUser(next: AuthUser | null) {
  if (next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <AuthContext.Provider value={{ user, ready, setUser: writeUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
