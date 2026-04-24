// ============ SISTEMA DE PERMISOS RBAC ============
// Control de Acceso Basado en Roles (Role-Based Access Control)

const permissionSystem = {
    // Definición de permisos por rol
    roles: {
        administrador: {
            nombre: 'Administrador',
            permisos: {
                // Gestión de Productos
                ver_productos: true,
                editar_productos: true,
                crear_productos: true,
                eliminar_productos: true,
                editar_precios: true,
                editar_stock: true,

                // Gestión de Usuarios
                ver_usuarios: true,
                crear_usuarios: true,
                editar_usuarios: true,
                eliminar_usuarios: true,
                cambiar_rol: true,
                resetear_contrasena: true,

                // Gestión de Pedidos
                ver_todos_pedidos: true,
                cambiar_estado_pedido: true,
                cancelar_pedido: true,
                ver_detalles_pedido: true,
                exportar_pedidos: true,

                // Configuración
                editar_configuracion: true,
                ver_reportes: true,
                ver_estadisticas: true,
                acceder_panel_admin: true
            }
        },
        cliente: {
            nombre: 'Cliente',
            permisos: {
                // Gestión de Productos
                ver_productos: true,
                editar_productos: false,
                crear_productos: false,
                eliminar_productos: false,
                editar_precios: false,
                editar_stock: false,

                // Gestión de Usuarios
                ver_usuarios: false,
                crear_usuarios: false,
                editar_usuarios: false,
                eliminar_usuarios: false,
                cambiar_rol: false,
                resetear_contrasena: false,

                // Gestión de Pedidos
                ver_todos_pedidos: false,
                cambiar_estado_pedido: false,
                cancelar_pedido: false,
                ver_detalles_pedido: true, // Solo los suyos
                exportar_pedidos: false,

                // Configuración
                editar_configuracion: false,
                ver_reportes: false,
                ver_estadisticas: false,
                acceder_panel_admin: false,

                // Acciones del cliente
                editar_perfil_propio: true,
                cambiar_contrasena_propia: true,
                crear_pedidos: true,
                ver_pedidos_propios: true
            }
        }
    },

    // Verificar si un usuario tiene un permiso específico
    tienePermiso(userType, permiso) {
        if (!userType) return false;
        
        const role = this.roles[userType];
        if (!role) return false;
        
        return role.permisos[permiso] || false;
    },

    // Verificar múltiples permisos (todos deben ser true)
    tieneTodosLosPermisos(userType, permisos) {
        return permisos.every(permiso => this.tienePermiso(userType, permiso));
    },

    // Verificar si el usuario tiene al menos uno de los permisos
    tieneAlgunPermiso(userType, permisos) {
        return permisos.some(permiso => this.tienePermiso(userType, permiso));
    },

    // Obtener todos los permisos de un rol
    obtenerPermisosRol(userType) {
        const role = this.roles[userType];
        if (!role) return {};
        return role.permisos;
    },

    // Verificar si es administrador
    esAdmin(userType) {
        return userType === 'administrador';
    },

    // Verificar si es cliente
    esCliente(userType) {
        return userType === 'cliente';
    },

    // Obtener descripción legible del rol
    obtenerNombreRol(userType) {
        const role = this.roles[userType];
        return role ? role.nombre : 'Desconocido';
    }
};

// ============ FUNCIÓN PARA VERIFICAR ACCIONES ============

/**
 * Verifica si un usuario puede realizar una acción
 * @param {string} userType - Tipo de usuario (administrador, cliente)
 * @param {string} accion - Acción a realizar (ej: 'editar_productos')
 * @returns {boolean} - true si tiene permiso, false si no
 */
function verificarPermiso(userType, accion) {
    if (!permissionSystem.tienePermiso(userType, accion)) {
        console.warn(`⛔ Acceso denegado: ${userType} intentó realizar ${accion}`);
        mostrarAlertaPermiso(accion);
        return false;
    }
    return true;
}

