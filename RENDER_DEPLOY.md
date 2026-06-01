# FotoTec ERP - Despliegue en Render.com

Sistema completo: Astro 4 (frontend) + Laravel 11 + Lighthouse GraphQL (backend) + PostgreSQL (Render) + Turso (backup).

---

## Paso 1: Crear repos en GitHub

1. Ve a https://github.com/new
2. Crea `fototec-api` (para el backend Laravel)
3. Crea `fototec-web` (para el frontend Astro)
4. **No inicialices** con README - deja vacio

---

## Paso 2: Subir codigo a GitHub

Ejecuta `deploy.bat` en la carpeta PAGINA:

```
.\deploy.bat
```

Esto subira ambos proyectos a sus respective repos en GitHub.

---

## Paso 3: Crear PostgreSQL en Render

1. Ve a https://dashboard.render.com
2. Click **New** → **PostgreSQL**
3. Configura:
   - **Name:** `fototec-db`
   - **Database:** `fototec_app`
   - **User:** `fototec_user`
   - **Region:** Oregon (US West)
   - **Plan:** Free
4. Click **Create Database**
5. **Espera** a que el estado sea "Available" (~2 min)
6. Copia los valores de "Connection Details" (los usaremos despues)

---

## Paso 4: Desplegar Backend (Laravel)

1. En Render, click **New** → **Web Service**
2. Conecta tu repo `fototec-api`
3. Configura:
   - **Name:** `fototec-api`
   - **Region:** Oregon
   - **Runtime:** PHP 8.2
   - **Branch:** `main`
   - **Root Directory:** (vacio)
   - **Build Command:**
     ```
     composer install --no-dev --optimize-autoloader
     php artisan config:cache
     php artisan route:cache
     ```
   - **Start Command:**
     ```
     php -S 0.0.0.0:10000 -t public
     ```
   - **Plan:** Free

4. En **Environment** → **Environment Variables**, agrega:
   ```
   APP_ENV = production
   APP_DEBUG = false
   APP_KEY = (genera despues desde SSH/shell)
   APP_URL = https://fototec-api.onrender.com
   DB_CONNECTION = pgsql
   DB_HOST = (de tu PostgreSQL en Render)
   DB_PORT = 5432
   DB_DATABASE = fototec_app
   DB_USERNAME = (de tu PostgreSQL)
   DB_PASSWORD = (de tu PostgreSQL)
   FRONTEND_URL = https://fototec-web.onrender.com
   CACHE_DRIVER = array
   SESSION_DRIVER = array
   LOG_CHANNEL = stderr
   ```

5. Click **Create Web Service**
6. **Espera** el build (~3-5 min)

7. Para generar APP_KEY, entra al shell del servicio:
   - En Render dashboard → tu servicio → **Shell**
   - Ejecuta: `php artisan key:generate`
   - Copia la key generada a la variable `APP_KEY`

8. Para correr migraciones:
   - En el shell: `php artisan migrate --force`
   - Para seeders: `php artisan db:seed --class=DatabaseSeeder`

9. Verifica: visita `https://fototec-api.onrender.com/graphql`
   - Deberia devolver `{"errors":[{"message":"Must provide query string."}]}`

---

## Paso 5: Desplegar Frontend (Astro)

1. En Render, click **New** → **Static Site**
2. Conecta tu repo `fototec-web`
3. Configura:
   - **Name:** `fototec-web`
   - **Region:** Oregon
   - **Branch:** `main`
   - **Root Directory:** (vacio)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Plan:** Free

4. En **Environment Variables**, agrega:
   ```
   NODE_VERSION = 20
   PUBLIC_API_URL = https://fototec-api.onrender.com/graphql
   ```

5. Click **Create Static Site**
6. **Espera** el build (~2-3 min)

7. Verifica: visita `https://fototec-web.onrender.com`

---

## Paso 6: Configurar Turso como Backup

### 6.1 Crear base de datos en Turso

1. Ve a https://console.turso.tech
2. Registrate / Login con GitHub
3. Click **Create new database**
   - **Name:** `fototec-backup`
   - **Region:** Dallas (o `arn` - Arlington)
   - **Type:** Development (Free tier)
4. Click **Create**
5. En la pagina de la base de datos, copia:
   - **URL** (para `TURSO_URL`)
   - **Auth Token** (para `TURSO_AUTH_TOKEN`)

### 6.2 Configurar en Render

En tu servicio `fototec-api`, agrega variables:
```
TURSO_URL = libc://fototec-backup-xxxxx.turso.io
TURSO_AUTH_TOKEN = your_turso_auth_token_here
```

### 6.3 Sincronizacion manual

Desde el shell de Laravel en Render:
```bash
php artisan tinker
>>> App::make(\App\Services\TursoSyncService::class)->push()
>>> App::make(\App\Services\TursoSyncService::class)->pull()
```

### 6.4 Sincronizacion automatica (opcional)

Agrega un scheduled command en `routes/console.php`:
```php
$schedule->command('turso:sync')->daily();
```

---

## Credenciales de Acceso

- **Email:** `admin@fototec.com`
- **Password:** `admin123`

---

## Estructura de URLs

| Servicio | URL |
|----------|-----|
| Frontend | https://fototec-web.onrender.com |
| API GraphQL | https://fototec-api.onrender.com/graphql |
| GraphiQL IDE | https://fototec-api.onrender.com/graphiql |
| Health Check | https://fototec-api.onrender.com/health |
| PostgreSQL | Solo via Render dashboard (interno) |
| Turso Backup | https://console.turso.tech |

---

## Modulos del Sistema

| Modulo | Paginas |
|--------|---------|
| **ERP** | Dashboard, Finanzas, Reportes, Auditoria, Notificaciones, Usuarios, Configuracion |
| **CRM** | Dashboard, Clientes, Pipeline, Cotizaciones, Facturas, Citas, Tickets, Campanas, Encuestas, Actividades, Notas, Calendario |
| **SCM** | Dashboard, Productos, Inventario, Almacenes, Proveedores, Ordenes de Compra, Movimientos |
| **RRHH** | Dashboard, Empleados, Departamentos, Puestos, Asistencia, Permisos, Capacitaciones, Evaluaciones, Organigrama, Calendario |

---

## Resolucion de Problemas

### Build falla en Astro
- Verifica que `NODE_VERSION = 20` este en env vars
- Verifica que `astro.config.mjs` tenga `output: 'static'`
- Verifica que `npm install && npm run build` sea el build command

### API devuelve 500
- Verifica `APP_KEY` esta configurada
- Verifica las variables de DB (host, port, database, username, password)
- Revisa logs en Render dashboard → tu servicio → Logs

### GraphQL no responde
- Verifica que `APP_ENV = production` y `APP_DEBUG = false`
- Prueba `/health` primero
- Revisa los logs de Laravel

### CORS errors en el frontend
- En Laravel, verifica que `FRONTEND_URL` apunta a la URL correcta de Astro
- En Render, las variables de entorno se leen al hacer deploy

### Turso sync falla
- Verifica `TURSO_URL` y `TURSO_AUTH_TOKEN`
- Turso usa libSQL, no PostgreSQL puro - no todas las tablas son compatibles
- Solo usa Turso como backup de datos selectos, no como DB primaria
