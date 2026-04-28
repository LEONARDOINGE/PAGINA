# Deploy a Cloudflare Pages 🐾

## Requisitos
- Cuenta en [Cloudflare](https://dash.cloudflare.com/)
- Wrangler CLI instalado: `npm install -g wrangler`
- GitHub repo (opcional pero recomendado)

## Metodo 1: GitHub (Deploy Automatico) ✅ RECOMENDADO

1. Sube tu codigo a GitHub:
   ```bash
   git init
   git add .
   git commit -m "FotoTec ready for Cloudflare"
   git remote add origin https://github.com/TU_USER/PAGINA.git
   git push -u origin main
   ```

2. En [Cloudflare Dashboard](https://dash.cloudflare.com/):
   - Ve a **Workers & Pages**
   - Click **Create application**
   - Selecciona **Pages** → **Connect to Git**
   - Conecta tu repositorio GitHub
   - Configura:
     - **Production branch:** `main`
     - **Build command:** (vacio - solo sirve archivos estaticos)
     - **Build output directory:** `/`
   - Click **Deploy**

3. Listo! Obtenes un dominio `.pages.dev` gratis

## Metodo 2: Wrangler CLI

```bash
# Login a Cloudflare
wrangler login

# Deploy directo
wrangler pages deploy . --project-name=fototec

# O crear proyecto
wrangler pages project create fototec
wrangler pages deploy .
```

## Configurar dominio personalizado

1. En Cloudflare Dashboard → tu proyecto Pages
2. Custom domains → Add domain
3. Sigue las instrucciones DNS

## Configurar Variables de Entorno (Production)

1. Ve a tu proyecto → Settings → Environment variables
2. Anade:
   - `SMTP_USER` = tu email
   - `SMTP_PASS` = contrasena de aplicacion

## Estructura del Proyecto

```
PAGINA/
├── index.html          # Frontend principal
├── styles.css          # Estilos
├── auth.js            # Sistema auth (frontend)
├── permissions.js    # Permisos RBAC
├── database.js       # Base de datos localStorage
├── functions/
│   └── _worker.js    # API routes para Cloudflare
├── wrangler.toml      # Config Cloudflare
└── package.json
```

## Notas Importantes

### Limitaciones en Cloudflare Pages (Free Tier)
- Workers: 100,000 requests/dia
- Bandwidth: 100GB/mes
- Sin base de datos SQLite nativa (usa D1 o KV para produccion)

### Para Production Real
1. **Base de datos**: Usa Cloudflare D1 o externo (Turso, PlanetScale)
2. **Email**: Integra SendGrid, Resend, o Mailgun API
3. **Auth**: Considera Cloudflare Access o Auth.js

## Comandos Utiles

```bash
# Desarrollo local
wrangler pages dev .

# Ver logs
wrangler pages project list
wrangler pages deploy . --verbose

# Eliminar deployments
wrangler pages deployment list fototec
```

## Solucion de Problemas

### Error: "No output directory specified"
- Asegurate que `pages_build_output_dir = "./"` esta en wrangler.toml

### Error: API no funciona
- Verifica que `_worker.js` esta en la carpeta `functions/`
- El worker recibe todas las requests que no sean archivos estaticos

### Error: 500 en /api/*
- Revisa los logs en Cloudflare Dashboard → tu worker → Logs
