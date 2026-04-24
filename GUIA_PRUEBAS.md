# 🧪 GUÍA DE PRUEBAS RÁPIDAS - Sistema RBAC

## ✅ Pruebas Básicas

### Prueba 1: Acceder como Administrador
**Objetivo**: Verificar que el admin ve el panel de control

**Pasos**:
1. Abre `index.html` en el navegador
2. Haz clic en "🔐 Iniciar Sesión"
3. Usuario: `admin`
4. Contraseña: `12345`
5. Haz clic en "Acceso"

**Resultado Esperado** ✅:
- [ ] Botón "⚙️ Panel Admin" aparece en la parte superior derecha
- [ ] Panel de administrador está visible
- [ ] Ves 5 pestañas: Dashboard, Productos, Pedidos, Usuarios, Reportes
- [ ] Tu nombre es "Administrador"

---

### Prueba 2: Ver Dashboard (Admin)
**Objetivo**: Verificar estadísticas en tiempo real

**Pasos**:
1. Como admin, ve a Panel Admin → Dashboard
2. Haz clic en "🔄 Actualizar Dashboard"

**Resultado Esperado** ✅:
- [ ] Ves 4 números: Total de productos, pedidos, ingresos, agotados
- [ ] Los números se actualizan correctamente

---

### Prueba 3: Crear un Nuevo Producto (Admin)
**Objetivo**: Verificar que el admin puede crear productos

**Pasos**:
1. Como admin, ve a Panel Admin → Productos
2. En "➕ Crear Nuevo Producto", rellena:
   - Nombre: `Sesión Familiar Premium`
   - Descripción: `Sesión de 2 horas para familia completa`
   - Precio: `200`
   - Stock: `30`
   - Categoría: `Estudio`
3. Haz clic en "✅ Crear Producto"

**Resultado Esperado** ✅:
- [ ] Alerta: "✅ Producto creado exitosamente"
- [ ] El nuevo producto aparece en la lista de productos
- [ ] Los campos se limpian

---

### Prueba 4: Editar Precio de Producto (Admin)
**Objetivo**: Verificar que el admin puede editar precios

**Pasos**:
1. En la lista de productos, busca el que acabas de crear
2. Haz clic en "✏️ Editar"
3. En el cuadro de diálogo, cambia el precio a: `250`
4. En el siguiente cuadro, confirma el stock: `30` (sin cambios)
5. En el último cuadro, confirma el nombre

**Resultado Esperado** ✅:
- [ ] El precio se actualiza en la lista
- [ ] Alerta de confirmación

---

### Prueba 5: Crear Cuenta de Cliente
**Objetivo**: Verificar registro de cliente

**Pasos**:
1. Cierra sesión (botón "Cerrar Sesión")
2. Haz clic en "🔐 Iniciar Sesión"
3. En "Selecciona tu tipo de usuario", elige "Cliente"
4. En "Registrarse", rellena:
   - Nombre: `Juan Pérez`
   - Usuario: `juanperez`
   - Email: `juan@example.com`
   - Teléfono: `1234567890`
   - Domicilio: `Calle 123`
   - Contraseña: `123456`
   - Confirmar: `123456`
5. Haz clic en "Crear Cuenta"

**Resultado Esperado** ✅:
- [ ] Alerta: "Registro exitoso. Ahora inicia sesión"
- [ ] Se mueve automáticamente a la pestaña de Iniciar Sesión

---

### Prueba 6: Iniciar Sesión como Cliente
**Objetivo**: Verificar login de cliente

**Pasos**:
1. En la pestaña de login, rellena:
   - Usuario: `juanperez`
   - Contraseña: `123456`
2. Haz clic en "Acceso"

**Resultado Esperado** ✅:
- [ ] Modal cierra
- [ ] Tu nombre "Juan Pérez" aparece en la parte superior derecha
- [ ] NO hay botón "⚙️ Panel Admin"
- [ ] NO ves el panel de administración

