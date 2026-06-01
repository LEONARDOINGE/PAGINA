-- FotoTec ERP - D1 Schema (no FK)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, avatar TEXT, phone TEXT,
  role TEXT NOT NULL DEFAULT 'cliente', active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT,
  type TEXT DEFAULT 'string', updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT,
  permissions TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT,
  company TEXT, address TEXT, city TEXT, state TEXT, country TEXT DEFAULT 'MX',
  rfc TEXT, segment TEXT, industry TEXT, website TEXT, notes TEXT,
  lifetime_value REAL DEFAULT 0, tags TEXT, assigned_to TEXT,
  user_id TEXT, source TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT,
  company TEXT, stage TEXT NOT NULL DEFAULT 'nuevo', source TEXT,
  probability INTEGER DEFAULT 0, estimated_value REAL DEFAULT 0, notes TEXT,
  converted_at TEXT, assigned_to TEXT, client_id TEXT, user_id TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY, folio TEXT UNIQUE NOT NULL, client_id TEXT, user_id TEXT,
  status TEXT NOT NULL DEFAULT 'borrador', subtotal REAL NOT NULL DEFAULT 0,
  tax_rate REAL DEFAULT 16, tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
  valid_until TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY, quote_id TEXT NOT NULL, product_id TEXT,
  description TEXT NOT NULL, quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, folio TEXT UNIQUE NOT NULL, client_id TEXT, quote_id TEXT, user_id TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente', subtotal REAL NOT NULL DEFAULT 0,
  tax_rate REAL DEFAULT 16, tax_amount REAL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
  paid_amount REAL DEFAULT 0, fecha_emision TEXT, fecha_vencimiento TEXT,
  payment_method TEXT, payment_reference TEXT, notes TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1, unit_price REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, amount REAL NOT NULL,
  method TEXT, reference TEXT, date TEXT NOT NULL, notes TEXT,
  user_id TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, contact_name TEXT, email TEXT, phone TEXT,
  address TEXT, city TEXT, state TEXT, country TEXT DEFAULT 'MX', rfc TEXT,
  category TEXT, rating INTEGER DEFAULT 3, notes TEXT, user_id TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
  parent_id TEXT, color TEXT DEFAULT '#8b5cf6', created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT,
  category_id TEXT, price REAL NOT NULL DEFAULT 0, cost REAL DEFAULT 0,
  stock INTEGER DEFAULT 0, min_stock INTEGER DEFAULT 5, unit TEXT DEFAULT 'pieza',
  image_url TEXT, active INTEGER NOT NULL DEFAULT 1, user_id TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, city TEXT, state TEXT,
  is_default INTEGER DEFAULT 0, capacity INTEGER, notes TEXT, user_id TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL, warehouse_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL, warehouse_id TEXT, type TEXT NOT NULL,
  quantity INTEGER NOT NULL, reason TEXT, reference TEXT, user_id TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY, folio TEXT UNIQUE NOT NULL, supplier_id TEXT NOT NULL, user_id TEXT,
  status TEXT NOT NULL DEFAULT 'borrador', subtotal REAL DEFAULT 0, tax_amount REAL DEFAULT 0,
  total REAL DEFAULT 0, expected_date TEXT, received_date TEXT, notes TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY, purchase_order_id TEXT NOT NULL, product_id TEXT,
  description TEXT NOT NULL, quantity INTEGER NOT NULL, received INTEGER DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT UNIQUE, color TEXT DEFAULT '#8b5cf6',
  parent_id TEXT, manager_id TEXT, budget REAL, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, department_id TEXT NOT NULL,
  level TEXT DEFAULT 'operativo', salary_min REAL, salary_max REAL,
  description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY, employee_number TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  email TEXT, phone TEXT, rfc TEXT, curp TEXT, nss TEXT, address TEXT, city TEXT, state TEXT,
  birth_date TEXT, hire_date TEXT, termination_date TEXT, department_id TEXT, position_id TEXT,
  manager_id TEXT, salary REAL, pay_type TEXT DEFAULT 'mensual', photo_url TEXT,
  emergency_contact TEXT, emergency_phone TEXT, active INTEGER DEFAULT 1, user_id TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, date TEXT NOT NULL,
  clock_in TEXT, clock_out TEXT, status TEXT DEFAULT 'presente',
  hours_worked REAL, notes TEXT, user_id TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, type TEXT NOT NULL,
  start_date TEXT NOT NULL, end_date TEXT NOT NULL, days INTEGER NOT NULL,
  reason TEXT, status TEXT DEFAULT 'pendiente', approved_by TEXT, approved_at TEXT,
  notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trainings (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, instructor TEXT,
  department_id TEXT, start_date TEXT, end_date TEXT, duration_hours INTEGER,
  location TEXT, max_participants INTEGER DEFAULT 20, cost REAL DEFAULT 0,
  status TEXT DEFAULT 'planificado', user_id TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id TEXT PRIMARY KEY, training_id TEXT NOT NULL, employee_id TEXT NOT NULL,
  status TEXT DEFAULT 'registrado', score REAL, completed_at TEXT, notes TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, reviewer_id TEXT, period TEXT,
  review_date TEXT NOT NULL, overall_score REAL, punctuality REAL, productivity REAL,
  quality REAL, teamwork REAL, initiative REAL, comments TEXT, goals TEXT,
  user_id TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, client_id TEXT,
  employee_id TEXT, start_time TEXT NOT NULL, end_time TEXT, location TEXT, type TEXT,
  status TEXT DEFAULT 'programada', reminder_sent INTEGER DEFAULT 0, user_id TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY, folio TEXT UNIQUE NOT NULL, title TEXT NOT NULL, description TEXT,
  client_id TEXT, assigned_to TEXT, priority TEXT DEFAULT 'media',
  status TEXT DEFAULT 'abierto', category TEXT, sla_deadline TEXT, resolved_at TEXT,
  rating INTEGER, user_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT, status TEXT DEFAULT 'borrador',
  start_date TEXT, end_date TEXT, budget REAL, spent REAL DEFAULT 0,
  target_audience TEXT, description TEXT, user_id TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT, questions TEXT,
  active INTEGER DEFAULT 1, user_id TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
  entity_type TEXT, entity_id TEXT, due_date TEXT, completed INTEGER DEFAULT 0,
  assigned_to TEXT, user_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY, content TEXT NOT NULL, entity_type TEXT, entity_id TEXT,
  user_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT DEFAULT 'info',
  title TEXT NOT NULL, message TEXT, link TEXT, read_at TEXT,
  priority TEXT DEFAULT 'normal', created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT,
  old_data TEXT, new_data TEXT, ip_address TEXT, user_id TEXT, created_at TEXT NOT NULL
);

