# 🔐 Diagrama del Sistema de Permisos RBAC

## Flujo de Verificación de Permisos

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO INTENTA UNA ACCIÓN                   │
│                    (ej: Editar Precio)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              ¿EXISTE USUARIO AUTENTICADO?                       │
│              if (authSystem.currentUser === null)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              NO ✗                      SÍ ✓
              │                         │
              ▼                         ▼
        ❌ BLOQUEADO              ┌─────────────────────┐
        Debe iniciar sesión       │ Obtener userType    │
                                  │ (admin / cliente)   │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                            ┌────────────────────────────────────┐
                            │ verificarPermiso(userType, accion) │
                            └────────────┬─────────────────────┘
                                         │
                          ┌──────────────┴──────────────┐
                          │                             │
                    ADMINISTRADOR               CLIENTE
                    (admin)                     (cliente)
                          │                             │
                ┌─────────────────────┐       ┌─────────────────────┐
                │ Buscar en roles     │       │ Buscar en roles     │
                │ permisos[accion]    │       │ permisos[accion]    │
                └─────────┬───────────┘       └──────────┬──────────┘
                          │                             │
              ┌───────────┴───────────┐    ┌────────────┴────────────┐
              │                       │    │                         │
         ✅ true (PERMITE)     ❌ false (BLOQUEA)
         Acción Permitida              Acción Bloqueada
              │                        │
              ▼                        ▼
      ┌──────────────────┐     ┌──────────────────┐
      │ Ejecutar acción  │     │ Mostrar alerta   │
      │ database.edit()  │     │ "Acceso denegado"│
      │ console.log(✅)  │     │ console.warn(⛔) │
      └──────────────────┘     └──────────────────┘
```

---

## Tabla de Permisos por Rol

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MATRIZ DE PERMISOS                            │
├────────────────────────┬──────────────────┬──────────────────────────┤
│        ACCIÓN          │   ADMINISTRADOR  │       CLIENTE            │
├────────────────────────┼──────────────────┼──────────────────────────┤
│ ver_productos          │       ✅         │           ✅             │
│ editar_productos       │       ✅         │           ❌             │
│ crear_productos        │       ✅         │           ❌             │
│ eliminar_productos     │       ✅         │           ❌             │
│ editar_precios         │       ✅         │           ❌             │
│ editar_stock           │       ✅         │           ❌             │
├────────────────────────┼──────────────────┼──────────────────────────┤
│ ver_todos_pedidos      │       ✅         │           ❌             │
│ ver_pedidos_propios    │       ✅         │           ✅             │
│ cambiar_estado_pedido  │       ✅         │           ❌             │
│ cancelar_pedido        │       ✅         │           ✅*            │
│ crear_pedidos          │       ✅         │           ✅             │
├────────────────────────┼──────────────────┼──────────────────────────┤
│ ver_usuarios           │       ✅         │           ❌             │
│ crear_usuarios         │       ✅         │           ❌             │
│ resetear_contrasena    │       ✅         │           ❌             │
│ editar_perfil_propio   │       ✅         │           ✅             │
│ cambiar_contrasena     │       ✅         │           ✅             │
├────────────────────────┼──────────────────┼──────────────────────────┤
│ editar_configuracion   │       ✅         │           ❌             │
│ ver_reportes           │       ✅         │           ❌             │
│ acceder_panel_admin    │       ✅         │           ❌             │
├────────────────────────┴──────────────────┴──────────────────────────┤
│ * = Solo sus propios pedidos                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Datos de Usuario

```javascript
// ADMINISTRADOR
currentUser = {
    id: 1,
    name: "Administrador",
    username: "admin",
    userType: "administrador",  ← Define qué puede hacer
    permisos: {
        editar_productos: true,
        editar_precios: true,
        ver_todos_pedidos: true,
        ... (30+ permisos)
    }
}

