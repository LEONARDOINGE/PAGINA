// ============ FOTOTEC API SERVICE ============
// Sistema de comunicación con backend GraphQL/Turso
// FotoTec - Estudio Fotográfico

const API = {
    // ============ CONFIGURACIÓN ============
    ENDPOINT: '/graphql',
    TIMEOUT: 15000,
    _mode: 'local',

    // ============ MODO ============
    setMode(mode) {
        this._mode = mode;
    },

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
        try {
            const { token } = this.getAuth();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(this.ENDPOINT, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query, variables })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (data.errors) throw new Error(data.errors[0]?.message || 'Error GraphQL');

            this._mode = 'api';
            return data.data;
        } catch (e) {
            this._mode = 'local';
            throw e;
        }
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
    if (!roles) return 'cliente';
    let rolArray = roles;
    if (typeof rolArray === 'string') rolArray = [rolArray];
    if (!Array.isArray(rolArray)) return 'cliente';
    if (rolArray.includes('admin') || rolArray.includes('super_admin') || rolArray.includes('Administrador')) return 'administrador';
    if (rolArray.includes('coordinador_rrhh') || rolArray.includes('rh') || rolArray.includes('Recursos Humanos')) return 'rh';
    if (rolArray.includes('coordinador_scm') || rolArray.includes('compras') || rolArray.includes('Compras')) return 'compras';
    if (rolArray.includes('proveedores') || rolArray.includes('Proveedores')) return 'proveedores';
    if (rolArray.includes('gerente_ventas')) return 'administrador';
    return 'cliente';
}