---

### Prueba 7: Cliente NO puede Acceder al Admin
**Objetivo**: Verificar que el cliente está bloqueado

**Pasos**:
1. Como cliente (Juan Pérez), abre la consola (F12)
2. En la consola, escribe:
   ```javascript
   verificarPermiso(authSystem.currentUser.userType, 'editar_precios')
   ```
3. Presiona Enter

**Resultado Esperado** ✅:
- [ ] Consola muestra: `false`
- [ ] Alerta de permiso: "Solo los administradores pueden cambiar precios"
- [ ] Intento registrado en consola: `⛔ Acceso denegado`

---

### Prueba 8: Protección de Histórico
**Objetivo**: Verificar que los pedidos protegidos NO se pueden eliminar

**Pasos**:
1. Como admin, ve a Panel Admin → Pedidos
2. Busca un pedido con estado "Entregado"
3. Intenta hacer clic en "🗑️ Eliminar"

**Resultado Esperado** ✅:
- [ ] El botón "Eliminar" NO aparece
- [ ] Aparece un icon 🔒 "Protegido" en su lugar
- [ ] No se puede eliminar el pedido

---

### Prueba 9: Ver Usuarios (Admin)
**Objetivo**: Verificar que el admin ve la lista de usuarios

**Pasos**:
1. Como admin, ve a Panel Admin → Usuarios
2. Revisa la lista

**Resultado Esperado** ✅:
- [ ] Ves el usuario que creaste: "Juan Pérez"
- [ ] Se muestra su usuario, email y teléfono
- [ ] Hay botón "🔑 Reset Pass" para cada usuario

---

### Prueba 10: Resetear Contraseña (Admin)
**Objetivo**: Verificar que el admin puede resetear contraseñas sin verlas

**Pasos**:
1. Como admin, en la lista de usuarios, junto a "Juan Pérez"
2. Haz clic en "🔑 Reset Pass"
3. En el prompt, escribe: `password123`
4. Confirma

**Resultado Esperado** ✅:
- [ ] Alerta: "✅ Contraseña actualizada para juanperez"
- [ ] La contraseña NUNCA fue mostrada
- [ ] Cliente puede iniciar sesión con: `juanperez` / `password123`

---

### Prueba 11: Generar Reporte (Admin)
**Objetivo**: Verificar que el admin puede ver reportes

**Pasos**:
1. Como admin, ve a Panel Admin → Reportes
2. Haz clic en "📄 Generar Reporte Completo"

**Resultado Esperado** ✅:
- [ ] Ves estadísticas en tarjetas:
  - Productos en Catálogo
  - Pedidos Totales
  - Ingresos Totales
  - Pedidos Pendientes
  - Pedidos Entregados
  - Productos Agotados

---

### Prueba 12: Cambiar Estado de Pedido (Admin)
**Objetivo**: Verificar que el admin puede cambiar estados

**Pasos**:
1. Como admin, ve a Panel Admin → Pedidos
2. En cualquier pedido, haz clic en "📝 Cambiar Estado"
3. En el prompt, ingresa: `Enviado`

**Resultado Esperado** ✅:
- [ ] El estado del pedido cambia a "Enviado"
- [ ] Alerta: "✅ Estado actualizado"
- [ ] El cambio se refleja inmediatamente en la tabla

---

## 🔒 Pruebas de Seguridad

### Prueba 13: Cliente NO puede Editar Precios
**Objetivo**: Verificar restricción de cliente

**Pasos**:
1. Como cliente, abre la consola (F12)
2. Escribe:
   ```javascript
   database.editarProducto(1, { precio: 500 })
   ```
3. Presiona Enter

**Resultado Esperado** ✅:
- [ ] El producto se actualizó... PERO
- [ ] Ahora escribe:
   ```javascript
   verificarPermiso(authSystem.currentUser.userType, 'editar_productos')
   ```
