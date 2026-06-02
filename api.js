// ============ FOTOTEC API SERVICE ============
// Sistema de comunicación con backend GraphQL/Turso
// FotoTec - Estudio Fotográfico

const API = {
    // ============ CONFIGURACIÓN ============
    ENDPOINT: '/graphql',
    TIMEOUT: 15000,

    // ============ AUTENTICACIÓN ============
    _token: null,
    _user: null,

    setAuth(token, user) {
        this._token = token;
        this._user = user;
        localStorage.setItem('fototec_token', token);
        localStorage.setItem('fototec_user', JSON.stringify(user));
    },

    getAuth() {
        if (!this._token) {
            this._token = localStorage.getItem('fototec_token');
        }
        if (!this._user) {
            const userStr = localStorage.getItem('fototec_user');
            this._user = userStr ? JSON.parse(userStr) : null;
        }
        return { token: this._token, user: this._user };
    },

    clearAuth() {
        this._token = null;
        this._user = null;
        localStorage.removeItem('fototec_token');
        localStorage.removeItem('fototec_user');
    },

    isAuthenticated() {
        return !!this.getAuth().token;
    },

    // ============ HELPER GRAPHQL ============
    async gql(query, variables = {}) {
        const { token } = this.getAuth();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(this.ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query, variables })
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (data.errors) {
            const msg = data.errors[0]?.message || 'Error GraphQL';
            throw new Error(msg);
        }

        return data.data;
    },

    // ============ AUTH MUTATIONS ============
    async login(email, password) {
        const data = await this.gql(`
            mutation Login($email: String!, $password: String!) {
                login(email: $email, password: $password) {
                    token
                    user {
                        id
                        name
                        email
                        roles
                        permissions
                    }
                }
            }
        `, { email, password });

        const { token, user } = data.login;
        const rol = mapRolAPItoLocal(user.roles);
        this.setAuth(token, { ...user, userType: rol });
        return { token, user: { ...user, userType: rol } };
    },

    logout() {
        this.clearAuth();
    },

    // ============ DASHBOARD ============
    async getDashboard() {
        return await this.gql(`
            query {
                erpDashboard {
                    clientsTotal
                    clientsActive
                    clientsNewThisMonth
                    leadsTotal
                    leadsByStage { stage count }
                    quotesTotal
                    quotesPending
                    invoicesTotal
                    invoicesPending
                    invoicesPaidThisMonth
                    ordersTotal
                    ordersPending
                    ordersCompleted
                    productsTotal
                    productsLowStock
                    inventoryValue
                    employeesTotal
                    employeesActive
                    attendanceToday { presentes faltas permisos total }
                    revenueThisMonth
                    revenueLastMonth
                    topProducts { product { id name } totalSold revenue }
                    topClients { client { id name } totalRevenue }
                    monthlyRevenue { month revenue orders }
                    pipelineValue { interesadas cotizadas apartadas entregadas totalValue }
                }
            }
        `);
    },

    // ============ CLIENTES ============
    async getClientes(page = 1, perPage = 20, search = '', segment = '') {
        return await this.gql(`
            query Clientes($page: Int, $perPage: Int, $search: String, $segment: String) {
                clients(page: $page, perPage: $perPage, search: $search, segment: $segment) {
                    data { id name email phone company segment active lifetimeValue createdAt }
                    total
                    page
                    perPage
                }
            }
        `, { page, perPage, search, segment });
    },

    async createCliente(input) {
        return await this.gql(`
            mutation CreateClient($input: ClientInput!) {
                createClient(input: $input) {
                    id name email phone company segment active
                }
            }
        `, { input });
    },

    async updateCliente(id, input) {
        return await this.gql(`
            mutation UpdateClient($id: ID!, $input: ClientInput!) {
                updateClient(id: $id, input: $input) {
                    id name email phone company segment active
                }
            }
        `, { id, input });
    },

    async deleteCliente(id) {
        return await this.gql(`
            mutation DeleteClient($id: ID!) {
                deleteClient(id: $id)
            }
        `, { id });
    },

    // ============ LEADS ============
    async getLeads(search = '', stage = '') {
        return await this.gql(`
            query Leads($search: String, $stage: LeadStage) {
                leads(search: $search, stage: $stage) {
                    id stage score budget source interestLevel timeline notes
                    client { id name email phone }
                    assignedTo { id name }
                    createdAt
                }
            }
        `, { search, stage });
    },

    async convertLead(id, assignedTo = null) {
        return await this.gql(`
            mutation ConvertLead($id: ID!, $assignedTo: ID) {
                convertLead(id: $id, assignedTo: $assignedTo) {
                    id name email phone active
                }
            }
        `, { id, assignedTo });
    },

    // ============ PRODUCTOS ============
    async getProductos(search = '', categoryId = null, lowStock = false) {
        return await this.gql(`
            query Productos($search: String, $categoryId: ID, $lowStock: Boolean) {
                products(search: $search, categoryId: $categoryId, lowStock: $lowStock) {
                    id name description price cost stock stockMin unit type strategy
                    category { id name }
                    isLowStock active createdAt
                }
            }
        `, { search, categoryId, lowStock });
    },

    async createProducto(input) {
        return await this.gql(`
            mutation CreateProduct($input: ProductInput!) {
                createProduct(input: $input) {
                    id name price cost stock type strategy active
                }
            }
        `, { input });
    },

    async updateProducto(id, input) {
        return await this.gql(`
            mutation UpdateProduct($id: ID!, $input: ProductInput!) {
                updateProduct(id: $id, input: $input) {
                    id name price cost stock type strategy active
                }
            }
        `, { id, input });
    },

    async deleteProducto(id) {
        return await this.gql(`
            mutation DeleteProduct($id: ID!) {
                deleteProduct(id: $id)
            }
        `, { id });
    },

    async adjustStock(productId, quantity, type, reason = null) {
        return await this.gql(`
            mutation AdjustStock($productId: ID!, $quantity: Int!, $type: StockMovementType!, $reason: String) {
                adjustStock(productId: $productId, quantity: $quantity, type: $type, reason: $reason) {
                    id quantity type reason
                }
            }
        `, { productId, quantity, type, reason });
    },

    // ============ PROVEEDORES ============
    async getProveedores(search = '') {
        return await this.gql(`
            query Proveedores($search: String) {
                suppliers(search: $search) {
                    id name contactName email phone category rating paymentTerms leadTimeDays active createdAt
                }
            }
        `, { search });
    },

    async createProveedor(input) {
        return await this.gql(`
            mutation CreateSupplier($input: SupplierInput!) {
                createSupplier(input: $input) {
                    id name contactName email phone category active
                }
            }
        `, { input });
    },

    async updateProveedor(id, input) {
        return await this.gql(`
            mutation UpdateSupplier($id: ID!, $input: SupplierInput!) {
                updateSupplier(id: $id, input: $input) {
                    id name contactName email phone category active
                }
            }
        `, { id, input });
    },

    async deleteProveedor(id) {
        return await this.gql(`
            mutation DeleteSupplier($id: ID!) {
                deleteSupplier(id: $id)
            }
        `, { id });
    },

    // ============ EMPLEADOS ============
    async getEmpleados(page = 1, perPage = 20, search = '', departmentId = null, active = true) {
        return await this.gql(`
            query Empleados($page: Int, $perPage: Int, $search: String, $departmentId: ID, $active: Boolean) {
                employees(page: $page, perPage: $perPage, search: $search, departmentId: $departmentId, active: $active) {
                    data {
                        id name email phone position { id name } department { id name }
                        employeeNumber salary active hireDate createdAt
                    }
                    total
                    page
                    perPage
                }
            }
        `, { page, perPage, search, departmentId, active });
    },

    async createEmpleado(input) {
        return await this.gql(`
            mutation CreateEmployee($input: EmployeeInput!) {
                createEmployee(input: $input) {
                    id name email phone employeeNumber salary active hireDate
                }
            }
        `, { input });
    },

    async updateEmpleado(id, input) {
        return await this.gql(`
            mutation UpdateEmployee($id: ID!, $input: EmployeeInput!) {
                updateEmployee(id: $id, input: $input) {
                    id name email phone salary active
                }
            }
        `, { id, input });
    },

    async deactivateEmpleado(id) {
        return await this.gql(`
            mutation DeactivateEmployee($id: ID!) {
                deactivateEmployee(id: $id) {
                    id name active
                }
            }
        `, { id });
    },

    // ============ ASISTENCIA ============
    async getAsistencia(date = null, employeeId = null, month = null, year = null) {
        return await this.gql(`
            query Asistencia($date: Date, $employeeId: ID, $month: Int, $year: Int) {
                attendance(date: $date, employeeId: $employeeId, month: $month, year: $year) {
                    id date clockIn clockOut hoursWorked status notes
                    employee { id name }
                }
            }
        `, { date, employeeId, month, year });
    },

    async clockIn(employeeId) {
        return await this.gql(`
            mutation ClockIn($employeeId: ID!) {
                clockIn(employeeId: $employeeId) {
                    id date clockIn status
                }
            }
        `, { employeeId });
    },

    async clockOut(employeeId) {
        return await this.gql(`
            mutation ClockOut($employeeId: ID!) {
                clockOut(employeeId: $employeeId) {
                    id date clockOut status hoursWorked
                }
            }
        `, { employeeId });
    },

    async recordAttendance(employeeId, input) {
        return await this.gql(`
            mutation RecordAttendance($employeeId: ID!, $input: AttendanceInput!) {
                recordAttendance(employeeId: $employeeId, input: $input) {
                    id date clockIn clockOut status
                }
            }
        `, { employeeId, input });
    },

    // ============ FACTURAS ============
    async getFacturas(clientId = null, status = null) {
        return await this.gql(`
            query Facturas($clientId: ID, $status: InvoiceStatus) {
                invoices(clientId: $clientId, status: $status) {
                    id folio status subtotal iva total saldo
                    client { id name }
                    fechaEmision fechaPago createdAt
                }
            }
        `, { clientId, status });
    },

    async createInvoice(input) {
        return await this.gql(`
            mutation CreateInvoice($input: InvoiceInput!) {
                createInvoice(input: $input) {
                    id folio status total client { id name }
                }
            }
        `, { input });
    },

    async registerPayment(invoiceId, amount, method = 'transferencia') {
        return await this.gql(`
            mutation RegisterPayment($invoiceId: ID!, $amount: Float!, $method: String) {
                registerPayment(invoiceId: $invoiceId, amount: $amount, method: $method) {
                    id amount method paidAt
                }
            }
        `, { invoiceId, amount, method });
    },

    // ============ PEDIDOS COMPRA ============
    async getPurchaseOrders(supplierId = null, status = null) {
        return await this.gql(`
            query PurchaseOrders($supplierId: ID, $status: POStatus) {
                purchaseOrders(supplierId: $supplierId, status: $status) {
                    id folio status subtotal iva total expectedDate receivedAt
                    supplier { id name }
                    items { id description quantity receivedQuantity price subtotal }
                }
            }
        `, { supplierId, status });
    },

    async createPurchaseOrder(input) {
        return await this.gql(`
            mutation CreatePO($input: POInput!) {
                createPurchaseOrder(input: $input) {
                    id folio status total
                }
            }
        `, { input });
    },

    // ============ USUARIOS ============
    async getUsuarios() {
        return await this.gql(`
            query {
                users {
                    id name email active roles createdAt
                }
            }
        `);
    },

    async createUsuario(input) {
        return await this.gql(`
            mutation CreateUser($input: UserInput!) {
                createUser(input: $input) {
                    id name email active roles
                }
            }
        `, { input });
    },

    async updateUsuario(id, input) {
        return await this.gql(`
            mutation UpdateUser($id: ID!, $name: String, $email: String, $password: String, $role: UserRole) {
                updateUser(id: $id, name: $name, email: $email, password: $password, role: $role) {
                    id name email active roles
                }
            }
        `, { id, ...input });
    },

    async deleteUsuario(id) {
        return await this.gql(`
            mutation DeleteUser($id: ID!) {
                deleteUser(id: $id)
            }
        `, { id });
    },

    // ============ COTIZACIONES ============
    async getCotizaciones(clientId = null) {
        return await this.gql(`
            query Cotizaciones($clientId: ID) {
                quotes(clientId: $clientId) {
                    id folio status subtotal iva total validUntil createdAt
                    client { id name }
                    items { id description quantity price subtotal }
                }
            }
        `, { clientId });
    },

    async createCotizacion(input) {
        return await this.gql(`
            mutation CreateQuote($input: QuoteInput!) {
                createQuote(input: $input) {
                    id folio status total
                }
            }
        `, { input });
    },

    async convertQuoteToInvoice(quoteId) {
        return await this.gql(`
            mutation ConvertQuote($quoteId: ID!) {
                convertQuoteToInvoice(quoteId: $quoteId) {
                    id folio status total
                }
            }
        `, { quoteId });
    },

    // ============ DEPARTAMENTOS Y PUESTOS ============
    async getDepartamentos() {
        return await this.gql(`
            query {
                departments {
                    id name code color manager { id name }
                    employeeCount salaryBudget active
                }
            }
        `);
    },

    async getPuestos(departmentId = null) {
        return await this.gql(`
            query Puestos($departmentId: ID) {
                positions(departmentId: $departmentId) {
                    id name level minSalary maxSalary
                    department { id name }
                }
            }
        `, { departmentId });
    },

    // ============ NOTIFICACIONES ============
    async getNotificaciones(unreadOnly = false) {
        return await this.gql(`
            query Notificaciones($unreadOnly: Boolean) {
                notifications(unreadOnly: $unreadOnly) {
                    id type title message link readAt priority createdAt
                }
            }
        `, { unreadOnly });
    },

    async getNotificationCount() {
        return await this.gql(`
            query {
                notificationCount
            }
        `);
    },

    // ============ AUDITORÍA ============
    async getAuditLogs(entityType = null, limit = 50) {
        return await this.gql(`
            query AuditLogs($entityType: String, $limit: Int) {
                auditLogs(entityType: $entityType, limit: $limit) {
                    id action entityType entityId oldValues newValues
                    user { id name }
                    createdAt
                }
            }
        `, { entityType, limit });
    }
};

