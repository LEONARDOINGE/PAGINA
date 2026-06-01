@echo off
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║    FotoTec ERP - Deployment en Cloudflare Workers         ║
echo  ║    Wrangler + Hono.js + D1 + Pages                      ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set GH_USER=LEONARDOINGE
set CF_ACCOUNT_ID=your-cloudflare-account-id
set API_REPO=fototec-api
set WEB_REPO=fototec-web

REM --- Verificar Wrangler ---
where wrangler >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ERROR: Wrangler no esta instalado.
    echo  Instala con: npm install -g wrangler
    echo  O: npx wrangler --version
    echo.
    pause
    exit /b 1
)

echo  [OK] Wrangler encontrado
echo.

REM --- PASO 1: Crear D1 Database ---
echo [1/5] Creando base de datos D1...
echo.
echo  IMPORTANTE: Antes de continuar, necesitas:
echo  1. Ir a https://dash.cloudflare.com
echo  2. Ir a Workers & Pages -^> Overview
echo  3. Copiar tu Account ID de la barra lateral derecha
echo  4. Establecer variable CF_ACCOUNT_ID en este script
echo.
set /p CF_ACCOUNT_ID="Tu Cloudflare Account ID: "
if "%CF_ACCOUNT_ID%"=="" (
    echo  ERROR: Account ID es requerido
    pause
    exit /b 1
)

echo.
echo  Ejecutando comandos de D1...
cd backend-workers

echo  Creando base de datos local...
wrangler d1 create fototec-db --dry-run 2>nul
if %ERRORLEVEL% equ 0 (
    echo  D1 fototec-db ya existe o se creo
) else (
    echo  Nota: dry-run no soportado, continuando...
)

echo.
echo  Aplicando esquema a D1 (local)...
wrangler d1 execute fototec-db --local --file=src/db/schema.sql
if %ERRORLEVEL% neq 0 (
    echo  Creando D1 local primero...
    wrangler d1 create fototec-db
    wrangler d1 execute fototec-db --local --file=src/db/schema.sql
)

echo.
echo  Aplicando esquema a D1 (production)...
echo  NOTA: Ejecuta manualmente en produccion:
echo  wrangler d1 execute fototec-db --remote --file=src/db/schema.sql --persist
echo  wrangler d1 execute fototec-db --remote --file=src/db/schema.sql
echo.
set /p CONFIRM="Continuar con deploy local? (s/n): "
if /i not "%CONFIRM%"=="s" exit /b 0

REM --- PASO 2: Deploy Workers Backend ---
echo.
echo [2/5] Desplegando Cloudflare Workers (Backend)...
echo.
echo  Para hacer deploy real, necesitas actualizar wrangler.toml con tu D1 database_id
echo  Ve a: https://dash.cloudflare.com -^> Workers -^> D1
echo  Copia el database_id y actualiza backend-workers/wrangler.toml
echo.
echo  Alternativa: ejecuta manualmente:
echo    cd backend-workers
echo    wrangler deploy
echo.
set /p DEPLOY="Ejecutar wrangler deploy? (s/n): "
if /i "%DEPLOY%"=="s" (
    wrangler deploy --dry-run
    if %ERRORLEVEL% equ 0 (
        echo  Dry-run exitoso. Ejecuta 'wrangler deploy' sin --dry-run para deploy real.
    )
)

REM --- PASO 3: Preparar repos GitHub ---
echo.
echo [3/5] Preparando repositorios GitHub...
cd ..
if exist "backend-workers\.git" (
    echo   Repo backend ya existe
) else (
    cd backend-workers
    git init
    git remote add origin https://github.com/%GH_USER%/%API_REPO%.git
)
git add .
git commit -m "FotoTec ERP API - Cloudflare Workers + Hono + D1"
cd ..

if exist "frontend-astro\.git" (
    echo   Repo frontend ya existe
) else (
    cd frontend-astro
    git init
    git remote add origin https://github.com/%GH_USER%/%WEB_REPO%.git
)
git add .
git commit -m "FotoTec ERP Web - Astro 4 + Cloudflare Pages"
cd ..

REM --- PASO 4: Instrucciones Cloudflare Pages ---
echo.
echo [4/5] Configurar Cloudflare Pages...
echo.
echo  ═══════════════════════════════════════════════════════════
echo  PASOS PARA CLOUDFLARE PAGES (Frontend Astro):
echo  ═══════════════════════════════════════════════════════════
echo.
echo  1. Ve a https://pages.cloudflare.com
echo  2. Click "Create a project"
echo  3. Connect GitHub: %GH_USER%/%WEB_REPO%
echo  4. Configura:
echo     - Production branch: main
echo     - Build command: npm install ^&^& npm run build
echo     - Output directory: dist
echo     - Environment variables:
echo         NODE_VERSION = 20
echo         PUBLIC_API_URL = https://fototec-api.%CF_ACCOUNT_ID%.workers.dev/graphql
echo.
echo  5. Deploy
echo.
echo  ═══════════════════════════════════════════════════════════
echo  PASOS PARA CLOUDFLARE WORKERS (Backend):
echo  ═══════════════════════════════════════════════════════════
echo.
echo  1. Ve a https://dash.cloudflare.com/workers-ai
echo  2. Ve a D1 -^> Databases
echo  3. Copia el database_id de fototec-db
echo  4. Actualiza backend-workers/wrangler.toml:
echo     database_id = "tu-database-id-aqui"
echo  5. Ejecuta:
echo     cd backend-workers
echo     wrangler deploy
echo.
echo  6. Agrega secret para Turso:
echo     wrangler secret put TURSO_AUTH_TOKEN
echo     (ingresa tu token de console.turso.tech)
echo.
echo  7. Prueba:
echo     https://fototec-api.%CF_ACCOUNT_ID%.workers.dev/health
echo     https://fototec-api.%CF_ACCOUNT_ID%.workers.dev/graphql
echo.

REM --- PASO 5: Turso config ---
echo [5/5] Configuracion Turso.tech...
echo.
echo  1. Ve a https://console.turso.tech
echo  2. Crea base de datos: fototec-backup
echo  3. Copia el TURSO_AUTH_TOKEN
echo  4. En Cloudflare Workers:
echo     wrangler secret put TURSO_AUTH_TOKEN
echo     wrangler secret put TURSO_URL
echo     (libc://fototec-backup-xxxxx.turso.io)
echo.

echo  ═══════════════════════════════════════════════════════════════
echo  PROXIMOS PASOS:
echo  1. Configura CF_ACCOUNT_ID en este script
echo  2. Actualiza wrangler.toml con tu database_id de D1
echo  3. Ejecuta: cd backend-workers ^&^& wrangler deploy
echo  4. Configura Cloudflare Pages para frontend-astro
echo  5. Ejecuta deploy de frontend con PUBLIC_API_URL apuntando a Workers
echo  ═══════════════════════════════════════════════════════════════
echo.
echo  LOGIN: admin@fototec.com / admin123
echo.
pause
