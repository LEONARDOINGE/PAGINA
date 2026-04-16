# FotoTec - Sistema de Autenticación

## ✅ Funcionalidades Implementadas

### 1. **Sistema de Login y Registro**
- Modal de autenticación con dos pestañas: "Iniciar Sesión" y "Registrarse"
- Los datos de usuarios se guardan en `localStorage` del navegador
- Contraseña mínima de 6 caracteres

### 2. **Registro de Nuevo Usuario**
Completa los siguientes datos:
- **Nombre Completo**: Tu nombre
- **Usuario**: Tu nombre de usuario (único)
- **Email**: Tu correo electrónico
- **Contraseña**: Mínimo 6 caracteres
- **Confirmar Contraseña**: Debe coincidir con la anterior

### 3. **Inicio de Sesión**
Puedes iniciar sesión con:
- Tu nombre de usuario, O
- Tu correo electrónico
- Tu contraseña

### 4. **Panel de Usuario**
Después de iniciar sesión:
- Verás tu nombre en la parte superior derecha del navbar
- Aparecerá un botón "Cerrar Sesión"
- Se muestra todo el contenido de la web

### 5. **Datos Guardados**
Los datos se guardan en el navegador utilizando `localStorage`, lo significa:
- Los usuarios persistirán aunque cierres el navegador
- Los datos se guardan localmente en tu computadora
- NO se envía a ningún servidor (almacenamiento local)

---

## 🔐 Ejemplo de Prueba

**Para probar el sistema:**

1. Abre la página en tu navegador
2. Haz clic en "Registrarse"
3. Completa el formulario:
   - Nombre: Gabriel García
   - Usuario: gabrgarcia
   - Email: gabriel@email.com
   - Contraseña: 123456
   - Confirmar: 123456
4. Haz clic en "Crear Cuenta"
5. Regresa a "Iniciar Sesión"
6. Ingresa: 
   - Usuario: gabrgarcia (o gabriel@email.com)
   - Contraseña: 123456
7. ¡Listo! Ya verás el sitio completo

---

## 📋 Notas Técnicas

- **Almacenamiento**: `localStorage` (local del navegador)
- **Seguridad**: En producción, usar HTTPS y encrypción
- **Contraseñas**: Se guardan en texto plano (usar bcrypt en producción)
- **Base de datos**: Actualmente local; se puede conectar a una API REST

---

## ⚙️ Mejoras Futuras Sugeridas

1. **Backend y Base de Datos**: Conectar a MySQL/MongoDB
2. **Encriptación**: Usar bcrypt para las contraseñas
3. **Recuperación de Contraseña**: Email de reset
4. **Perfil de Usuario**: Editar datos personales
5. **Autenticación Google/Facebook**: OAuth2
6. **Validación de Email**: Enviar código de confirmación

---

## 📝 Estructura de Datos (localStorage)

### `fotovecUsers` (Array de usuarios)
```json
[
  {
    "id": 1712000000000,
    "name": "Gabriel García",
    "username": "gabrgarcia",
    "email": "gabriel@email.com",
    "password": "123456",
    "createdAt": "14/4/2026 10:30:45"
  }
]
```

### `fotovecCurrentUser` (Usuario actual logeado)
```json
{
  "id": 1712000000000,
  "name": "Gabriel García",
  "username": "gabrgarcia",
  "email": "gabriel@email.com"
}
```

---

**¡Hecho! Tu sistema de autenticación está listo para usar.** ✨