function mapRolLocalToAPI(localRole) {
    const map = {
        'administrador': 'admin',
        'rh': 'rh',
        'compras': 'compras',
        'proveedores': 'proveedores',
        'cliente': 'cliente'
    };
    return map[localRole] || 'cliente';
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

// ============ MODO LOCAL (fallback) ============
const LocalDB = {
    _key: 'fototec_local_db',

    _init() {
        const db = this._get();
        if (!db.empleados) {
            db.empleados = [
                { id: 1, name: 'María López', email: 'maria@fototec.com', phone: '8991234567', position: { id: 1, name: 'Fotógrafa' }, department: { id: 1, name: 'Producción' }, employeeNumber: 'EMP-0001', salary: 15000, active: true, hireDate: '2023-01-15' },
                { id: 2, name: 'Carlos García', email: 'carlos@fototec.com', phone: '8992345678', position: { id: 2, name: 'Editor' }, department: { id: 2, name: 'Post-producción' }, employeeNumber: 'EMP-0002', salary: 12000, active: true, hireDate: '2023-03-01' },
                { id: 3, name: 'Ana Martínez', email: 'ana@fototec.com', phone: '8993456789', position: { id: 3, name: 'Asistente' }, department: { id: 1, name: 'Producción' }, employeeNumber: 'EMP-0003', salary: 10000, active: true, hireDate: '2023-06-15' },
            ];
            db.proveedores = [
                { id: 1, name: 'Papeles del Norte', contactName: 'Juan Pérez', email: 'juan@papelesnorte.com', phone: '8991112222', category: 'papel', rating: 4.5, active: true },
                { id: 2, name: 'Tintas Express', contactName: 'Laura Sánchez', email: 'laura@tintasexpress.com', phone: '8993334444', category: 'tintas', rating: 4.0, active: true },
                { id: 3, name: 'Equipo Fotográfico MX', contactName: 'Roberto Torres', email: 'roberto@equipofoto.com', phone: '8995556666', category: 'equipo', rating: 5.0, active: true },
            ];
            db.productos = [
                { id: 1, name: 'Sesión Retrato Profesional', description: 'Sesión en estudio con fondo', price: 800, cost: 200, stock: 999, unit: 'sesión', type: 'servicio', strategy: 'pull', category: { id: 1, name: 'Estudio' }, isLowStock: false, active: true },
                { id: 2, name: 'Sesión Boda Completa', description: 'Cobertura 5 horas + edición', price: 4500, cost: 1000, stock: 999, unit: 'sesión', type: 'servicio', strategy: 'pull', category: { id: 2, name: 'Boda' }, isLowStock: false, active: true },
                { id: 3, name: 'Papel Fotográfico Glossy 4x6', description: 'Paquete 50 hojas', price: 350, cost: 150, stock: 45, unit: 'paquete', type: 'producto', strategy: 'push', category: { id: 3, name: 'Impresiones' }, isLowStock: false, active: true },
                { id: 4, name: 'Tinta EPSON SureColor', description: 'Cartucho T3180XL', price: 1200, cost: 800, stock: 8, unit: 'cartucho', type: 'producto', strategy: 'push', category: { id: 4, name: 'Tintas' }, isLowStock: true, active: true },
            ];
            db.clientes = [
                { id: 1, name: 'Sofia Hernández', email: 'sofia@email.com', phone: '8997778888', company: '', segment: 'particular', active: true, lifetimeValue: 2500 },
                { id: 2, name: 'Grupo VIDAC', email: 'contacto@vidac.com', phone: '8999990000', company: 'Grupo VIDAC', segment: 'corporativo', active: true, lifetimeValue: 15000 },
            ];
            db.leads = [
                { id: 1, client: { id: 1, name: 'Pedro Jiménez', email: 'pedro@email.com', phone: '8995551234' }, stage: 'nuevo', score: 85, budget: 5000, source: 'Instagram', interestLevel: 'alto' },
                { id: 2, client: { id: 2, name: 'Karla López', email: 'karla@email.com', phone: '8996667777' }, stage: 'contactado', score: 60, budget: 3000, source: 'Facebook', interestLevel: 'medio' },
            ];
            db.users = [
                { id: 1, name: 'Admin', email: 'admin@fototec.com', active: true, roles: ['super_admin'] },
                { id: 2, name: 'RH Manager', email: 'rh@fototec.com', active: true, roles: ['coordinador_rrhh'] },
                { id: 3, name: 'Compras', email: 'compras@fototec.com', active: true, roles: ['coordinador_scm'] },
            ];
            this._save(db);
        }
        return db;
    },

    _get() {
        return JSON.parse(localStorage.getItem(this._key) || '{}');
    },

    _save(db) {
        localStorage.setItem(this._key, JSON.stringify(db));
    }
};

const LocalAPI = {
    login(email, password) {
        LocalDB._init();
        const db = LocalDB._get();
        const user = db.users.find(u => u.email === email);
        if (!user || password.length < 4) throw new Error('Credenciales inválidas');

        const token = 'local-token-' + Date.now();
        const rol = mapRolAPItoLocal(user.roles);
        API.setAuth(token, { ...user, userType: rol });
        return { token, user: { ...user, userType: rol } };
    },

    getDashboard() {
        LocalDB._init();
        const db = LocalDB._get();
        return {
            erpDashboard: {
                clientsTotal: db.clientes?.length || 0,
                clientsActive: db.clientes?.filter(c => c.active).length || 0,
                clientsNewThisMonth: 1,
                leadsTotal: db.leads?.length || 0,
                leadsByStage: [{ stage: 'nuevo', count: 1 }, { stage: 'contactado', count: 1 }],
                invoicesTotal: 45000,
                invoicesPending: 12000,
                invoicesPaidThisMonth: 18500,
                ordersTotal: 28,
                ordersPending: 5,
                ordersCompleted: 23,
                productsTotal: db.productos?.length || 0,
                productsLowStock: db.productos?.filter(p => p.isLowStock).length || 0,
                inventoryValue: 45000,
                employeesTotal: db.empleados?.length || 0,
                employeesActive: db.empleados?.filter(e => e.active).length || 0,
                attendanceToday: { presentes: 3, faltas: 0, permisos: 0, total: 3 },
                revenueThisMonth: 18500,
                revenueLastMonth: 15200,
                topProducts: (db.productos || []).slice(0, 3).map(p => ({ product: { id: p.id, name: p.name }, totalSold: Math.floor(Math.random() * 20) + 5, revenue: p.price * Math.floor(Math.random() * 20) + 5 })),
                topClients: (db.clientes || []).slice(0, 2).map(c => ({ client: { id: c.id, name: c.name }, totalRevenue: c.lifetimeValue || 0 })),
                monthlyRevenue: [
                    { month: 'Ene 2026', revenue: 12000, orders: 8 },
                    { month: 'Feb 2026', revenue: 15000, orders: 12 },
                    { month: 'Mar 2026', revenue: 18500, orders: 15 },
                ],
                pipelineValue: { interesadas: 3, cotizadas: 2, apartadas: 1, entregadas: 5, totalValue: 45000 }
            }
        };
    },

    getEmpleados(page = 1, perPage = 50, search = '', departmentId = null, active = true) {
        LocalDB._init();
        const db = LocalDB._get();
        let list = db.empleados || [];
        if (search) list = list.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
        return { employees: { data: list, total: list.length, page, perPage } };
    },

    getProveedores(search = '') {
        LocalDB._init();
        const db = LocalDB._get();
        let list = db.proveedores || [];
        if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        return { suppliers: list };
    },

    getProductos(search = '', categoryId = null, lowStock = false) {
        LocalDB._init();
        const db = LocalDB._get();
        let list = db.productos || [];
        if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        if (lowStock) list = list.filter(p => p.isLowStock);
        return { products: list };
    },

    getClientes(page = 1, perPage = 50, search = '', segment = '') {
        LocalDB._init();
        const db = LocalDB._get();
        let list = db.clientes || [];
        if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
        return { clients: { data: list, total: list.length, page, perPage } };
    },

    getLeads() {
        LocalDB._init();
        const db = LocalDB._get();
        return { leads: db.leads || [] };
    },

    getCotizaciones() {
        return { quotes: [] };
    },

    getFacturas() {
        return { invoices: [] };
    },

    getPurchaseOrders() {
        return { purchaseOrders: [] };
    },

    getDepartamentos() {
        return { departments: [] };
    },

    getUsuarios() {
        LocalDB._init();
        const db = LocalDB._get();
        return { users: db.users || [] };
    },

    getAsistencia() {
        return { attendance: [] };
    },

    createEmpleado(input) {
        LocalDB._init();
        const db = LocalDB._get();
        const emp = { id: Date.now(), employeeNumber: 'EMP-' + String(db.empleados.length + 1).padStart(4, '0'), ...input, active: true };
        db.empleados.push(emp);
        LocalDB._save(db);
        return { createEmployee: emp };
    },

    updateEmpleado(id, input) {
        LocalDB._init();
        const db = LocalDB._get();
        const idx = db.empleados.findIndex(e => e.id == id);
        if (idx >= 0) { db.empleados[idx] = { ...db.empleados[idx], ...input }; LocalDB._save(db); }
        return { updateEmployee: db.empleados[idx] };
    },

    createProveedor(input) {
        LocalDB._init();
        const db = LocalDB._get();
        const prov = { id: Date.now(), rating: 5.0, active: true, ...input };
        db.proveedores.push(prov);
        LocalDB._save(db);
        return { createSupplier: prov };
    },

    updateProveedor(id, input) {
        LocalDB._init();
        const db = LocalDB._get();
        const idx = db.proveedores.findIndex(p => p.id == id);
        if (idx >= 0) { db.proveedores[idx] = { ...db.proveedores[idx], ...input }; LocalDB._save(db); }
        return { updateSupplier: db.proveedores[idx] };
    },

    createProducto(input) {
        LocalDB._init();
        const db = LocalDB._get();
        const prod = { id: Date.now(), stock: 0, isLowStock: false, active: true, ...input };
        db.productos.push(prod);
        LocalDB._save(db);
        return { createProduct: prod };
    },

    updateProducto(id, input) {
        LocalDB._init();
        const db = LocalDB._get();
        const idx = db.productos.findIndex(p => p.id == id);
        if (idx >= 0) { db.productos[idx] = { ...db.productos[idx], ...input }; LocalDB._save(db); }
        return { updateProduct: db.productos[idx] };
    },

    createCliente(input) {
        LocalDB._init();
        const db = LocalDB._get();
        const cli = { id: Date.now(), active: true, lifetimeValue: 0, ...input };
        db.clientes.push(cli);
        LocalDB._save(db);
        return { createClient: cli };
    },

    updateCliente(id, input) {
        LocalDB._init();
        const db = LocalDB._get();
        const idx = db.clientes.findIndex(c => c.id == id);
        if (idx >= 0) { db.clientes[idx] = { ...db.clientes[idx], ...input }; LocalDB._save(db); }
        return { updateClient: db.clientes[idx] };
    },

    convertLead(id) {
        LocalDB._init();
        const db = LocalDB._get();
        const lead = db.leads.find(l => l.id == id);
        if (lead) { lead.stage = 'ganado'; LocalDB._save(db); }
        return { convertLead: lead?.client };
    },

    getNotificaciones() { return { notifications: [] }; },
    getNotificationCount() { return { notificationCount: 0 }; },
    getAuditLogs() { return { auditLogs: [] }; }
};

// ============ WRAPPER API CON FALLBACK ============
const APIWrapper = {
    async login(email, password) {
        try { return await API.login(email, password); }
        catch { return LocalAPI.login(email, password); }
    },
    async getDashboard() {
        try { return await API.getDashboard(); }
        catch { return LocalAPI.getDashboard(); }
    },
    async getEmpleados(...args) {
        try { return await API.getEmpleados(...args); }
        catch { return LocalAPI.getEmpleados(...args); }
    },
    async getProveedores(...args) {
        try { return await API.getProveedores(...args); }
        catch { return LocalAPI.getProveedores(...args); }
    },
    async getProductos(...args) {
        try { return await API.getProductos(...args); }
        catch { return LocalAPI.getProductos(...args); }
    },
    async getClientes(...args) {
        try { return await API.getClientes(...args); }
        catch { return LocalAPI.getClientes(...args); }
    },
    async getLeads() {
        try { return await API.getLeads(); }
        catch { return LocalAPI.getLeads(); }
    },
    async getCotizaciones() {
        try { return await API.getCotizaciones(); }
        catch { return LocalAPI.getCotizaciones(); }
    },
    async getFacturas() {
        try { return await API.getFacturas(); }
        catch { return LocalAPI.getFacturas(); }
    },
    async getPurchaseOrders() {
        try { return await API.getPurchaseOrders(); }
        catch { return LocalAPI.getPurchaseOrders(); }
    },
    async getDepartamentos() {
        try { return await API.getDepartamentos(); }
        catch { return LocalAPI.getDepartamentos(); }
    },
    async getUsuarios() {
        try { return await API.getUsuarios(); }
        catch { return LocalAPI.getUsuarios(); }
    },
    async getAsistencia() {
        try { return await API.getAsistencia(); }
        catch { return LocalAPI.getAsistencia(); }
    },
    async createEmpleado(...args) {
        try { return await API.createEmpleado(...args); }
        catch { return LocalAPI.createEmpleado(...args); }
    },
    async updateEmpleado(...args) {
        try { return await API.updateEmpleado(...args); }
        catch { return LocalAPI.updateEmpleado(...args); }
    },
    async createProveedor(...args) {
        try { return await API.createProveedor(...args); }
        catch { return LocalAPI.createProveedor(...args); }
    },
    async updateProveedor(...args) {
        try { return await API.updateProveedor(...args); }
        catch { return LocalAPI.updateProveedor(...args); }
    },
    async createProducto(...args) {
        try { return await API.createProducto(...args); }
        catch { return LocalAPI.createProducto(...args); }
    },
    async updateProducto(...args) {
        try { return await API.updateProducto(...args); }
        catch { return LocalAPI.updateProducto(...args); }
    },
    async createCliente(...args) {
        try { return await API.createCliente(...args); }
        catch { return LocalAPI.createCliente(...args); }
    },
    async updateCliente(...args) {
        try { return await API.updateCliente(...args); }
        catch { return LocalAPI.updateCliente(...args); }
    },
    async convertLead(...args) {
        try { return await API.convertLead(...args); }
        catch { return LocalAPI.convertLead(...args); }
    },
    async registerPayment(...args) {
        try { return await API.registerPayment(...args); }
        catch { }
    },
    async createInvoice(...args) {
        try { return await API.createInvoice(...args); }
        catch { }
    },
    logout() { API.logout(); },
    isAuthenticated() { return API.isAuthenticated(); },
    getAuth() { return API.getAuth(); }
};

// ============ EXPORTAR ============
window.API = APIWrapper;
window.Realtime = Realtime;
window.mapRolAPItoLocal = mapRolAPItoLocal;
window.mapRolLocalToAPI = mapRolLocalToAPI;
window.LocalAPI = LocalAPI;
window.LocalDB = LocalDB;
