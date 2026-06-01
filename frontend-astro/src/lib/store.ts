import type { ERPDashboard, Notification, Client, Product, Employee, Invoice, Lead } from '../types';
import { apiGet, apiPost } from './api';

type Listener<T> = (data: T) => void;

class Store<T> {
  protected listeners: Set<Listener<T>> = new Set();
  protected data: T | null = null;

  subscribe(fn: Listener<T>) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  protected emit(data: T) {
    this.data = data;
    this.listeners.forEach(fn => fn(data));
  }

  get(): T | null { return this.data; }
}

class DashboardStore extends Store<any> {
  async fetch() {
    const data = await apiGet<any>('/api/stats/kpis');
    const erpDashboard: any = {
      revenueThisMonth: data.revenueThisMonth || 0,
      revenueCollected: data.revenueThisMonth || 0,
      totalClients: data.totalClients || 0,
      totalEmployees: data.totalEmployees || 0,
      productsTotal: data.totalProducts || 0,
      productsLowStock: data.lowStockProducts || 0,
      invoicesPending: data.pendingInvoices || 0,
      openTickets: data.openTickets || 0,
    };
    this.emit(erpDashboard);
    return erpDashboard;
  }
}

class ClientsStore extends Store<Client[]> {
  async fetch(page = 1, perPage = 20, search = '', segment = '') {
    const data = await apiGet<{ data: Client[]; total: number }>('/graphql', {
      query: `query { clients(page:${page},perPage:${perPage},search:"${search}",segment:"${segment}") { data { id name email phone company segment lifetime_value active created_at } total page perPage } }`
    });
    this.emit(data.data);
    return data;
  }
}

class ProductsStore extends Store<Product[]> {
  async fetch(search = '', lowStock = false) {
    const data = await apiGet<any>('/graphql', {
      query: `query { products(search:"${search}",lowStock:${lowStock}) { id sku name price cost stock min_stock unit category_id active } }`
    });
    this.emit(data.products || []);
    return data.products || [];
  }
}

class EmployeesStore extends Store<Employee[]> {
  async fetch(page = 1, perPage = 20, search = '', active = true) {
    const data = await apiGet<any[]>('/graphql', {
      query: `query { employees(page:${page},perPage:${perPage},search:"${search}",active:${active}) { id employee_number name email phone hire_date salary active dept_name position_name } }`
    });
    this.emit(data.employees || []);
    return data.employees || [];
  }
}

class NotificationsStore extends Store<Notification[]> {
  async fetch(unreadOnly = false) {
    const data = await apiGet<Notification[]>('/graphql', {
      query: `query { notifications(unreadOnly:${unreadOnly}) { id type title message link read_at priority created_at } }`
    });
    this.emit(data.notifications || []);
    return data.notifications || [];
  }

  async markRead(id: string) {
    // Workers backend uses a different approach
    this.data = this.data?.filter(n => n.id !== id) ?? null;
  }
}

export const dashboardStore = new DashboardStore();
export const clientsStore = new ClientsStore();
export const productsStore = new ProductsStore();
export const employeesStore = new EmployeesStore();
export const notificationsStore = new NotificationsStore();
