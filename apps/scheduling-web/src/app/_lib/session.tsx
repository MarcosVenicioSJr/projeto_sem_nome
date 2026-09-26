'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthTokens, Member, Tenant } from '@org/contracts';
import { ApiError, apiRequest, type ApiOptions } from './api';

/**
 * Sessão do portal: token de acesso (JWT de 15 min, sem refresh) guardado no
 * localStorage. Quando expira — ou a API responde 401 — o usuário volta ao login.
 */
const STORAGE_KEY = 'ba-session';

type Stored = { token: string; expiresAt: number };

export type RegisterInput = {
  tenant: { name: string; slug: string };
  owner: { name: string; email: string; phone: string; password: string };
};

type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

type SessionValue = {
  status: SessionStatus;
  me: Member | null;
  tenant: Tenant | null;
  /** owner/manager administram; employee só atua na própria agenda */
  isManagement: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  /** Chamada autenticada; um 401 encerra a sessão. */
  api: <T>(path: string, options?: Omit<ApiOptions, 'token'>) => Promise<T>;
};

const SessionContext = createContext<SessionValue | null>(null);

function readStored(): Stored | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(value: Stored | null) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage pode estar indisponível (modo privado); a sessão vale só nesta aba.
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [me, setMe] = useState<Member | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const tokenRef = useRef<string | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    tokenRef.current = null;
    writeStored(null);
    setMe(null);
    setTenant(null);
    setStatus('anonymous');
  }, []);

  const start = useCallback(
    async (stored: Stored) => {
      tokenRef.current = stored.token;
      const [profile, company] = await Promise.all([
        apiRequest<Member>('/user/me', { token: stored.token }),
        apiRequest<Tenant>('/tenants/me', { token: stored.token }),
      ]);
      writeStored(stored);
      setMe(profile);
      setTenant(company);
      setStatus('authenticated');
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
      expiryTimer.current = setTimeout(
        clear,
        Math.max(stored.expiresAt - Date.now(), 0),
      );
    },
    [clear],
  );

  useEffect(() => {
    const stored = readStored();
    if (!stored) {
      setStatus('anonymous');
      return;
    }
    start(stored).catch(clear);
    return () => {
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
    };
  }, [start, clear]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiRequest<AuthTokens>('/auth/member/login', {
        method: 'POST',
        body: { email, password },
      });
      await start({
        token: tokens.accessToken,
        expiresAt: Date.now() + tokens.accessTokenExpiresInSeconds * 1000,
      });
    },
    [start],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await apiRequest('/tenants', { method: 'POST', body: input });
      await login(input.owner.email, input.owner.password);
    },
    [login],
  );

  const api = useCallback(
    async <T,>(
      path: string,
      options: Omit<ApiOptions, 'token'> = {},
    ): Promise<T> => {
      try {
        return await apiRequest<T>(path, {
          ...options,
          token: tokenRef.current,
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) clear();
        throw e;
      }
    },
    [clear],
  );

  const value = useMemo<SessionValue>(
    () => ({
      status,
      me,
      tenant,
      isManagement: me?.role === 'owner' || me?.role === 'manager',
      login,
      register,
      logout: clear,
      api,
    }),
    [status, me, tenant, login, register, clear, api],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx)
    throw new Error('useSession deve ser usado dentro de <SessionProvider>');
  return ctx;
}