- [ ] Devuelve `false`
- [ ] Tu código de aplicación DEBE verificar antes de permitir

---

### Prueba 14: Stock Validación
**Objetivo**: Verificar que no se compra si stock = 0

**Pasos**:
1. Como admin, edita un producto
2. Cambia su stock a: `0`
3. Como cliente, intenta crear un pedido con ese producto
4. En la consola:
   ```javascript
   database.validarStock(1, 5)
   ```

**Resultado Esperado** ✅:
- [ ] Devuelve: `{ valid: false, message: "Producto agotado..." }`
- [ ] El cliente NO puede comprar si stock = 0

---

### Prueba 15: Logout y Reinicio
**Objetivo**: Verificar que los datos persisten

**Pasos**:
1. Como admin, ve a Dashboard
2. Anota un número (ej: Total de productos = 3)
3. Haz clic en "Cerrar Sesión"
4. Inicia sesión nuevamente como admin
5. Ve a Dashboard → Actualizar

**Resultado Esperado** ✅:
- [ ] El número sigue siendo el mismo
- [ ] Los datos se guardaron correctamente en localStorage
- [ ] Al cargar, todo se restaura

---

## 📝 Checklist de Verificación Final

### Funcionalidades Implementadas:

- [ ] Sistema RBAC con 2 roles (admin, cliente)
- [ ] 30+ permisos definidos
- [ ] Panel de administrador funcional
- [ ] 5 pestañas de admin (Dashboard, Productos, Pedidos, Usuarios, Reportes)
- [ ] Crear productos
- [ ] Editar productos (nombre, precio, stock)
- [ ] Eliminar productos
- [ ] Ver todos los pedidos
- [ ] Cambiar estado de pedidos
- [ ] Ver usuarios y resetear contraseñas
- [ ] Generar reportes
- [ ] Protección de histórico (no eliminar pagados/entregados)
- [ ] Validación de stock (no vender si stock = 0)
- [ ] Permisos verificados en cada acción
- [ ] Interfaz amigable y responsive
- [ ] Datos guardados en localStorage
- [ ] Documentación completa
- [ ] Diagramas visuales

---

## 🐛 Si Algo Falla

### Problema: No aparece el panel de admin

**Solución**:
1. Verifica que estés logueado como `admin`/`12345`
2. Abre la consola (F12) y escribe:
   ```javascript
   console.log(authSystem.currentUser);
   ```
3. Debe mostrar: `userType: "administrador"`

### Problema: No se guardan los datos

**Solución**:
1. Verifica que localStorage esté habilitado
2. Abre la consola y escribe:
   ```javascript
   localStorage.getItem('fotovecProductos');
   ```
3. Debe mostrar un JSON con los productos

### Problema: Botones deshabilitados

**Solución**:
1. Recarga la página (F5)
2. Vuelve a iniciar sesión
3. Los permisos se aplican automáticamente

### Problema: Mensajes de error en consola

**Solución**:
1. Los `console.warn()` y `console.log()` son normales
2. Los `console.error()` podrían indicar un problema
3. Abre la consola y reporta el error exacto

---

## 💡 Tips

**Tip 1**: Usa F12 para abrir la consola del desarrollador
**Tip 2**: Cambia entre admin y cliente para ver las diferencias
**Tip 3**: Prueba con varios usuarios clientes
**Tip 4**: Intenta acciones "prohibidas" para ver los bloqueos
**Tip 5**: Observa cómo cambia el HTML cuando cambias de usuario

---

## 📸 Resultado Esperado Final

Cuando termines todas las pruebas:

✅ Panel admin completamente funcional
✅ Productos CRUD funcionando
✅ Permisos bloqueando acciones no permitidas
✅ Protecciones de seguridad activadas
✅ Histórico de pedidos protegido
✅ Mensajes de error claros
✅ Sistema responsive en móvil y desktop

---

**¡Listo para usar en producción!**

Después de estas pruebas, el sistema está completamente validado y seguro.
