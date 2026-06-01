const BASE_URL = 'https://fototec-api.lm7529171.workers.dev';
const API_URL = BASE_URL + '/graphql';
const WORKERS_API = BASE_URL;

export async function gql<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const user = getUser();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': user?.id || '',
      'X-User-Role': user?.role || 'cliente',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export async function apiGet<T = any>(path: string, query?: Record<string, string>): Promise<T> {
  const user = getUser();
  let url = `${WORKERS_API}${path}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += '?' + params.toString();
  }
  const res = await fetch(url, {
    headers: {
      'X-User-Id': user?.id || '',
      'X-User-Role': user?.role || 'cliente',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiPost<T = any>(path: string, data?: Record<string, any>): Promise<T> {
  const user = getUser();
  const res = await fetch(`${WORKERS_API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': user?.id || '',
      'X-User-Role': user?.role || 'cliente',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiPut<T = any>(path: string, data?: Record<string, any>): Promise<T> {
  const user = getUser();
  const res = await fetch(`${WORKERS_API}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': user?.id || '',
      'X-User-Role': user?.role || 'cliente',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const user = getUser();
  const res = await fetch(`${WORKERS_API}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': user?.id || '',
      'X-User-Role': user?.role || 'cliente',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getToken(): string | null {
  return localStorage.getItem('fototec_token');
}

export function setAuth(token: string, user: any): void {
  localStorage.setItem('fototec_token', token);
  localStorage.setItem('fototec_user', JSON.stringify(user));
}

export function getUser(): any {
  const u = localStorage.getItem('fototec_user');
  return u ? JSON.parse(u) : null;
}

export function clearAuth(): void {
  localStorage.removeItem('fototec_token');
  localStorage.removeItem('fototec_user');
}

export function hasPermission(perm: string): boolean {
  const user = getUser();
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return user.permissions?.includes(perm) ?? false;
}

export function hasRole(role: string): boolean {
  const user = getUser();
  return user?.role === role;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function trendColor(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-500';
}

export function trendIcon(value: number): string {
  if (value > 0) return '\u2191';
  if (value < 0) return '\u2193';
  return '\u2194';
}

export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    pendiente: 'badge-warning',
    pagado: 'badge-success',
    completado: 'badge-success',
    activo: 'badge-success',
    enviado: 'badge-info',
    aprobado: 'badge-success',
    borrador: 'badge-secondary',
    rechazado: 'badge-danger',
    cancelado: 'badge-danger',
    vencido: 'badge-danger',
    abierto: 'badge-warning',
    en_progreso: 'badge-info',
    resuelto: 'badge-success',
    'en_proceso': 'badge-info',
    nuevo: 'badge-purple',
    contactado: 'badge-info',
    calificado: 'badge-info',
    propuesta: 'badge-warning',
    negociacion: 'badge-warning',
    ganado: 'badge-success',
    perdido: 'badge-danger',
    recibido: 'badge-success',
    parcial: 'badge-warning',
    presente: 'badge-success',
    falta: 'badge-danger',
    retardo: 'badge-warning',
    permiso: 'badge-info',
    baja: 'badge-info',
    media: 'badge-warning',
    alta: 'badge-danger',
    urgente: 'badge-danger',
    planificado: 'badge-info',
    en_curso: 'badge-warning',
  };
  return map[status] || 'badge-info';
}