/**
 * Muestra una alerta cuando se intenta una acción no permitida
 * @param {string} accion - La acción que fue bloqueada
 */
function mostrarAlertaPermiso(accion) {
    const mensajes = {
        'editar_productos': 'Solo los administradores pueden editar productos.',
        'editar_precios': 'Solo los administradores pueden cambiar precios.',
        'cambiar_estado_pedido': 'Solo los administradores pueden cambiar el estado de pedidos.',
        'ver_todos_pedidos': 'Solo puedes ver tus propios pedidos.',
        'editar_configuracion': 'Solo los administradores pueden editar la configuración.'
    };

    const mensaje = mensajes[accion] || 'No tienes permiso para realizar esta acción.';
    alert('⛔ Permiso denegado\n\n' + mensaje);
}

// ============ CONTROLAR VISIBILIDAD DE ELEMENTOS EN EL DOM ============

/**
 * Muestra/oculta un elemento si el usuario tiene permiso
 * @param {string} elementId - ID del elemento
 * @param {string} userType - Tipo de usuario
 * @param {string} permiso - Permiso requerido
 */
function mostrarSiTienePermiso(elementId, userType, permiso) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        if (permissionSystem.tienePermiso(userType, permiso)) {
            elemento.style.display = 'block';
            elemento.classList.remove('oculto-por-permisos');
        } else {
            elemento.style.display = 'none';
            elemento.classList.add('oculto-por-permisos');
        }
    }
}

/**
 * Deshabilita/habilita un botón según permisos
 * @param {string} buttonId - ID del botón
 * @param {string} userType - Tipo de usuario
 * @param {string} permiso - Permiso requerido
 */
function controlarBoton(buttonId, userType, permiso) {
    const boton = document.getElementById(buttonId);
    if (boton) {
        if (!permissionSystem.tienePermiso(userType, permiso)) {
            boton.disabled = true;
            boton.style.opacity = '0.5';
            boton.style.cursor = 'not-allowed';
            boton.title = 'No tienes permiso para esta acción';
        } else {
            boton.disabled = false;
            boton.style.opacity = '1';
            boton.style.cursor = 'pointer';
            boton.title = '';
        }
    }
}

/**
 * Hace un campo readonly si el usuario no tiene permiso
 * @param {string} fieldId - ID del campo
 * @param {string} userType - Tipo de usuario
 * @param {string} permiso - Permiso requerido
 */
function controlarCampo(fieldId, userType, permiso) {
    const campo = document.getElementById(fieldId);
    if (campo) {
        if (!permissionSystem.tienePermiso(userType, permiso)) {
            campo.readOnly = true;
            campo.style.backgroundColor = '#f0f0f0';
            campo.style.cursor = 'not-allowed';
        } else {
            campo.readOnly = false;
            campo.style.backgroundColor = '';
            campo.style.cursor = 'auto';
        }
    }
}

// ============ APLICAR PERMISOS AL CARGAR LA PÁGINA ============

/**
 * Aplica los permisos al DOM basándose en el usuario actual
 * Solo se ejecuta si hay un usuario autenticado
 */
function aplicarPermisosAlDOM() {
    if (!authSystem.currentUser) return;

    const userType = authSystem.currentUser.userType;

    // Ejemplos de controles:
    if (userType === 'administrador') {
        // Mostrar panel de administrador
        mostrarSiTienePermiso('adminPanel', userType, 'acceder_panel_admin');
        
        // Habilitar botones de edición
        controlarBoton('btnEditarProductos', userType, 'editar_productos');
        controlarBoton('btnEditarPrecios', userType, 'editar_precios');
        controlarBoton('btnVerReportes', userType, 'ver_reportes');
    } else if (userType === 'cliente') {
        // Ocultar panel de administrador
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }

        // Hacer campos readonly
        controlarCampo('precioProducto', userType, 'editar_precios');
        controlarCampo('stockProducto', userType, 'editar_stock');
    }
}

// Aplicar permisos cuando carga la página
window.addEventListener('load', aplicarPermisosAlDOM);
