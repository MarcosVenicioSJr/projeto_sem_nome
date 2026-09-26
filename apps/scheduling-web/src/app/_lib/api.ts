/**
 * Cliente HTTP da API. As chamadas vão para `/api/...` do próprio Next, que
 * repassa para a API (ver `rewrites` em next.config.js) — sem CORS.
 */

export type ApiIssue = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
    readonly issues: ApiIssue[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token }: ApiOptions = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        'Accept-Language': 'pt-BR',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'network',
      'Não foi possível conectar ao servidor. Tente novamente.',
    );
  }

  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as
    { message?: string; code?: string; issues?: ApiIssue[] } | T | null;

  if (!res.ok) {
    const err = (data ?? {}) as {
      message?: string;
      code?: string;
      issues?: ApiIssue[];
    };
    throw new ApiError(
      res.status,
      err.code,
      err.issues?.[0]?.message ?? err.message ?? 'Algo deu errado.',
      err.issues ?? [],
    );
  }
  return data as T;
}
