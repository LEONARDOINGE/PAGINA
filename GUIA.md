# Manual Operativo - FotoTec ERP/CRM/SCM/RH

Sistema integral de gestion fotografica desplegado en Render.com.

---

## Arquitectura

```
                    ┌─────────────────────────────┐
                    │   Render Static Site        │
                    │   Astro + Tailwind + TS    │
                    │   fototec-web.onrender.com  │
                    └────────────┬────────────────┘
                                 │ HTTPS + GraphQL
                    ┌────────────▼────────────────┐
                    │   Render Web Service         │
                    │   Laravel 11 + Lighthouse   │
                    │   fototec-api.onrender.com  │
                    └────────────┬────────────────┘
                                 │ PostgreSQL 17
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼────────┐  ┌──────▼──────┐  ┌───────▼──────┐
    │  Render Postgres  │  │   Turso DB   │  │   D1 SQLite   │
    │  (producci\u00f3n)  │  │   (backup)   │  │  (local dev)  │
    └───────────────────┘  └─────────────┘  └───────────────┘
```

---

## Despliegue en Render

### 1. Crear repos en GitHub

Sube `backend-laravel/` y `frontend-astro/` como repos separados o uno mono-repo.

### 2. Deploy Backend (Laravel)

1. Ve a [render.com](https://render.com) y crea cuenta
2. Click **New +** → **PostgreSQL**
   - Nombre: `fototec-db`
   - Plan: **Free**
   - Region: Oregon
3. Click **New +** → **Web Service**
   - Conecta tu repo de GitHub (backend-laravel)
   - Region: Oregon
   - Runtime: **PHP**
   - Branch: `main`
   - **Build Command:**
     ```
     composer install --no-dev --optimize-autoloader && php artisan config:cache && php artisan route:cache
     ```
   - **Pre-Deploy Command:**
     ```
     php artisan migrate --force && php artisan db:seed --class=RoleSeeder --class=AdminUserSeeder --class=DepartmentSeeder --class=CategorySeeder --class=SampleDataSeeder || true
     ```
   - **Start Command:**
     ```
     php artisan serve --host=0.0.0.0 --port=10000
     ```
   - **Health Check Path:** `/graphql`
   - Environment Variables (Render conectara automaticamente la DB):
     - `APP_ENV` = production
     - `APP_DEBUG` = false
     - `APP_KEY` = (generar con `php artisan key:generate`)
     - `FRONTEND_URL` = https://fototec-web.onrender.com
     - `TURSO_URL` = https://api.turso.io (opcional)
     - `TURSO_AUTH_TOKEN` = tu token de Turso (opcional)

4. Deploy automatico en cada push a `main`.

### 3. Deploy Frontend (Astro)

1. Click **New +** → **Web Service**
   - Conecta tu repo de GitHub (frontend-astro)
   - Runtime: **Static**
   - Region: Oregon
   - **Build Command:**
     ```
     npm install && npm run build
     ```
   - **Publish Directory:** `dist`
   - Environment Variables:
     - `PUBLIC_API_URL` = https://fototec-api.onrender.com/graphql
     - `NODE_VERSION` = 20

### 4. Configurar CORS en Laravel

En `config/cors.php`, agrega la URL de tu frontend:
```php
'allowed_origins' => [
    'https://fototec-web.onrender.com',
    'http://localhost:4321',  // desarrollo local
],
```

---

## Credenciales

| Rol | Email | Password |
|-----|-------|----------|
| Super Admin | admin@fototec.com | admin123 |
| Empleado (RRHH) | sofia@fototec.com | password |
| Empleado (Ventas) | miguel@fototec.com | password |
| Empleado (Ventas) | ana@fototec.com | password |

---

## Modulos y Funciones (100+ iteraciones)

### ERP - Panel Principal
1. Dashboard unificado con KPIs de CRM, SCM y RH
2. KPI Cards: clientes totales, ingresos mes, productos, empleados, facturas pendientes, leads
3. Grafica de linea: ingresos mensuales 12 meses (Chart.js)
4. Grafica de dona: pipeline de ventas por etapa
5. Grafica de barras: asistencia RH
6. Top 5 productos mas vendidos
7. Top 5 clientes por revenue
8. Resumen de Pipeline: interesadas, cotizadas, apartadas, entregadas
9. Resumen de asistencia hoy
10. Tasa de crecimiento vs mes anterior

### CRM - Gestion de Clientes
11. Catalogo de clientes con paginacion
12. CRUD clientes completo
13. Filtros por segmento y estado activo/inactivo
14. Busqueda global por nombre, email, telefono
15. Calculo de LTV (Lifetime Value) por cliente
16. Health Score con barra visual
17. Segmentos: VIP, Corporativo, Regular, Inactivo
18. Vista detallada de cliente

### CRM - Pipeline de Ventas
19. Kanban-like pipeline con 4 etapas
20. Leads con score (0-100)
21. Lead scoring con colores
22. Conversion lead a cliente con un clic
23. Asignacion de leads a empleados
24. Filtro por etapa y busqueda
25. Metafora de funnel: interesadas > cotizadas > apartadas > entregadas

### CRM - Cotizaciones
26. CRUD de cotizaciones
27. Estados: borrador, enviado, aprobado, rechazado, vencido
28. Conversion automatica cotizacion -> factura
29. IVA 16% calculado automaticamente
30. Fecha de validez
31. Line items con precio, cantidad, descuento

### CRM - Facturas (CFDI 4.0)
32. Generacion de facturas con folios unicos
33. Campos RFC, uso CFDI, metodo de pago (PUE/PPD)
34. Calculo automatico IVA 16%
35. Estados: pendiente, pagado, vencido, cancelado
36. Registro de pagos parciales
37. Descarga de factura en TXT (compatible CFDI simplificado)
38. Marcar factura como pagada
39. Saldo pendiente por factura

### CRM - Citas
40. Calendario de citas
41. Tipos: sesion foto, consulta, entrega, reunion
42. Estados: programado, confirmado, en proceso, completado, cancelado
43. Duracion configurable
44. Completar/cancelar cita

### CRM - Tickets
45. Sistema de tickets de soporte
46. Prioridades: baja, media, alta, urgente
47. SLA automatico por prioridad (4h/8h/24h)
48. Estados: abierto, en progreso, esperando, resuelto, cerrado
49. Tickets vencidos marcados en rojo

### CRM - Campanas
50. CRUD de campanas de marketing
51. Canales: email, SMS, WhatsApp, redes sociales
52. Tipos: promocional, informativo, estacional, lanzamiento, retargeting
53. Presupuesto y objetivo

### CRM - Encuestas NPS
54. Encuestas post-sesion
55. Score 0-10 con categorizacion: promotores (9-10), pasivos (7-8), detractores (0-6)
56. Feedback textual

### CRM - Actividades
57. Log de actividades por tipo
58. Tipos: llamada, email, reunion, tarea, WhatsApp, SMS
59. Completar actividades pendientes
60. Indicador de vencidas

### CRM - Notas
61. Notas por entidad (cliente, lead, factura)
62. Notas fijadas (pinned) y privadas
63. Notas publicas compartidas

### SCM - Proveedores
64. Catalogo de proveedores
65. Rating con estrellas (1-5)
66. Tiempo de entrega y terminos de pago
67. Crear orden de compra directa

### SCM - Productos
68. Catalogo completo con 12+ campos
69. Tipos: producto, servicio, insumo, equipo
70. Estrategias: Push, Pull, Hibrido
71. SKU unico y codigo de barras
72. Margen de ganancia calculado automaticamente
73. Indicador de stock bajo (amarillo) y agotado (rojo)
74. Filtros por tipo y busqueda

### SCM - Inventario
75. Vista de inventario por almacen
76. Alertas visuales de stock critico
77. Ajustes rapidos (+/- stock) con un clic
78. Historico de movimientos de stock
79. Exportar a CSV
80. Valor total del inventario

### SCM - Almacenes
81. Gestion de ubicaciones (bodegas)
82. Unidad minima de almacenamiento
83. Encargado por almacen

### SCM - Ordenes de Compra
84. CRUD de ordenes de compra a proveedores
85. Estados: borrador, enviado, parcial, recibido, cancelado
86. Recepcion de orden: stock aumenta automaticamente
87. Totales con IVA

### SCM - Movimientos de Stock
88. Historial completo de entradas y salidas
89. Filtro por tipo de movimiento
90. Razon de cada ajuste

### RH - Empleados
91. Catalogo con foto, departamento color-coded
92. Numero de empleado unico
93. Antiguedad calculada automaticamente
94. Tasa de asistencia personal
95. Grid view con estadisticas

### RH - Departamentos
96. CRUD de departamentos
97. Codigo, centro de costo, presupuesto
98. Color personalizable
99. Contador de empleados y puestos
100. Nomina mensual estimada por departamento

### RH - Asistencia
101. Registro clock-in/clock-out rapido
102. Estados: presente, falta, retardo, permiso, vacaciones, incapacidad
103. Resumen mensual por empleado
104. Tasa de asistencia general
105. Indicador de retardo (llegada despues de 9:00)

### RH - Permisos y Vacaciones
106. Solicitud de permisos por tipo
107. Aprobacion/rechazo por administrador
108. Contador de dias automatico
109. Solicitudes pendientes con badge
110. Historial completo

### RH - Capacitaciones
111. Catalogo de cursos
112. Inscripcion de empleados
113. Duracion en horas

### RH - Evaluaciones
114. Evaluaciones de desempeno
115. Ratings por dimension: global, desempeno, trabajo en equipo, liderazgo
116. Fortalezas y areas de mejora

### RH - Organigrama
117. Organigrama visual con estructura jerarquica
118. Empleados por departamento con cargo

### ERP - Reportes
119. Exportar CSV: clientes, productos, empleados, facturas
120. Grafica de ventas por categoria
121. Grafica de empleados por departamento

### ERP - Auditoria
122. Log completo de todas las acciones
123. Filtro por entidad
124. Busqueda por accion
125. Registro de IP y usuario

### ERP - Configuracion
126. Datos de empresa (RFC, direccion, contacto)
127. Parametros financieros (IVA, moneda)
128. Integracion Turso (sync push/pull)

### ERP - RBAC
129. 6 roles: super_admin, gerente_ventas, coordinador_scm, coordinador_rrhh, empleado, cliente
130. 14 permisos granulares por modulo
131. Policies de autorizacion por modelo
132. Acceso condicional a pestanas en frontend

### Inter-modulo
133. Empleado -> usuario -> roles
134. Factura -> cliente -> leads
135. Orden compra -> proveedor -> productos -> inventario
136. Nota -> cualquier entidad (polimorfico)
137. Actividad -> cualquier entidad (polimorfico)
138. Dashboard unificado consume datos de CRM, SCM y RH simultaneamente

---

## Roles y Permisos

| Permiso | Super Admin | Gerente Ventas | Coord. SCM | Coord. RRHH | Empleado |
|---------|-------------|----------------|------------|-------------|----------|
| access_crm | Si | Si | Lectura | Lectura | Propios |
| manage_crm | Si | Si | No | No | No |
| access_scm | Si | Lectura | Si | Lectura | No |
| manage_scm | Si | No | Si | No | No |
| access_rh | Si | Lectura | Lectura | Si | Propios |
| manage_rh | Si | No | No | Si | No |
| view_dashboard | Si | Si | Si | Si | Si |
| export_data | Si | Si | Si | Si | No |
| manage_users | Si | No | No | No | No |

---

## Tecnologias

- **Backend:** Laravel 11 + PHP 8.2 + Lighthouse GraphQL
- **Base de datos:** PostgreSQL 17 (Render) + Turso SQLite (backup sync)
- **Frontend:** Astro 4 + Tailwind CSS 3 + TypeScript + Chart.js
- **Auth:** Laravel Sanctum + bcrypt
- **Deploy:** Render.com (2 web services + 1 PostgreSQL)
