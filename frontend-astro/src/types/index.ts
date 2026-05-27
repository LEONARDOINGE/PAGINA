export interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
  roles: string[];
  permissions: string[];
  employee?: Employee;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  rfc?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  segment: string;
  tags?: string[];
  leadSource?: string;
  lifetimeValue: number;
  healthScore: number;
  active: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  client: Client;
  assignedTo?: User;
  stage: string;
  score: number;
  source?: string;
  interestLevel?: string;
  budget?: number;
  timeline?: string;
  notes?: string;
  convertedAt?: string;
  created_at: string;
}

export interface Quote {
  id: string;
  client: Client;
  user?: User;
  folio: string;
  status: string;
  subtotal: number;
  iva: number;
  total: number;
  discount: number;
  validUntil?: string;
  notes?: string;
  version: number;
  items: QuoteItem[];
  created_at: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  discount?: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  client: Client;
  folio: string;
  rfc?: string;
  nombre?: string;
  status: string;
  subtotal: number;
  iva: number;
  total: number;
  saldo: number;
  fechaEmision?: string;
  fechaPago?: string;
  items: InvoiceItem[];
  payments: Payment[];
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  rating: number;
  paymentTerms?: string;
  leadTimeDays: number;
  active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: Category;
  preferredSupplier?: Supplier;
  price: number;
  cost: number;
  stock: number;
  stockMin: number;
  unit: string;
  type: string;
  strategy: string;
  active: boolean;
  isLowStock: boolean;
  margin: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  manager?: string;
  active: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplier: Supplier;
  folio: string;
  status: string;
  subtotal: number;
  iva: number;
  total: number;
  notes?: string;
  expectedDate?: string;
  receivedAt?: string;
  items: POItem[];
  created_at: string;
}

export interface POItem {
  id: string;
  product?: Product;
  description: string;
  quantity: number;
  receivedQuantity: number;
  price: number;
  subtotal: number;
}

export interface Employee {
  id: string;
  department?: Department;
  position?: Position;
  employeeNumber: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  hireDate: string;
  salary?: number;
  commissionRate?: number;
  active: boolean;
  attendanceRate: number;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  color: string;
  costCenter?: string;
  budget?: number;
  active: boolean;
  employeeCount: number;
  salaryBudget: number;
  employees?: Employee[];
}

export interface Position {
  id: string;
  department?: Department;
  name: string;
  level: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface Attendance {
  id: string;
  employee: Employee;
  date: string;
  clockIn?: string;
  clockOut?: string;
  hoursWorked?: number;
  status: string;
  notes?: string;
}

export interface Leave {
  id: string;
  employee: Employee;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  client?: Client;
  assignedTo?: User;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  category: string;
  slaDeadline?: string;
  resolvedAt?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  client?: Client;
  employee?: Employee;
  title: string;
  type: string;
  date: string;
  time: string;
  duration?: number;
  location?: string;
  status: string;
  notes?: string;
}

export interface ERPDashboard {
  clientsTotal: number;
  clientsActive: number;
  clientsNewThisMonth: number;
  leadsTotal: number;
  leadsByStage: { stage: string; count: number }[];
  quotesTotal: number;
  quotesPending: number;
  invoicesTotal: number;
  invoicesPending: number;
  invoicesPaidThisMonth: number;
  ordersTotal: number;
  ordersPending: number;
  ordersCompleted: number;
  productsTotal: number;
  productsLowStock: number;
  inventoryValue: number;
  employeesTotal: number;
  employeesActive: number;
  attendanceToday: { presentes: number; faltas: number; permisos: number; total: number };
  revenueThisMonth: number;
  revenueLastMonth: number;
  topProducts: { product: Product; totalSold: number; revenue: number }[];
  topClients: { client: Client; totalRevenue: number }[];
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  pipelineValue: { interesadas: number; cotizadas: number; apartadas: number; entregadas: number; totalValue: number };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  readAt?: string;
  priority: string;
}

export interface AuditLog {
  id: string;
  user?: User;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  created_at: string;
}
