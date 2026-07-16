import type {
  ApiUser,
  RankingEntry,
  RankingPeriod,
  Trope,
  VoteType,
  Work,
  WorkTrope,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.message ?? res.statusText;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(", ") : message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

// Reads — safe to call from Server Components, no user session needed.

export function getTropes(topLevelOnly = false) {
  return request<Trope[]>(`/tropes${topLevelOnly ? "?topLevelOnly=true" : ""}`, {
    cache: "no-store",
  });
}

export function getTrope(id: string) {
  return request<Trope>(`/tropes/${id}`, { cache: "no-store" });
}

export function getTropeChildren(id: string) {
  return request<Trope[]>(`/tropes/${id}/children`, { cache: "no-store" });
}

export function getTropeBooks(id: string) {
  return request<Work[]>(`/tropes/${id}/works`, { cache: "no-store" });
}

export function getBooks(params: { skip?: number; take?: number } = {}) {
  const search = new URLSearchParams();
  if (params.skip) search.set("skip", String(params.skip));
  if (params.take) search.set("take", String(params.take));
  const qs = search.toString();
  return request<Work[]>(`/works${qs ? `?${qs}` : ""}`, { cache: "no-store" });
}

export function getBook(id: string) {
  return request<Work>(`/works/${id}`, { cache: "no-store" });
}

export function getBookTropes(id: string) {
  return request<Trope[]>(`/works/${id}/tropes`, { cache: "no-store" });
}

export function getTopTropes(period: RankingPeriod, take = 10) {
  return request<RankingEntry[]>(`/rankings/tropes?period=${period}&take=${take}`, {
    cache: "no-store",
  });
}

// Writes — called from Client Components; must include credentials so the
// httpOnly session cookie set by the API is sent along.

function clientRequest<T>(path: string, init?: RequestInit) {
  return request<T>(path, { ...init, credentials: "include" });
}

export function login(email: string, password: string) {
  return clientRequest<{ success: true }>(`/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return clientRequest<{ success: true }>(`/auth/logout`, { method: "DELETE" });
}

export function signup(email: string, password: string, nickname: string) {
  return clientRequest<ApiUser>(`/user`, {
    method: "POST",
    body: JSON.stringify({ email, password, nickname }),
  });
}

export function createTrope(dto: { name: string; description?: string; parentId?: string }) {
  return clientRequest<Trope>(`/tropes`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function likeTrope(id: string) {
  return clientRequest<{ liked: boolean; likeScore: number }>(`/tropes/${id}/like`, {
    method: "POST",
  });
}

export function addBookToTrope(tropeId: string, workId: string) {
  return clientRequest<WorkTrope>(`/tropes/${tropeId}/works`, {
    method: "POST",
    body: JSON.stringify({ workId }),
  });
}

export function addTropeToBook(bookId: string, tropeId: string) {
  return clientRequest<WorkTrope>(`/works/${bookId}/tropes`, {
    method: "POST",
    body: JSON.stringify({ tropeId }),
  });
}

export function voteWorkTrope(tropeId: string, bookId: string, voteType: VoteType) {
  return clientRequest<{ voteScore: number }>(`/tropes/${tropeId}/works/${bookId}/vote`, {
    method: "POST",
    body: JSON.stringify({ voteType }),
  });
}
