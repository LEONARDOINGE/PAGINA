@echo off
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║          FotoTec ERP - Deployment en Render.com              ║
echo  ║          Usuario: LEONARDOINGE                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set GH_USER=LEONARDOINGE
set API_REPO=fototec-api
set WEB_REPO=fototec-web
set API_BRANCH=main
set WEB_BRANCH=main

REM --- PASO 1: Preparar Backend ---
echo.
echo [1/6] Preparando Backend Laravel...
cd backend-laravel
if exist ".git" (
    echo   Repo backend ya existe, actualizando...
) else (
    echo   Inicializando repo git...
    git init
    git remote add origin https://github.com/%GH_USER%/%API_REPO%.git
)
git add .
git commit -m "FotoTec ERP API - Laravel 11 + Lighthouse GraphQL + PostgreSQL + Turso Sync"
git branch -M %API_BRANCH%
echo   Backend preparado.

REM --- PASO 2: Preparar Frontend ---
cd ..\frontend-astro
if exist ".git" (
    echo   Repo frontend ya existe, actualizando...
) else (
    echo   Inicializando repo git...
    git init
    git remote add origin https://github.com/%GH_USER%/%WEB_REPO%.git
)
git add .
git commit -m "FotoTec ERP Web - Astro 4 + Tailwind CSS + TypeScript + Chart.js"
git branch -M %WEB_BRANCH%
echo   Frontend preparado.
cd ..

REM --- PASO 3: Push a GitHub ---
echo.
echo [2/6] Subiendo a GitHub...
echo.
echo   IMPORTANTE: Asegurate de haber creado los repos en GitHub:
echo   - https://github.com/%GH_USER%/%API_REPO%
echo   - https://github.com/%GH_USER%/%WEB_REPO%
echo.
echo   Ejecutando push del backend...
cd backend-laravel
git push -u origin %API_BRANCH%
if %ERRORLEVEL% neq 0 (
    echo.
    echo   ERROR en push del backend. Verifica que los repos existan en GitHub.
    echo   Crea los repos desde: https://github.com/new
    echo   Nombre del repo API: %API_REPO%
    echo   Nombre del repo WEB: %WEB_REPO%
    pause
    exit /b 1
)

echo.
echo   Ejecutando push del frontend...
cd ..\frontend-astro
git push -u origin %WEB_BRANCH%
if %ERRORLEVEL% neq 0 (
    echo.
    echo   ERROR en push del frontend. Verifica que los repos existan en GitHub.
    pause
    exit /b 1
)
cd ..

