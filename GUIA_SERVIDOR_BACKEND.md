# 🚀 Guía: Servidor Backend con Node.js/Express

## 📋 Archivos Creados

### 1. **server.js**
Servidor Express completo con:
- ✅ Autenticación de clientes (registro/login)
- ✅ Verificación de admin
- ✅ Integración con Nodemailer
- ✅ Envío de emails automáticos
- ✅ CORS habilitado
- ✅ Rutas REST API

### 2. **.env**
Archivo de configuración con:
- Puerto del servidor
- Credenciales SMTP (Gmail)
- Variables de entorno

---

## 🔧 Instalación

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Iniciar el servidor
```bash
npm start
```

o también:

```bash
node server.js
```

**Resultado esperado:**
```
╔════════════════════════════════════════╗
║   🚀 SERVIDOR FOTOTEC INICIADO        ║
╠════════════════════════════════════════╣
║   Puerto: 3000
║   URL: http://localhost:3000
║   ✅ CORS habilitado
║   📧 Nodemailer configurado
╚════════════════════════════════════════╝
```

---

## 📡 Rutas API Disponibles

### 🔐 Autenticación

#### Registrar cliente
```
POST /api/register

Body (JSON):
{
  "name": "Juan García",
  "username": "juangarcia",
  "email": "juan@example.com",
  "password": "micontraseña123"
}
```

#### Login de cliente
```
POST /api/login

Body (JSON):
{
  "usernameOrEmail": "juangarcia",
  "password": "micontraseña123"
}
```

#### Verificar credenciales de admin
```
POST /api/verificar-admin

Body (JSON):
{
  "username": "admin",
  "password": "12345"
}
```

### 📧 Email

#### Enviar email de reserva/pedido
```
POST /enviar-reserva

Body (JSON):
{
  "clientEmail": "juan@example.com",
  "clientName": "Juan García",
  "pedidoId": "12345",
  "productos": [
    {
      "nombre": "Sesión de Estudio",
      "cantidad": 2,
      "precio": 50
    }
  ],
  "total": 100
}
```

#### Test de conexión SMTP
```
GET /enviar-reserva/test
```

---

## 🧪 Pruebas con cURL

### Test 1: Registrar cliente
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test 2: SMTP Test
```bash
curl http://localhost:3000/enviar-reserva/test
```

---

## 📧 Configuración de Email (Gmail)

### Generar contraseña de aplicación
1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona: Mail - Windows Computer
3. Se generará una contraseña (16 caracteres)
4. Cópiala en `.env` como `SMTP_PASS`

---

## ✅ Checklist de Inicio

- [ ] Instalar dependencias: `npm install`
- [ ] Verificar `.env` con credenciales correctas
- [ ] Iniciar servidor: `npm start`
- [ ] Probar con `curl` o Postman
- [ ] Verificar emails recibidos

---

**✅ Backend completamente configurado y listo para usar**

Puerto: 3000
Fecha: Abril 2026
Estado: Operacional
