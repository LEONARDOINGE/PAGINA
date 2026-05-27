import type { ERPDashboard, Notification, Client, Product, Employee, Invoice, Lead } from '../types';

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

class DashboardStore extends Store<ERPDashboard> {
  async fetch() {
    const { gql } = await import('../lib/api');
    const data = await gql<{ erpDashboard: ERPDashboard }>(`
      query {
        erpDashboard {
          clientsTotal clientsActive clientsNewThisMonth
          leadsTotal quotesTotal quotesPending
          invoicesTotal invoicesPending invoicesPaidThisMonth
          ordersTotal ordersPending ordersCompleted
          productsTotal productsLowStock inventoryValue
          employeesTotal employeesActive
          attendanceToday { presentes faltas permisos total }
          revenueThisMonth revenueLastMonth
          leadsByStage { stage count }
          monthlyRevenue { month revenue orders }
          topProducts { totalSold revenue product { id sku name price stock } }
          topClients { totalRevenue client { id name email } }
          pipelineValue { interesadas cotizadas apartadas entregadas totalValue }
        }
      }
    `);
    this.emit(data.erpDashboard);
    return data.erpDashboard;
  }
}

class ClientsStore extends Store<Client[]> {
  async fetch(page = 1, perPage = 20, search = '', segment = '') {
    const { gql } = await import('../lib/api');
    const data = await gql<{ clients: { data: Client[]; total: number } }>(`
      query Clients($page: Int, $perPage: Int, $search: String, $segment: String) {
        clients(page: $page, perPage: $perPage, search: $search, segment: $segment) {
          data { id name email phone company segment lifetimeValue healthScore active created_at }
          total page perPage
        }
      }
    `, { page, perPage, search, segment });
    this.emit(data.clients.data);
    return data.clients;
  }
}

class ProductsStore extends Store<Product[]> {
  async fetch(search = '', lowStock = false) {
    const { gql } = await import('../lib/api');
    const data = await gql<{ products: Product[] }>(`
      query Products($search: String, $lowStock: Boolean) {
        products(search: $search, lowStock: $lowStock) {
          id sku name price cost stock stockMin unit type strategy active margin
          category { id name } preferredSupplier { id name }
        }
      }
    `, { search, lowStock });
    this.emit(data.products);
    return data.products;
  }
}

class EmployeesStore extends Store<Employee[]> {
  async fetch(page = 1, perPage = 20, search = '', active = true) {
    const { gql } = await import('../lib/api');
    const data = await gql<{ employees: { data: Employee[]; total: number } }>(`
      query Employees($page: Int, $perPage: Int, $search: String, $active: Boolean) {
        employees(page: $page, perPage: $perPage, search: $search, active: $active) {
          data { id employeeNumber name email phone hireDate salary commissionRate active attendanceRate
            department { id name color } position { id name }
          }
          total page perPage
        }
      }
    `, { page, perPage, search, active });
    this.emit(data.employees.data);
    return data.employees;
  }
}

class NotificationsStore extends Store<Notification[]> {
  async fetch(unreadOnly = false) {
    const { gql } = await import('../lib/api');
    const data = await gql<{ notifications: Notification[] }>(`
      query Notifications($unreadOnly: Boolean) {
        notifications(unreadOnly: $unreadOnly) { id type title message link readAt priority }
      }
    `, { unreadOnly });
    this.emit(data.notifications);
    return data.notifications;
  }

  async markRead(id: string) {
    const { gql } = await import('../lib/api');
    await gql(`mutation { markNotificationRead(id: "${id}") { id } }`);
    this.data = this.data?.filter(n => n.id !== id) ?? null;
  }
}

export const dashboardStore = new DashboardStore();
export const clientsStore = new ClientsStore();
export const productsStore = new ProductsStore();
export const employeesStore = new EmployeesStore();
export const notificationsStore = new NotificationsStore();
