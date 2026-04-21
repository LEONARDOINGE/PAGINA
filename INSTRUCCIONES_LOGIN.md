# 🔐 Sistema de Login - FOTOTEC

## Descripción
Se ha agregado un sistema completo de autenticación que permite:
- **Clientes**: Registrarse con sus datos personales e iniciar sesión
- **Administrador**: Acceso restringido solo con usuario y contraseña

---

## 📱 Cómo Funciona

### 1️⃣ Botón de Inicio de Sesión
Haz clic en el botón **"🔐 Iniciar Sesión"** en la barra de navegación (esquina superior derecha o menú móvil).

### 2️⃣ Selecciona el Tipo de Usuario
Se abrirá una modal con dos opciones:
- **👤 Cliente**: Para clientes nuevos o registrados
- **👨‍💼 Administrador**: Para personal de administración

---

## 👤 Flujo para Clientes

### Registro (Primera vez)
1. Selecciona **"Cliente"**
2. Completa el formulario de registro:
   - Nombre Completo *
   - Correo Electrónico *
   - Teléfono (opcional)
   - Dirección (opcional)
   - Nombre de Usuario *
   - Contraseña * (mínimo 6 caracteres)
   - Confirmar Contraseña *
3. Haz clic en **"Crear Cuenta"**
4. Se te redirige automáticamente al login

### Inicio de Sesión
1. Selecciona **"Cliente"** (después del registro)
2. Ingresa:
   - Usuario o Email
   - Contraseña
3. Haz clic en **"Iniciar Sesión"**
4. ✅ Verás tu nombre en la esquina superior con opción de cerrar sesión

---

## 👨‍💼 Flujo para Administrador

### Credenciales por Defecto
- **Usuario**: `admin`
- **Contraseña**: `12345`

### Inicio de Sesión
1. Selecciona **"Administrador"**
2. Ingresa:
   - Usuario: `admin`
   - Contraseña: `12345`
3. Haz clic en **"Acceder"**
4. ✅ Verás "👨‍💼 Administrador" en la esquina superior

---

## 💾 Almacenamiento de Datos

### Clientes
- Se guardan en `localStorage` bajo la clave `fotovecClients`
- Contiene:
  - ID único
  - Nombre completo
  - Email
  - Teléfono
  - Dirección
  - Usuario
  - Contraseña
  - Fecha de creación

### Administrador
- Credenciales codificadas en el JavaScript
- Para cambiar la contraseña, edita `authSystem.admins` en el script

---

## 🔧 Personalización

### Cambiar Credenciales de Administrador
Busca en el archivo `index.html`, en la sección JavaScript:
```javascript
admins: [
    { id: 1, username: 'admin', password: '12345' }
]
```
Modifica `username` y `password` con tus valores deseados.

### Agregar Más Administradores
```javascript
admins: [
    { id: 1, username: 'admin', password: '12345' },
    { id: 2, username: 'gerente', password: 'contraseña123' }
]
```

---

## ⚠️ Notas Importantes

1. **Seguridad en Desarrollo**: Las contraseñas se guardan sin encriptar. En producción, implementa encriptación SSL/TLS.
2. **LocalStorage**: Los datos se borran si se limpia el cache del navegador.
3. **Validación**: 
   - Las contraseñas deben tener mínimo 6 caracteres
   - No se permite usuarios o emails duplicados
   - El email debe ser válido

---

## 🎯 Flujo Visual Resumido

```
Botón Login
    ↓
¿Tipo de Usuario?
    ├─→ Cliente
    │   ├─→ ¿Registrado? NO
    │   │   └─→ Registro + Login
    │   └─→ ¿Registrado? SÍ
    │       └─→ Login directo
    └─→ Administrador
        └─→ Login restringido
            ↓
        ✅ Acceso Exitoso
```

---

## 🐛 Solución de Problemas

**No puedo crear cuenta**
- Verifica que el usuario no esté ya registrado
- Verifica que el email no esté registrado
- Asegúrate de que la contraseña tenga al menos 6 caracteres

**No puedo iniciar sesión**
- Verifica usuario/email y contraseña
- Asegúrate de haber completado el registro
- Limpia el cache si los datos no se guardan

**Los datos desaparecieron**
- Se borran al limpiar localStorage del navegador
- Solución: No limpies localStorage o implementa una base de datos

---

## 📝 Próximas Mejoras Sugeridas

- [ ] Encriptación de contraseñas (bcrypt o similar)
- [ ] Base de datos (Firebase, MySQL, MongoDB)
- [ ] Email de confirmación
- [ ] Recuperación de contraseña
- [ ] Autenticación de dos factores (2FA)
- [ ] Registro de actividad de administrador
- [ ] Diferentes niveles de permisos

---

**Creado**: 20 de abril de 2026
**Versión**: 1.0