REM --- PASO 4: Mostrar instrucciones Render ---
echo.
echo [3/6] Configurando Render.com...
echo.
echo  ═══════════════════════════════════════════════════════════
echo  INSTRUCCIONES PARA RENDER.COM:
echo  ═══════════════════════════════════════════════════════════
echo.
echo  1. VE A https://dashboard.render.com
echo     Inicia sesion con tu cuenta de GitHub.
echo.
echo  2. CREAR POSTGRESQL:
echo     Click "New" -^> "PostgreSQL"
echo     - Name: fototec-db
echo     - Database: fototec_app
echo     - Region: Oregon (US West)
echo     - Plan: Free
echo     Click "Create Database" y ESPERA a que este listo.
echo     (Copia el "Connection Details" - Internal Database URL)
echo.
echo  3. CREAR WEB SERVICE (BACKEND LARAVEL):
echo     Click "New" -^> "Blueprint" o "Web Service"
echo     - Connect: %GH_USER%/%API_REPO%
echo     - Region: Oregon
echo     - Root Directory: (vacio)
echo     - Runtime: PHP
echo     - Build Command: composer install --no-dev --optimize-autoloader
echo     - Start Command: php -S 0.0.0.0:10000 -t public
echo     - Plan: Free
echo     - Environment: PHP 8.2
echo.
echo     EN VARIABLES DE ENTORNO, agrega:
echo     - APP_ENV = production
echo     - APP_DEBUG = false
echo     - APP_KEY = (genera con: php artisan key:generate)
echo     - APP_URL = https://fototec-api.onrender.com
echo     - DB_HOST = (de PostgreSQL que creaste)
echo     - DB_PORT = 5432
echo     - DB_DATABASE = fototec_app
echo     - DB_USERNAME = (de PostgreSQL)
echo     - DB_PASSWORD = (de PostgreSQL)
echo     - FRONTEND_URL = https://fototec-web.onrender.com
echo     - CACHE_DRIVER = array
echo     - SESSION_DRIVER = array
echo.
echo  4. CREAR STATIC SITE (FRONTEND ASTRO):
echo     Click "New" -^> "Static Site"
echo     - Connect: %GH_USER%/%WEB_REPO%
echo     - Region: Oregon
echo     - Root Directory: (vacio)
echo     - Build Command: npm install ^&^& npm run build
echo     - Publish Directory: dist
echo     - Plan: Free
echo.
echo     EN VARIABLES DE ENTORNO, agrega:
echo     - NODE_VERSION = 20
echo     - PUBLIC_API_URL = https://fototec-api.onrender.com/graphql
echo.
echo  5. ESPERA a que ambos deploys terminen (5-10 min).
echo.
echo  6. PRUEBA LA API:
echo     https://fototec-api.onrender.com/graphql
echo     (Deberia devolver JSON)
echo.
echo  7. PRUEBA LA WEB:
echo     https://fototec-web.onrender.com
echo.
echo  ═══════════════════════════════════════════════════════════
echo.

REM --- PASO 5: Turso.tech config ---
echo [4/6] Configuracion Turso.tech...
echo.
echo  Para sincronizar con Turso (backup en la nube):
echo.
echo  1. Ve a https://console.turso.tech
echo  2. Registrate con GitHub
echo  3. Crea una base de datos:
echo     - Name: fototec-backup
echo     - Region: Dallas (o el mas cercano)
echo  4. En tu base de datos PostgreSQL de Render, crea una tabla:
echo     php artisan migrate
echo  5. En Render, agrega variables para Turso:
echo     - TURSO_URL = libc://fototec-backup-xxx.turso.io
echo     - TURSO_AUTH_TOKEN = (de tu dashboard de Turso)
echo  6. Para hacer sync manual desde Laravel:
echo     php artisan tinker
echo     ^> App::make(\App\Services\TursoSyncService::class)^-^>push()
echo.

REM --- PASO 6: Verificar ---
echo [5/6] Verificando archivos...
echo.
if exist "backend-laravel\artisan" (echo   [OK] artisan) else (echo   [FALTA] backend-laravel\artisan)
if exist "backend-laravel\composer.json" (echo   [OK] composer.json) else (echo   [FALTA] backend-laravel\composer.json)
if exist "backend-laravel\.gitignore" (echo   [OK] .gitignore) else (echo   [FALTA] backend-laravel\.gitignore)
if exist "backend-laravel\storage\logs\.gitignore" (echo   [OK] storage/logs) else (echo   [FALTA] storage/logs)
if exist "frontend-astro\package.json" (echo   [OK] package.json) else (echo   [FALTA] frontend-astro\package.json)
if exist "frontend-astro\astro.config.mjs" (echo   [OK] astro.config.mjs) else (echo   [FALTA] frontend-astro\astro.config.mjs)
if exist "frontend-astro\render.yaml" (echo   [OK] render.yaml) else (echo   [FALTA] frontend-astro\render.yaml)
echo.

echo [6/6] Deployment listo!
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  PROXIMOS PASOS:                                            ║
echo  ║  1. Crea los repos en GitHub (si no existen)                ║
echo  ║  2. Ejecuta este script de nuevo para hacer push            ║
echo  ║  3. Configura Render.com segun las instrucciones arriba     ║
echo  ║  4. Configura Turso.tech como backup                        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  LOGIN: admin@fototec.com / admin123
echo.
pause