// CLIENTE
currentUser = {
    id: 1234567890,
    name: "Juan Pérez",
    username: "juanperez",
    email: "juan@email.com",
    userType: "cliente",  ← Restricciones de acceso
    permisos: {
        editar_productos: false,
        editar_precios: false,
        ver_todos_pedidos: false,
        ver_pedidos_propios: true,
        crear_pedidos: true
    }
}
```

---

## Gestión de Permisos en el DOM

```
┌──────────────────────────────────────────────────────────────┐
│               ELEMENTO DEL HTML                              │
│          <input id="precioProducto" />                       │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│   controlarCampo('precioProducto', 'cliente', 'editar_precios')│
└────────┬─────────────────────────────────────────────────────┘
         │
         ├─ ¿Es cliente? SÍ
         ├─ ¿Tiene permiso 'editar_precios'? NO
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│  campo.readOnly = true;                                      │
│  campo.style.backgroundColor = '#f0f0f0';                    │
│  campo.style.cursor = 'not-allowed';                         │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
    RESULTADO VISUAL:
    ┌─────────────────────┐
    │ 50          │ (gris, no editable)
    └─────────────────────┘
```

---

## Proceso de Creación de Producto (Admin Only)

```
ADMIN quiere crear un nuevo producto

    ┌─────────────────────────────────────────┐
    │ 1. FORMULARIO VISIBLE                   │
    │    (Solo para administrador)             │
    └─────────────────────────────────────────┘
                    ▼
    ┌─────────────────────────────────────────┐
    │ 2. Rellena:                              │
    │    - Nombre: "Sesión Premium"           │
    │    - Precio: 150                        │
    │    - Stock: 50                          │
    │    - Categoría: Estudio                 │
    └─────────────────────────────────────────┘
                    ▼
    ┌─────────────────────────────────────────┐
    │ 3. Hace clic en "Crear Producto"        │
    └─────────────────────────────────────────┘
                    ▼
    ┌─────────────────────────────────────────┐
    │ 4. verificarPermiso(admin, crear_productos)
    │    ¿Admin tiene permiso? SÍ ✅           │
    └─────────────────────────────────────────┘
                    ▼
    ┌─────────────────────────────────────────┐
    │ 5. database.crearProducto(...)          │
    │    Guardar en localStorage               │
    └─────────────────────────────────────────┘
                    ▼
    ┌─────────────────────────────────────────┐
    │ 6. alert('✅ Producto creado')           │
    │    Actualizar lista de productos        │
    └─────────────────────────────────────────┘

Cliente intenta lo mismo:
    └─── NO verá el formulario (está oculto) ❌
    └─── Si intenta por código, verá alerta de permiso ❌
```

---

## Ciclo de Vida de un Pedido (Protecciones)

```
CLIENTE crea pedido
    │
    ▼
┌────────────┐
│ Pendiente  │ ← Admin puede ver y cambiar estado
│ (Nuevo)    │
└────────────┘
    │
    ▼ (Admin cambia estado)
┌────────────┐
│Confirmado  │ ← Cliente puede ver en su panel
│            │
└────────────┘
    │
    ▼ (Admin cambia estado)
┌────────────┐
│ Enviado    │ ← Cliente notificado
│            │
└────────────┘
    │
    ▼ (Cliente paga + Admin entrega)
┌────────────┐
│Entregado   │ ← PROTEGIDO AUTOMÁTICAMENTE 🔒
│ (Pagado)   │   NO se puede eliminar
│            │   NO se puede modificar
│            │   Registrado en historial contable
└────────────┘
    │
    ✗ El admin NO puede eliminarlo después
    ✗ Razón: Protección de historial contable
```

---

## Validaciones de Seguridad

### 1. Validación de Stock

```
Cliente intenta comprar 5 sesiones

    ├─ ¿Producto existe? → SÍ ✅
    │
    ├─ ¿Stock disponible? → database.validarStock()
    │  │
    │  ├─ ¿Stock = 0? → SÍ ❌ → BLOQUEADO
    │  │  "Producto agotado"
    │  │
    │  └─ ¿Stock >= 5? → SÍ ✅ → PERMITIDO
    │
    └─ Crear pedido y actualizar stock
