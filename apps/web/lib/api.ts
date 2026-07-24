import type {
  AdminUser,
  AdminWorkTropeLink,
  ApiUser,
  RankingEntry,
  RankingPeriod,
  Trope,
  VoteType,
  Work,
  WorkTrope,
  WorkTropeSource,
} from './types';

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
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.message ?? res.statusText;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

// Reads — safe to call from Server Components, no user session needed.

function paginationParams(params: { skip?: number; take?: number } = {}) {
  const search = new URLSearchParams();
  if (params.skip) search.set('skip', String(params.skip));
  if (params.take) search.set('take', String(params.take));
  return search;
}

export function getTropes(topLevelOnly = false, params: { skip?: number; take?: number } = {}) {
  const search = paginationParams(params);
  if (topLevelOnly) search.set('topLevelOnly', 'true');
  const qs = search.toString();
  return request<Trope[]>(`/tropes${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
}

export function getTrope(id: string) {
  return request<Trope>(`/tropes/${id}`, { cache: 'no-store' });
}

export function getTropeChildren(id: string, params: { skip?: number; take?: number } = {}) {
  const qs = paginationParams(params).toString();
  return request<Trope[]>(`/tropes/${id}/children${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
}

export function getTropeBooks(id: string, params: { skip?: number; take?: number } = {}) {
  const qs = paginationParams(params).toString();
  return request<Work[]>(`/tropes/${id}/works${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
}

export function getBooks(params: { skip?: number; take?: number } = {}) {
  const qs = paginationParams(params).toString();
  return request<Work[]>(`/works${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
}

export function getBook(id: string) {
  return request<Work>(`/works/${id}`, { cache: 'no-store' });
}

export function getBookTropes(id: string, params: { skip?: number; take?: number } = {}) {
  const qs = paginationParams(params).toString();
  return request<Trope[]>(`/works/${id}/tropes${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
}

export function getTopTropes(period: RankingPeriod, take = 10) {
  return request<RankingEntry[]>(`/ranking/tropes?period=${period}&take=${take}`, {
    cache: 'no-store',
  });
}

// Writes — called from Client Components; must include credentials so the
// httpOnly session cookie set by the API is sent along.

function clientRequest<T>(path: string, init?: RequestInit) {
  return request<T>(path, { ...init, credentials: 'include' });
}

export function login(email: string, password: string) {
  return clientRequest<{ success: true }>(`/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return clientRequest<{ success: true }>(`/auth/logout`, { method: 'DELETE' });
}

export function signup(email: string, password: string, nickname: string) {
  return clientRequest<ApiUser>(`/auth/signup`, {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  });
}

export function createTrope(dto: { name: string; description?: string; parentId?: string }) {
  return clientRequest<Trope>(`/tropes`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function likeTrope(id: string) {
  return clientRequest<{ liked: boolean; likeScore: number }>(`/tropes/${id}/like`, {
    method: 'POST',
  });
}

export function addBookToTrope(tropeId: string, workId: string) {
  return clientRequest<WorkTrope>(`/tropes/${tropeId}/works`, {
    method: 'POST',
    body: JSON.stringify({ workId }),
  });
}

export function addTropeToBook(bookId: string, tropeId: string) {
  return clientRequest<WorkTrope>(`/works/${bookId}/tropes`, {
    method: 'POST',
    body: JSON.stringify({ tropeId }),
  });
}

export function voteWorkTrope(tropeId: string, bookId: string, voteType: VoteType) {
  return clientRequest<{ voteScore: number }>(`/tropes/${tropeId}/works/${bookId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ voteType }),
  });
}

// 관리자용 — 아래 조회는 서버 컴포넌트에서 실행되며 호출자의 세션 쿠키를 직접 전달해야함
// (일반 request() 헬퍼는 쿠키를 보내지 않음), 변경 작업은 위의 쓰기와 마찬가지로
// 클라이언트 컴포넌트에서 clientRequest를 재사용

function adminRequest<T>(path: string, cookieHeader: string) {
  return request<T>(path, {
    cache: 'no-store',
    headers: { Cookie: cookieHeader },
  });
}

export function getCurrentUser(cookieHeader: string) {
  return adminRequest<AdminUser>('/users/me', cookieHeader);
}

export function adminListUsers(
  cookieHeader: string,
  params: { skip?: number; take?: number } = {},
) {
  const qs = paginationParams(params).toString();
  return adminRequest<AdminUser[]>(`/users${qs ? `?${qs}` : ''}`, cookieHeader);
}

export function adminDeleteUser(id: string) {
  return clientRequest<void>(`/users/${id}`, { method: 'DELETE' });
}

export function adminListWorkTropeLinks(
  cookieHeader: string,
  params: { skip?: number; take?: number; source?: WorkTropeSource } = {},
) {
  const search = paginationParams(params);
  if (params.source) search.set('source', params.source);
  const qs = search.toString();
  return adminRequest<AdminWorkTropeLink[]>(
    `/admin/work-tropes${qs ? `?${qs}` : ''}`,
    cookieHeader,
  );
}

export function adminDeleteWorkTropeLink(workId: string, tropeId: string) {
  return clientRequest<void>(`/works/${workId}/tropes/${tropeId}`, {
    method: 'DELETE',
  });
}

export interface AdminWorkInput {
  title: string;
  description?: string;
  firstPublishDate?: string;
  coverId?: number;
  authorNames?: string[];
}

export function adminCreateWork(dto: AdminWorkInput) {
  return clientRequest<Work>(`/works`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function adminUpdateWork(id: string, dto: Partial<AdminWorkInput>) {
  return clientRequest<Work>(`/works/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export function adminDeleteWork(id: string) {
  return clientRequest<void>(`/works/${id}`, { method: 'DELETE' });
}
