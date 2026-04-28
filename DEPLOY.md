# ===========================================
# GUIA DE DESPLIEGUE - FOTOTEC
# ===========================================

## OPCIONES DE HOSTING RECOMENDADAS

### 1. Railway (Recomendado - Gratis para empezar)
https://railway.app

- Conecta tu repositorio GitHub
- Automaticamente detecta Node.js
- SQLite funciona directo (archivo persistente)
- Añade las variables de entorno desde Railway Dashboard

### 2. Render
https://render.com

- Crea un "Web Service"
- Build command: `npm install`
- Start command: `npm start`
- Añade environment variables

### 3. Heroku
https://heroku.com

- Crea una app nueva
- Conecta GitHub para deploy automatico
- Configura las variables de entorno

### 4. VPS (DigitalOcean, AWS, etc.)
```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar y desplegar
git clone https://github.com/LEONARDOINGE/PAGINA.git
cd PAGINA
npm install
npm start
```

## VARIABLES DE ENTORNO REQUERIDAS

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| PORT | Puerto del servidor | 3000 |
| SMTP_USER | Email para enviar | tuemail@gmail.com |
| SMTP_PASS | Contrasena de aplicacion | xxxx xxxx xxxx xxxx |
| DATABASE_PATH | Path de BD (opcional) | ./data/database.db |

## CONFIGURAR GMAIL SMTP

1. Ve a https://myaccount.google.com/security
2. Activa "Verificacion en 2 pasos"
3. Ve a "Contrasenas de aplicacion"
4. Genera una nueva contrasena para "Correo"
5. Usa esa contrasena en SMTP_PASS

## ESTRUCTURA DEL PROYECTO

```
PAGINA/
├── server.js          # Servidor Express
├── db.js              # Configuracion SQLite
├── index.html         # Frontend (HTML/CSS/JS)
├── styles.css         # Estilos
├── auth.js            # Sistema de autenticacion
├── permissions.js     # Sistema de permisos RBAC
├── database.js       # Base de datos simulada (frontend)
├── package.json       # Dependencias
├── .env               # Variables de entorno (NOCommitear)
├── .env.example       # Template de variables
└── database.db        # Base de datos SQLite (generada)
```

## DESPLIEGUE EN RAILWAY (PASO A PASO)

1. Ve a https://railway.app
2. Inicia sesion con GitHub
3. Click "New Project" -> "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. En "Variables" anade:
   - SMTP_USER = tuemail@gmail.com
   - SMTP_PASS = tu_contrasena_de_aplicacion
6. Railway detectara Node.js automaticamente
7. Esperaa que despliegue (2-3 minutos)
8. Click en el dominio generado para ver tu sitio

## NOTAS IMPORTANTES

- La base de datos SQLite es persistente en Railway/Render
- El email solo funciona con contrasenas de aplicacion de Gmail
- El frontend y backend estan en el mismo servidor Express