// ============ MAPEO DE ROLES ============
function mapRolAPItoLocal(roles) {
    if (!roles || !Array.isArray(roles)) return 'cliente';
    if (roles.includes('super_admin')) return 'administrador';
    if (roles.includes('coordinador_rrhh')) return 'rh';
    if (roles.includes('coordinador_scm')) return 'compras';
    if (roles.includes('gerente_ventas')) return 'administrador';
    return 'cliente';
}

function mapRolLocalToAPI(localRole) {
    const map = {
        'administrador': 'super_admin',
        'rh': 'coordinador_rrhh',
        'compras': 'coordinador_scm',
        'proveedores': 'coordinador_scm',
        'cliente': 'cliente'
    };
    return map[localRole] || 'empleado';
}

// ============ REAL-TIME SUBSCRIPTIONS (polling) ============
const Realtime = {
    _intervals: {},

    start(module, callback, intervalMs = 10000) {
        this.stop(module);
        this._intervals[module] = setInterval(async () => {
            try {
                await callback();
            } catch (e) {
                console.error(`Realtime [${module}] error:`, e);
            }
        }, intervalMs);
    },

    stop(module) {
        if (this._intervals[module]) {
            clearInterval(this._intervals[module]);
            delete this._intervals[module];
        }
    },

    stopAll() {
        Object.keys(this._intervals).forEach(k => this.stop(k));
    }
};

// ============ EXPORTAR ============
window.API = API;
window.Realtime = Realtime;
window.mapRolAPItoLocal = mapRolAPItoLocal;
window.mapRolLocalToAPI = mapRolLocalToAPI;
