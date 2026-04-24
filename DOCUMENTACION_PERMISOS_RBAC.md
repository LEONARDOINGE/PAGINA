# 🔐 Sistema de Permisos RBAC - Documentación Completa

## 📋 Descripción General

Se ha implementado un **Control de Acceso Basado en Roles (RBAC)** en la aplicación FotoTec. Este sistema controla qué puede hacer cada usuario según su rol: **Administrador** o **Cliente**.

---

## 👥 Roles y Permisos

### 1. **ADMINISTRADOR**
El administrador tiene acceso completo a la gestión del sistema.

#### Permisos principales:
- ✅ **Gestión de Productos**: Ver, crear, editar, eliminar productos y precios
- ✅ **Gestión de Pedidos**: Ver todos los pedidos, cambiar estados, cancelar
- ✅ **Gestión de Usuarios**: Ver usuarios, resetear contraseñas
- ✅ **Configuración**: Editar configuración del sistema
- ✅ **Reportes**: Generar reportes y estadísticas
- ✅ **Panel Admin**: Acceso al panel de administración completo

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `12345`

### 2. **CLIENTE**
Los clientes tienen acceso limitado solo a funcionalidades que les conciernen.

#### Permisos principales:
- ✅ Ver productos (NO editar)
- ✅ Crear pedidos
- ✅ Ver solo sus propios pedidos
- ✅ Editar su perfil personal
- ✅ Cambiar su contraseña
- ❌ NO puede ver panel de administrador
- ❌ NO puede editar productos
- ❌ NO puede cambiar precios
- ❌ NO puede ver pedidos de otros clientes

---

## 🛠️ Estructura de Archivos

### Archivos Nuevos Creados:

#### 1. **permissions.js**
- Define el sistema RBAC completo
- Funciones de verificación de permisos
- Control de visibilidad de elementos en el DOM
- Deshabilitación automática de campos

```javascript
// Verificar si un usuario tiene permiso
verificarPermiso(userType, accion)

// Mostrar/ocultar elementos según permisos
mostrarSiTienePermiso(elementId, userType, permiso)

// Deshabilitar botones
controlarBoton(buttonId, userType, permiso)
```

#### 2. **database.js**
- Simula una base de datos SQLite usando localStorage
- Métodos para CRUD de productos y pedidos
- Validaciones de seguridad
- Protección de histórico

```javascript
// Métodos de productos
database.crearProducto(nombre, descripcion, precio, stock, categoria)
database.editarProducto(productoId, datos)
database.eliminarProducto(productoId)
database.obtenerProductos()

// Métodos de pedidos
database.crearPedido(clienteId, clienteNombre, productos)
database.cambiarEstadoPedido(pedidoId, nuevoEstado)
database.obtenerPedidos(clienteId)
database.eliminarPedido(pedidoId) // Con protecciones
```

#### 3. **index.html** (Modificado)
- Panel de administrador integrado
- Estilos RBAC
- Funciones de gestión del admin
- Verificación automática de permisos

---

## 🎯 Cómo Funciona

### Proceso de Verificación:

```
1. Usuario inicia sesión
2. Se asigna un `userType` (administrador o cliente)
3. Cada acción sensible verifica permisos:
   - ¿El usuario es administrador?
   - ¿Tiene el permiso específico?
4. Si NO tiene permiso → ❌ Acción bloqueada
5. Si SÍ tiene permiso → ✅ Acción permitida
```

### Ejemplo de Pseudocódigo:
```javascript
// Cuando se intenta editar un precio
function editarPrecio(productoId, nuevoPrecio) {
    if (!verificarPermiso(usuarioActual.userType, 'editar_precios')) {
        alert('Error: Solo los administradores pueden editar precios');
        return;
    }
    
    // Si llegamos aquí, el usuario tiene permiso
    database.editarProducto(productoId, { precio: nuevoPrecio });
    console.log('✅ Precio actualizado');
}
```

---

## 📊 Panel de Administrador

Cuando un administrador inicia sesión, puede acceder a:

### 1. **Dashboard** 📊
- Estadísticas generales
- Total de productos
- Total de pedidos
- Ingresos totales
- Productos agotados

### 2. **Productos** 📦
- **Ver**: Lista de todos los productos
- **Crear**: Agregar nuevo producto
- **Editar**: Cambiar nombre, precio, stock
- **Eliminar**: Remover productos

Campos editables:
- Nombre del producto
- Descripción
- Precio ($)
- Stock
- Categoría

### 3. **Pedidos** 🛒
- **Ver**: Todos los pedidos de todos los clientes
- **Cambiar estado**: Pendiente → Confirmado → Enviado → Entregado
- **Eliminar**: Solo si NO está protegido

Estados disponibles:
- 🟡 Pendiente
- 🟠 Confirmado
- 🟢 Enviado
- 🟢 Entregado
- 🔴 Cancelado

### 4. **Usuarios** 👥
- **Ver**: Lista de clientes registrados
- **Resetear contraseña**: Sin ver la contraseña actual (privacidad)

### 5. **Reportes** 📈
- Estadísticas completas
- Análisis de ingresos
- Pedidos pendientes vs entregados
- Productos agotados

---

## 🔒 Reglas de Seguridad Implementadas

### 1. **Protección de Historial Contable**
```javascript
// No se pueden eliminar pedidos pagados y entregados
if (pedido.protegido) {
    return { success: false, message: 'Protegido: no se puede eliminar' };
}
```

**Regla de Oro**: Un pedido se protege cuando:
- ✅ Ha sido entregado
- ✅ Y ha sido pagado

