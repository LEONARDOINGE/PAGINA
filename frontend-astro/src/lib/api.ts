const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/graphql';

export async function gql<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const token = localStorage.getItem('fototec_token');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
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
  if (user.roles?.includes('super_admin')) return true;
  return user.permissions?.includes(perm) ?? false;
}

export function hasRole(role: string): boolean {
  const user = getUser();
  return user?.roles?.includes(role) ?? false;
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
    resueltp: 'badge-success',
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
  };
  return map[status] || 'badge-info';
}