-- Seed Data
INSERT INTO users (id, name, email, password, role, active, created_at, updated_at) VALUES ('u1','Administrador','admin@fototec.com','$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qVIeNhLfF3vFy.','super_admin',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO roles (id, name, description, permissions, created_at) VALUES ('r1','super_admin','Administrador del sistema','["*"]','2026-01-01T00:00:00Z');
INSERT INTO roles (id, name, description, permissions, created_at) VALUES ('r2','gerente_ventas','Gerente de ventas','["crm.*","reports.view","users.view"]','2026-01-01T00:00:00Z');
INSERT INTO roles (id, name, description, permissions, created_at) VALUES ('r3','coordinador_scm','Coordinador SCM','["scm.*","reports.view"]','2026-01-01T00:00:00Z');
INSERT INTO roles (id, name, description, permissions, created_at) VALUES ('r4','coordinador_rrhh','Coordinador RRHH','["rh.*","reports.view"]','2026-01-01T00:00:00Z');
INSERT INTO roles (id, name, description, permissions, created_at) VALUES ('r5','empleado','Empleado basico','["crm.view","rh.view.own"]','2026-01-01T00:00:00Z');
INSERT INTO roles (id, name, description, permissions, created_at) VALUES ('r6','cliente','Cliente portal','["portal.*"]','2026-01-01T00:00:00Z');
INSERT INTO settings (id, key, value, type, updated_at) VALUES ('set1','company_name','FotoTec Reynosa','string','2026-01-01T00:00:00Z');
INSERT INTO settings (id, key, value, type, updated_at) VALUES ('set2','iva_rate','16','number','2026-01-01T00:00:00Z');
INSERT INTO settings (id, key, value, type, updated_at) VALUES ('set3','currency','MXN','string','2026-01-01T00:00:00Z');
INSERT INTO departments (id, name, code, color, created_at) VALUES ('d6','Admin','ADMIN','#6b7280','2026-01-01T00:00:00Z');
INSERT INTO departments (id, name, code, color, created_at) VALUES ('d1','Ventas','VENT','#3b82f6','2026-01-01T00:00:00Z');
INSERT INTO departments (id, name, code, color, created_at) VALUES ('d2','SCM / Almacen','SCMM','#10b981','2026-01-01T00:00:00Z');
INSERT INTO departments (id, name, code, color, created_at) VALUES ('d3','Recursos Humanos','RRHH','#ef4444','2026-01-01T00:00:00Z');
INSERT INTO departments (id, name, code, color, created_at) VALUES ('d4','Fotografia','FOTO','#f59e0b','2026-01-01T00:00:00Z');
INSERT INTO departments (id, name, code, color, created_at) VALUES ('d5','Edicion / Post','EDIT','#8b5cf6','2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p1','Gerente General','d6','estrategico',50000,80000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p2','Gerente de Ventas','d1','gerencial',30000,50000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p3','Coordinador de Ventas','d1','coordinador',20000,30000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p4','Ejecutivo de Ventas','d1','operativo',10000,20000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p5','Coordinador SCM','d2','coordinador',20000,30000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p6','Almacenista','d2','operativo',8000,12000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p7','Coordinador RRHH','d3','coordinador',20000,30000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p8','Recursos Humanos','d3','operativo',10000,18000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p9','Fotografo Senior','d4','supervisor',15000,25000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p10','Fotografo Junior','d4','operativo',8000,15000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p11','Editor Senior','d5','supervisor',15000,25000,'2026-01-01T00:00:00Z');
INSERT INTO positions (id, name, department_id, level, salary_min, salary_max, created_at) VALUES ('p12','Editor Junior','d5','operativo',8000,15000,'2026-01-01T00:00:00Z');
INSERT INTO employees (id, employee_number, name, email, phone, department_id, position_id, hire_date, salary, pay_type, active, created_at, updated_at) VALUES ('e1','EMP-0001','Maria Lopez','maria@fototec.com','8991234567','d1','p2','2022-01-15',35000,'mensual',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO employees (id, employee_number, name, email, phone, department_id, position_id, hire_date, salary, pay_type, active, created_at, updated_at) VALUES ('e2','EMP-0002','Carlos Mendez','carlos@fototec.com','8992345678','d1','p4','2023-03-01',15000,'mensual',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO employees (id, employee_number, name, email, phone, department_id, position_id, hire_date, salary, pay_type, active, created_at, updated_at) VALUES ('e3','EMP-0003','Ana Garcia','ana@fototec.com','8993456789','d2','p5','2022-06-01',25000,'mensual',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO employees (id, employee_number, name, email, phone, department_id, position_id, hire_date, salary, pay_type, active, created_at, updated_at) VALUES ('e4','EMP-0004','Roberto Solis','roberto@fototec.com','8994567890','d2','p6','2023-09-15',10000,'mensual',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO employees (id, employee_number, name, email, phone, department_id, position_id, hire_date, salary, pay_type, active, created_at, updated_at) VALUES ('e5','EMP-0005','Laura Torres','laura@fototec.com','8995678901','d3','p7','2022-02-01',22000,'mensual',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO employees (id, employee_number, name, email, phone, department_id, position_id, hire_date, salary, pay_type, active, created_at, updated_at) VALUES ('e6','EMP-0006','Jose Ramirez','jose@fototec.com','8996789012','d4','p9','2021-08-01',20000,'mensual',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO employees (id, employee_number, name, email, phone, department_id, position_id, hire_date, salary, pay_type, active, created_at, updated_at) VALUES ('e7','EMP-0007','Sofia Hernandez','sofia@fototec.com','8997890123','d5','p11','2022-04-01',18000,'mensual',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO warehouses (id, name, address, city, is_default, created_at) VALUES ('w1','Almacen Principal','Av. Industrial 500','Reynosa',1,'2026-01-01T00:00:00Z');
INSERT INTO warehouses (id, name, address, city, is_default, created_at) VALUES ('w2','Almacen Secundario','Blvd. Las Fuentes 230','Reynosa',0,'2026-01-01T00:00:00Z');
INSERT INTO categories (id, name, color, created_at) VALUES ('c1','Sesiones Fotograficas','#8b5cf6','2026-01-01T00:00:00Z');
INSERT INTO categories (id, name, color, created_at) VALUES ('c2','Eventos','#3b82f6','2026-01-01T00:00:00Z');
INSERT INTO categories (id, name, color, created_at) VALUES ('c3','Producto','#10b981','2026-01-01T00:00:00Z');
INSERT INTO categories (id, name, color, created_at) VALUES ('c4','Edicion','#f59e0b','2026-01-01T00:00:00Z');
INSERT INTO categories (id, name, color, created_at) VALUES ('c5','Paquetes','#ec4899','2026-01-01T00:00:00Z');
INSERT INTO categories (id, name, color, created_at) VALUES ('c6','Accesorios','#06b6d4','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod1','SES-BOD-01','Sesion Boudoir 2hrs','c1',3500,500,99,'sesion',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod2','SES-FAM-01','Sesion Familiar 3hrs','c1',2800,400,99,'sesion',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod3','SES-CORP-01','Sesion Corporativa 4hrs','c1',4500,600,99,'sesion',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod4','SES-CAKE-01','Sesion Cake Smash','c1',2200,300,99,'sesion',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod5','EVT-QUIN-01','Evento Quinceanero','c2',15000,3000,20,'evento',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod6','EVT-BOD-01','Bodas Completo','c2',35000,8000,15,'evento',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod7','EVT-GRA-01','Graduaciones','c2',8000,1500,30,'evento',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, min_stock, unit, active, created_at, updated_at) VALUES ('prod8','PRD-FOTO-8X10','Impresion 8x10 Premium','c3',150,30,500,50,'pieza',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, min_stock, unit, active, created_at, updated_at) VALUES ('prod9','PRD-FOTO-16X20','Impresion 16x20 Premium','c3',350,70,300,30,'pieza',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, min_stock, unit, active, created_at, updated_at) VALUES ('prod10','PRD-ALB-01','Album de Fotos 20pag','c3',2500,600,50,5,'unidad',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, min_stock, unit, active, created_at, updated_at) VALUES ('prod11','PRD-CANVAS-01','Canvas 50x70','c3',1200,300,100,10,'unidad',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod12','PAQ-BAS-01','Paquete Basico','c5',4500,800,99,'paquete',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod13','PAQ-STD-01','Paquete Estandar','c5',8000,1200,99,'paquete',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO products (id, sku, name, category_id, price, cost, stock, unit, active, created_at, updated_at) VALUES ('prod14','PAQ-PREM-01','Paquete Premium','c5',15000,2000,99,'paquete',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO suppliers (id, name, contact_name, email, phone, city, country, category, rating, created_at, updated_at) VALUES ('s1','Estudio Print MX','Pedro Garza','pedro@estudioprint.mx','8180001111','Monterrey','MX','Impresiones',5,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO suppliers (id, name, contact_name, email, phone, city, country, category, rating, created_at, updated_at) VALUES ('s2','Album Factory','Sofia Ruiz','sofia@albumfactory.com','5551234567','CDMX','MX','Albums',4,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO suppliers (id, name, contact_name, email, phone, city, country, category, rating, created_at, updated_at) VALUES ('s3','TechPhoto SA','Miguel Torres','miguel@techphoto.mx','8991112222','Reynosa','MX','Equipo',4,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO suppliers (id, name, contact_name, email, phone, city, country, category, rating, created_at, updated_at) VALUES ('s4','Decor Events','Elena Cruz','elena@decorevents.mx','8993334444','Reynosa','MX','Decoracion',3,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO clients (id, name, email, phone, company, segment, assigned_to, source, created_at, updated_at) VALUES ('cl1','Juan Perez Martinez','juan.perez@email.com','8991112233',NULL,'personal','e1','web','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO clients (id, name, email, phone, company, segment, assigned_to, source, created_at, updated_at) VALUES ('cl2','Maria Rodriguez','maria.r@empresa.mx','8992223344','Empresa ABC','corporativo','e1','referido','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO clients (id, name, email, phone, company, segment, assigned_to, source, created_at, updated_at) VALUES ('cl3','Carlos Soto','csoto@sotocorp.mx','8993334455','Soto Corp SA','pequena','e2','campana','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO clients (id, name, email, phone, company, segment, assigned_to, source, created_at, updated_at) VALUES ('cl4','Laura Gonzalez','laura.gonzalez@email.com','8994445566',NULL,'media','e1','redes','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO clients (id, name, email, phone, company, segment, assigned_to, source, created_at, updated_at) VALUES ('cl5','Fotografo Freelance','foto@freelance.mx','8995556677',NULL,'fotografo','e2','web','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO quotes (id, folio, client_id, status, subtotal, tax_rate, tax_amount, total, created_at, updated_at) VALUES ('q1','COT-202601-0001','cl1','enviado',8000,16,1280,9280,'2026-01-15T00:00:00Z','2026-01-15T00:00:00Z');
INSERT INTO quotes (id, folio, client_id, status, subtotal, tax_rate, tax_amount, total, created_at, updated_at) VALUES ('q2','COT-202601-0002','cl2','aprobado',15000,16,2400,17400,'2026-01-16T00:00:00Z','2026-01-16T00:00:00Z');
INSERT INTO quotes (id, folio, client_id, status, subtotal, tax_rate, tax_amount, total, created_at, updated_at) VALUES ('q3','COT-202601-0003','cl3','borrador',35000,16,5600,40600,'2026-01-17T00:00:00Z','2026-01-17T00:00:00Z');
INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total, created_at) VALUES ('qi1','q1','Paquete Estandar - Sesion Familiar',1,8000,8000,'2026-01-15T00:00:00Z');
INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total, created_at) VALUES ('qi2','q2','Evento Quinceanero',1,15000,15000,'2026-01-16T00:00:00Z');
INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total, created_at) VALUES ('qi3','q3','Bodas Completo',1,35000,35000,'2026-01-17T00:00:00Z');
INSERT INTO invoices (id, folio, client_id, status, subtotal, tax_rate, tax_amount, total, paid_amount, fecha_emision, fecha_vencimiento, created_at, updated_at) VALUES ('inv1','FAC-202601-0001','cl1','pagado',4500,16,720,5220,5220,'2026-01-10','2026-01-25','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO invoices (id, folio, client_id, status, subtotal, tax_rate, tax_amount, total, paid_amount, fecha_emision, fecha_vencimiento, created_at, updated_at) VALUES ('inv2','FAC-202601-0002','cl2','pendiente',17400,16,2784,20184,0,'2026-01-15','2026-01-30','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO invoices (id, folio, client_id, status, subtotal, tax_rate, tax_amount, total, paid_amount, fecha_emision, fecha_vencimiento, created_at, updated_at) VALUES ('inv3','FAC-202601-0003','cl3','pagado',2800,16,448,3248,3248,'2026-01-20','2026-02-04','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO purchase_orders (id, folio, supplier_id, status, subtotal, tax_amount, total, created_at, updated_at) VALUES ('po1','OC-202601-0001','s1','recibido',5000,800,5800,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO purchase_orders (id, folio, supplier_id, status, subtotal, tax_amount, total, created_at, updated_at) VALUES ('po2','OC-202601-0002','s2','enviado',3000,480,3480,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO purchase_order_items (id, purchase_order_id, product_id, description, quantity, unit_price, total, received) VALUES ('poi1','po1','prod8','Impresion 8x10 Premium',100,150,15000,100);
INSERT INTO purchase_order_items (id, purchase_order_id, product_id, description, quantity, unit_price, total, received) VALUES ('poi2','po2','prod10','Album de Fotos 20pag',5,2500,12500,0);