### 2. **Validación de Stock**
```javascript
// Bloquear compra si stock = 0
if (producto.stock === 0) {
    return { valid: false, message: 'Producto agotado' };
}
```

### 3. **Seguridad de Cuentas**
```javascript
// Admin puede resetear contraseña pero NO verla
function resetearContrasenaAdmin(username) {
    const newPass = prompt('Nueva contraseña:');
    // No se muestra la contraseña actual
    cliente.password = newPass;
}
```

### 4. **Restricción de Datos**
- Cada cliente solo ve **sus propios pedidos**
- No puede ver datos de otros clientes
- El admin ve **todos los pedidos y datos**

---

## 🧪 Pruebas

### Prueba 1: Admin crea producto
1. Inicia sesión con: `admin` / `12345`
2. Ve el panel de administrador con botón "⚙️ Panel Admin"
3. Haz clic en **Productos**
4. Rellena el formulario y crea un producto
5. Debe aparecer en la lista ✅

### Prueba 2: Admin edita precio
1. En la lista de productos, haz clic en "✏️ Editar"
2. Cambia el precio
3. El cambio debe guardarse ✅

### Prueba 3: Cliente NO puede editar
1. Crea una cuenta de cliente
2. Intenta acceder al panel admin
3. No verá el panel (está oculto) ✅
4. Si intenta editar por código, verá mensaje de error ✅

### Prueba 4: Protección de histórico
1. Admin crea un pedido
2. Marca como "Entregado"
3. El pedido se protege automáticamente
4. Admin NO puede eliminarlo (botón desaparece) ✅

---

## 💻 Cómo Usar en el Código

### 1. Verificar permiso antes de una acción:
```javascript
function miAccion() {
    if (!verificarPermiso(authSystem.currentUser.userType, 'editar_productos')) {
        return; // Acción bloqueada
    }
    
    // Código permitido solo para admin
    console.log('Editando producto...');
}
```

### 2. Mostrar/ocultar un botón según permisos:
```javascript
controlarBoton('btnEditar', authSystem.currentUser.userType, 'editar_productos');
```

### 3. Hacer un campo read-only:
```javascript
controlarCampo('precioProducto', authSystem.currentUser.userType, 'editar_precios');
```

### 4. Obtener todos los permisos de un rol:
```javascript
const permisos = permissionSystem.obtenerPermisosRol('administrador');
console.log(permisos); // Todos los permisos del admin
```

---

## 📝 Tabla de Permisos Completa

| Acción | Admin | Cliente |
|--------|-------|---------|
| **PRODUCTOS** |
| Ver productos | ✅ | ✅ |
| Editar productos | ✅ | ❌ |
| Crear productos | ✅ | ❌ |
| Eliminar productos | ✅ | ❌ |
| Editar precios | ✅ | ❌ |
| Editar stock | ✅ | ❌ |
| **PEDIDOS** |
| Ver todos los pedidos | ✅ | ❌ |
| Ver propios pedidos | ✅ | ✅ |
| Crear pedidos | ✅ | ✅ |
| Cambiar estado | ✅ | ❌ |
| Cancelar pedido | ✅ | ✅* |
| **USUARIOS** |
| Ver usuarios | ✅ | ❌ |
| Crear usuarios | ✅ | ❌ |
| Editar perfil propio | ✅ | ✅ |
| Cambiar contraseña propia | ✅ | ✅ |
| Resetear contraseña ajena | ✅ | ❌ |
| **CONFIGURACIÓN** |
| Editar configuración | ✅ | ❌ |
| Ver reportes | ✅ | ❌ |
| Ver estadísticas | ✅ | ❌ |
| Acceder panel admin | ✅ | ❌ |

*Solo puede cancelar sus propios pedidos pendientes

---

## 🚀 Próximas Mejoras

Para hacer el sistema aún más robusto:

1. **Backend Real**: Migrar de localStorage a un servidor Node.js/Express
2. **JWT Tokens**: Usar tokens para autenticación más segura
3. **Logs de Auditoría**: Registrar todas las acciones del admin
4. **Dos Factores**: Añadir autenticación de dos factores para admin
5. **Cifrado de Contraseñas**: Usar bcrypt para hashear contraseñas
6. **Roles Dinámicos**: Permitir crear roles personalizados
7. **Permisos Granulares**: Más niveles de detalle en permisos

---

## ❓ Preguntas Frecuentes

**P: ¿Dónde se guardan los datos?**
R: En `localStorage` del navegador. En producción deberían ir a una base de datos.

**P: ¿Puedo crear más roles?**
R: Sí, edita `permissionSystem.roles` en `permissions.js` y agrega un nuevo rol.

**P: ¿Cómo agregar un nuevo permiso?**
R: 
1. Agrégalo a `roles.administrador.permisos` en `permissions.js`
2. Verifica con `verificarPermiso()` en tu código

**P: ¿Qué pasa si un usuario intenta acceder sin permisos?**
R: Se muestra una alerta y la acción se bloquea. El intento se registra en consola.

**P: ¿Cómo reseteo los datos?**
R: Abre la consola de desarrollador y ejecuta:
```javascript
localStorage.removeItem('fotovecProductos');
localStorage.removeItem('fotovecPedidos');
localStorage.removeItem('fotovecClients');
```

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador (F12)
2. Verifica que estés logueado
3. Asegúrate de tener los permisos necesarios
4. Recarga la página (F5)

---

**Versión**: 1.0
**Última actualización**: Abril 2026
**Estado**: ✅ Sistema completo y funcional