```

### 2. Protección de Histórico Contable

```
Admin intenta eliminar un pedido entregado

    ├─ ¿Pedido existe? → SÍ ✅
    │
    ├─ ¿Está protegido? → database.pedido.protegido = true
    │  │
    │  └─ SÍ ❌ → BLOQUEADO
    │     "No se pueden eliminar pedidos pagados y entregados"
    │
    └─ Botón "Eliminar" no aparece para pedidos protegidos
```

### 3. Privacidad de Contraseñas

```
Admin resetea contraseña de cliente

    ├─ Solicita nueva contraseña (NO muestra la actual)
    │  
    ├─ Nueva contraseña = prompt('Nueva contraseña:')
    │
    ├─ Actualiza: cliente.password = newPass
    │
    └─ Cliente puede iniciar sesión con nueva contraseña
```

---

## Flujo de Login

```
┌─────────────────────────┐
│ Usuario abre Modal de   │
│ Autenticación           │
└────────────┬────────────┘
             │
      ┌──────┴──────┐
      │              │
   Opción 1      Opción 2
   Registrarse    Iniciar Sesión
      │              │
      ▼              ▼
   ┌────────┐   ┌──────────────┐
   │ Cliente │   │ ¿Quién eres? │
   │ Nuevo  │   │              │
   └────┬───┘   └──────┬───────┘
        │              │
        │         ┌────┴─────┐
        │         │           │
        │      Cliente    Admin
        │         │           │
        │         ▼           ▼
        │    ┌────────┐   ┌────────┐
        │    │usuario:│   │usuario:│
        │    │pass:   │   │admin   │
        │    └────┬───┘   │pass:12 │
        │         │       │345     │
        └─────┬───┘       └───┬────┘
              │               │
              └───────┬───────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ Verificar en localStorage   │
        │ ¿Usuario existe?            │
        └────────────┬────────────────┘
                     │
            ┌────────┴────────┐
            │                 │
          SÍ ✅             NO ❌
            │                 │
            ▼                 ▼
      ┌──────────┐      ┌──────────────┐
      │Obtener   │      │Mostrar error │
      │userType  │      │Usuario o     │
      │          │      │contraseña    │
      │(admin/   │      │incorrectos   │
      │ cliente) │      └──────────────┘
      └─────┬────┘
            │
            ▼
    ┌───────────────────┐
    │ Guardar en        │
    │ localStorage      │
    │ currentUser       │
    │ {id, name,        │
    │  userType}        │
    └────────┬──────────┘
             │
             ▼
    ┌───────────────────┐
    │ Cerrar modal      │
    │ Mostrar perfil    │
    └────────┬──────────┘
             │
        ┌────┴────┐
        │          │
    Admin      Cliente
        │          │
        ▼          ▼
    ┌──────┐   ┌──────────┐
    │Panel │   │Nav normal│
    │Admin │   │sin admin │
    │✅    │   │❌        │
    └──────┘   └──────────┘
```

---

## Resumen Visual de Límites

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMINISTRADOR                            │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  ✅ Ver Todo      ✅ Editar      ✅ Crear            │  │
│   │  ✅ Eliminar      ✅ Reportes    ✅ Usuarios         │  │
│   │  ✅ Pedidos       ✅ Precios     ✅ Config           │  │
│   │                                                      │  │
│   │         🔑 ACCESO COMPLETO AL SISTEMA               │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE                                │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  ✅ Ver Productos  ✅ Crear Pedidos                  │  │
│   │  ✅ Ver Sus Pedidos ✅ Editar Perfil               │  │
│   │                                                      │  │
│   │  ❌ Editar Precios ❌ Ver Otros Pedidos            │  │
│   │  ❌ Panel Admin    ❌ Reportes                      │  │
│   │  ❌ Usuarios       ❌ Config                        │  │
│   │                                                      │  │
│   │     🔒 ACCESO LIMITADO Y SEGURO                    │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

Esta documentación visual ayuda a entender rápidamente cómo funciona el sistema de permisos RBAC implementado.
