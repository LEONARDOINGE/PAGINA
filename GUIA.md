# Manual Operativo - FotoTec CRM/ERP/SCM

Sistema de gestion integral para FotoTec, Reynosa Tamaulipas.

---

## Modulos

### CRM (Customer Relationship Management)

#### Pipeline de Ventas
- Ubicacion: Pestana "Pipeline CRM" en el panel admin
- Flujo: Interesado -> Cotizado -> Apartado -> Entregado
- Cada oportunidad muestra nombre, email, telefono, servicio, estado y fecha

#### Notas del Cliente
- Ubicacion: Pestana "Notas Cliente"
- Agregar notas por email del cliente
- Filtrar por email para ver todas las notas de un cliente
- Todas las notas se guardan en Turso

#### Facturas
- Ubicacion: Pestana "Facturas"
- Generar factura con: folio, RFC, nombre, direccion, concepto, subtotal, IVA 16%
- Descargar como archivo .txt
- Consulta de facturas existentes

#### Pedidos
- Ubicacion: Pestana "Pedidos"
- Cambiar estado: Pendiente / Completado / Cancelado
- **Regla SCM:** Al marcar "Completado", el stock de productos se reduce automaticamente
- Boton "Ver" para ver detalle completo del pedido

---

### ERP (Enterprise Resource Planning)

#### Productos
- Ubicacion: Pestana "Productos"
- CRUD completo: crear, editar, eliminar productos
- Campos: nombre, descripcion, precio, stock, categoria, estrategia (Push/Pull), stock minimo, proveedor
- Alertas visuales de stock bajo cuando stock < stock_minimo

#### Empleados (RRHH)
- Ubicacion: Pestana "RRHH"
- Registro de empleados con: nombre, puesto, departamento, telefono, email, fecha contratacion, salario
- Todos los datos en Turso

#### Usuarios
- Ubicacion: Pestana "Usuarios"
- Ver todos los usuarios registrados
- Gestion de roles: admin / empleado / cliente

#### Reportes
- Ubicacion: Pestana "Reportes"
- Reporte mensual de ventas
- Reporte de productos mas vendidos
- Exportar a CSV

---

### SCM (Supply Chain Management)

#### Proveedores
- Ubicacion: Pestana "Proveedores"
- Registro de proveedores con: nombre, contacto, telefono, email, tipo de insumo, detalle de insumos
- Ver historial de pedidos por proveedor

#### Pedidos de Compra
- Ubicacion: Pestana "Ped. Compra"
- Crear pedido de compra a proveedor
- Agregar productos al pedido
- **Regla SCM:** Al marcar "Recibido", el stock de productos aumenta automaticamente
- Estados: Pendiente / Recibido / Cancelado

---

## Dashboard
- Ubicacion: Pestana "Dashboard"
- Graficas Chart.js con datos de Turso:
  - Pedidos por estado
  - Pipeline CRM por etapa
  - Facturas y monto total
  - Compras a proveedores
- KPIs en tiempo real desde Turso

---

## Accesos

| Pestana | Admin | Empleado | Cliente |
|---------|-------|----------|---------|
| Dashboard | Si | Si | No |
| Productos | Si | Si | No |
| Pedidos | Si | Si | No |
| Reservas | Si | Si | Si |
| Proveedores | Si | No | No |
| RRHH | Si | No | No |
| Ped. Compra | Si | No | No |
| Usuarios | Si | No | No |
| Reportes | Si | No | No |
| Auditoria | Si | No | No |
| Pipeline CRM | Si | Si | No |
| Notas Cliente | Si | Si | No |
| Facturas | Si | Si | No |

---

## Tecnologias

- **Base de datos:** Turso SQLite (cloud)
- **Backend:** Node.js + Express en Cloudflare Workers
- **Frontend:** HTML5 + JavaScript vanilla + Chart.js
- **Autenticacion:** bcrypt + token en localStorage

## Credenciales
- Admin: usuario `admin`, password `admin123`
- Acceso al panel: boton "Panel Admin" en la navbar (solo visible para rol admin)
- El panel admin se abre en una nueva pestana: `admin.html`

## Sincronizacion Push/Pull
- Desde index.html: botones "Push" y "Pull" para sincronizar datos con Turso
- Desde admin.html: pestana "Push/Pull" para sincronizar toda la base de datos
- Indicadores visuales muestran si los datos son locales o de la nube
