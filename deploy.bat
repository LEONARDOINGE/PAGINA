@echo off
echo ============================================
echo  FotoTec ERP - Deployment Script
echo  Usuario: LEONARDOINGE
echo ============================================
echo.

REM --- CONFIGURACION ---
set GH_USER=LEONARDOINGE
set API_REPO=fototec-api
set WEB_REPO=fototec-web

REM --- BACKEND ---
echo.
echo [1/4] Subiendo Backend (Laravel) a GitHub...
cd backend-laravel
git init
git add .
git commit -m "FotoTec ERP API - Laravel 11 + Lighthouse GraphQL + PostgreSQL"
git branch -M main
git remote add origin https://github.com/%GH_USER%/%API_REPO%.git
git push -u origin main --force
cd ..

REM --- FRONTEND ---
echo.
echo [2/4] Subiendo Frontend (Astro) a GitHub...
cd frontend-astro
git init
git add .
git commit -m "FotoTec ERP Web - Astro 4 + Tailwind CSS + TypeScript"
git branch -M main
git remote add origin https://github.com/%GH_USER%/%WEB_REPO%.git
git push -u origin main --force
cd ..

echo.
echo ============================================
echo  SUBIDO A GITHUB EXITOSAMENTE
echo ============================================
echo.
echo PASOS EN RENDER.COM:
echo.
echo 1. Ve a https://render.com
echo 2. NEW -^> PostgreSQL
echo    - Name: fototec-db
echo    - Plan: Free
echo.
echo 3. NEW -^> Web Service (Backend Laravel)
echo    - Connect: %GH_USER%/%API_REPO%
echo    - Runtime: PHP
echo    - Build: composer install --no-dev --optimize-autoloader ^&^& php artisan config:cache ^&^& php artisan route:cache
echo    - Pre-Deploy: php artisan migrate --force
echo    - Start: php artisan serve --host=0.0.0.0 --port=10000
echo    - Health: /graphql
echo.
echo 4. NEW -^> Web Service (Frontend Astro)
echo    - Connect: %GH_USER%/%WEB_REPO%
echo    - Runtime: Static
echo    - Build: npm install ^&^& npm run build
echo    - Directory: dist
echo.
echo 5. En Astro, agrega variable:
echo    PUBLIC_API_URL = https://fototec-api.onrender.com/graphql
echo.
echo LOGIN: admin@fototec.com / admin123
echo.
echo ============================================
pause
