// ============ SISTEMA DE PERMISOS RBAC ============
// Control de Acceso Basado en Roles (Role-Based Access Control)
// FotoTec - Estudio Fotográfico

const permissionSystem = {
    // Definición de permisos por rol
    roles: {
        administrador: {
            nombre: 'Administrador',
            color: '#667eea',
            permisos: {
                // Módulo Productos/Servicios
                ver_productos: true,
                editar_productos: true,
                crear_productos: true,
                eliminar_productos: true,
                editar_precios: true,
                editar_stock: true,

                // Módulo CRM - Pedidos/Reservas
                ver_todos_pedidos: true,
                cambiar_estado_pedido: true,
                cancelar_pedido: true,
                ver_detalles_pedido: true,
                exportar_pedidos: true,
                ver_reservas: true,
                gestionar_reservas: true,

                // Módulo RH - Recursos Humanos
                ver_empleados: true,
                crear_empleados: true,
                editar_empleados: true,
                eliminar_empleados: true,
                ver_nominas: true,
                gestionar_nominas: true,
                ver_asistencias: true,
                gestionar_asistencias: true,
                ver_turnos: true,
                gestionar_turnos: true,

                // Módulo Compras
                ver_compras: true,
                crear_pedidos_compra: true,
                editar_pedidos_compra: true,
                eliminar_pedidos_compra: true,
                ver_gastos: true,

                // Módulo Proveedores
                ver_proveedores: true,
                crear_proveedores: true,
                editar_proveedores: true,
                eliminar_proveedores: true,
                ver_catalogo_proveedores: true,

                // Módulo Usuarios
                ver_usuarios: true,
                crear_usuarios: true,
                editar_usuarios: true,
                eliminar_usuarios: true,
                cambiar_rol: true,
                resetear_contrasena: true,

                // Módulo Dashboard/Reportes
                editar_configuracion: true,
                ver_reportes: true,
                ver_estadisticas: true,
                acceder_panel_admin: true,
                ver_dashboard_completo: true
            }
        },
        rh: {
            nombre: 'Recursos Humanos',
            color: '#e66767',
            permisos: {
                // Módulo Productos - SOLO LECTURA
                ver_productos: true,
                editar_productos: false,
                crear_productos: false,
                eliminar_productos: false,
                editar_precios: false,
                editar_stock: false,

                // Módulo CRM - SOLO LECTURA
                ver_todos_pedidos: false,
                cambiar_estado_pedido: false,
                cancelar_pedido: false,
                ver_detalles_pedido: false,
                exportar_pedidos: false,
                ver_reservas: true,
                gestionar_reservas: false,

                // Módulo RH - ACCESO TOTAL
                ver_empleados: true,
                crear_empleados: true,
                editar_empleados: true,
                eliminar_empleados: true,
                ver_nominas: true,
                gestionar_nominas: true,
                ver_asistencias: true,
                gestionar_asistencias: true,
                ver_turnos: true,
                gestionar_turnos: true,

                // Módulo Compras - BLOQUEADO
                ver_compras: false,
                crear_pedidos_compra: false,
                editar_pedidos_compra: false,
                eliminar_pedidos_compra: false,
                ver_gastos: false,

                // Módulo Proveedores - BLOQUEADO
                ver_proveedores: false,
                crear_proveedores: false,
                editar_proveedores: false,
                eliminar_proveedores: false,
                ver_catalogo_proveedores: false,

                // Módulo Usuarios - SOLO LECTURA EMPLEADOS
                ver_usuarios: false,
                crear_usuarios: false,
                editar_usuarios: false,
                eliminar_usuarios: false,
                cambiar_rol: false,
                resetear_contrasena: false,

                // Módulo Dashboard
                editar_configuracion: false,
                ver_reportes: true,
                ver_estadisticas: true,
                acceder_panel_admin: true,
                ver_dashboard_completo: false
            }
        },
        compras: {
            nombre: 'Compras',
            color: '#f39c12',
            permisos: {
                // Módulo Productos - SOLO LECTURA
                ver_productos: true,
                editar_productos: false,
                crear_productos: false,
                eliminar_productos: false,
                editar_precios: false,
                editar_stock: false,

                // Módulo CRM - SOLO LECTURA
                ver_todos_pedidos: true,
                cambiar_estado_pedido: false,
                cancelar_pedido: false,
                ver_detalles_pedido: true,
                exportar_pedidos: false,
                ver_reservas: false,
                gestionar_reservas: false,

                // Módulo RH - BLOQUEADO
                ver_empleados: false,
                crear_empleados: false,
                editar_empleados: false,
                eliminar_empleados: false,
                ver_nominas: false,
                gestionar_nominas: false,
                ver_asistencias: false,
                gestionar_asistencias: false,
                ver_turnos: false,
                gestionar_turnos: false,

                // Módulo Compras - ACCESO TOTAL
                ver_compras: true,
                crear_pedidos_compra: true,
                editar_pedidos_compra: true,
                eliminar_pedidos_compra: true,
                ver_gastos: true,

                // Módulo Proveedores - SOLO LECTURA
                ver_proveedores: true,
                crear_proveedores: false,
                editar_proveedores: false,
                eliminar_proveedores: false,
                ver_catalogo_proveedores: true,

                // Módulo Usuarios - BLOQUEADO
                ver_usuarios: false,
                crear_usuarios: false,
                editar_usuarios: false,
                eliminar_usuarios: false,
                cambiar_rol: false,
                resetear_contrasena: false,

                // Módulo Dashboard
                editar_configuracion: false,
                ver_reportes: true,
                ver_estadisticas: true,
                acceder_panel_admin: true,
                ver_dashboard_completo: false
            }
        },
        proveedores: {
            nombre: 'Proveedores',
            color: '#27ae60',
            permisos: {
                // Módulo Productos - SOLO LECTURA
                ver_productos: true,
                editar_productos: false,
                crear_productos: false,
                eliminar_productos: false,
                editar_precios: false,
                editar_stock: false,

                // Módulo CRM - BLOQUEADO
                ver_todos_pedidos: false,
                cambiar_estado_pedido: false,
                cancelar_pedido: false,
                ver_detalles_pedido: false,
                exportar_pedidos: false,
                ver_reservas: false,
                gestionar_reservas: false,

                // Módulo RH - BLOQUEADO
                ver_empleados: false,
                crear_empleados: false,
                editar_empleados: false,
                eliminar_empleados: false,
                ver_nominas: false,
                gestionar_nominas: false,
                ver_asistencias: false,
                gestionar_asistencias: false,
                ver_turnos: false,
                gestionar_turnos: false,

                // Módulo Compras - BLOQUEADO
                ver_compras: false,
                crear_pedidos_compra: false,
                editar_pedidos_compra: false,
                eliminar_pedidos_compra: false,
                ver_gastos: false,

                // Módulo Proveedores - ACCESO TOTAL
                ver_proveedores: true,
                crear_proveedores: true,
                editar_proveedores: true,
                eliminar_proveedores: true,
                ver_catalogo_proveedores: true,

                // Módulo Usuarios - BLOQUEADO
                ver_usuarios: false,
                crear_usuarios: false,
                editar_usuarios: false,
                eliminar_usuarios: false,
                cambiar_rol: false,
                resetear_contrasena: false,

                // Módulo Dashboard
                editar_configuracion: false,
                ver_reportes: false,
                ver_estadisticas: false,
                acceder_panel_admin: true,
                ver_dashboard_completo: false
            }
        },
        cliente: {
            nombre: 'Cliente',
            color: '#95a5a6',
            permisos: {
                // Módulo Productos
                ver_productos: true,
                editar_productos: false,
                crear_productos: false,
                eliminar_productos: false,
                editar_precios: false,
                editar_stock: false,

                // Módulo CRM
                ver_todos_pedidos: false,
                cambiar_estado_pedido: false,
                cancelar_pedido: false,
                ver_detalles_pedido: false,
                exportar_pedidos: false,
                ver_reservas: true,
                gestionar_reservas: true,

                // Módulo RH - BLOQUEADO
                ver_empleados: false,
                crear_empleados: false,
                editar_empleados: false,
                eliminar_empleados: false,
                ver_nominas: false,
                gestionar_nominas: false,
                ver_asistencias: false,
                gestionar_asistencias: false,
                ver_turnos: false,
                gestionar_turnos: false,

                // Módulo Compras - BLOQUEADO
                ver_compras: false,
                crear_pedidos_compra: false,
                editar_pedidos_compra: false,
                eliminar_pedidos_compra: false,
                ver_gastos: false,

                // Módulo Proveedores - BLOQUEADO
                ver_proveedores: false,
                crear_proveedores: false,
                editar_proveedores: false,
                eliminar_proveedores: false,
                ver_catalogo_proveedores: false,

                // Módulo Usuarios
                ver_usuarios: false,
                crear_usuarios: false,
                editar_usuarios: false,
                eliminar_usuarios: false,
                cambiar_rol: false,
                resetear_contrasena: false,

                // Configuración
                editar_configuracion: false,
                ver_reportes: false,
                ver_estadisticas: false,
                acceder_panel_admin: false,
                ver_dashboard_completo: false,

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

    // Verificar si es RH
    esRH(userType) {
        return userType === 'rh';
    },

    // Verificar si es Compras
    esCompras(userType) {
        return userType === 'compras';
    },

    // Verificar si es Proveedores
    esProveedores(userType) {
        return userType === 'proveedores';
    },

    // Verificar si es empleado (RH, Compras o Proveedores)
    esEmpleado(userType) {
        return ['rh', 'compras', 'proveedores'].includes(userType);
    },

    // Obtener descripción legible del rol
    obtenerNombreRol(userType) {
        const role = this.roles[userType];
        return role ? role.nombre : 'Desconocido';
    },

    // Obtener color del rol
    obtenerColorRol(userType) {
        const role = this.roles[userType];
        return role ? role.color : '#666';
    },

    // Obtener módulos accesibles para el rol
    obtenerModulosAccesibles(userType) {
        const modulos = [];
        const permisos = this.obtenerPermisosRol(userType);

        if (permisos.ver_empleados || permisos.ver_nominas || permisos.ver_asistencias) {
            modulos.push('rh');
        }
        if (permisos.ver_compras || permisos.ver_gastos) {
            modulos.push('compras');
        }
        if (permisos.ver_proveedores) {
            modulos.push('proveedores');
        }
        if (permisos.ver_todos_pedidos) {
            modulos.push('crm');
        }
        if (permisos.ver_productos) {
            modulos.push('productos');
        }
        if (permisos.ver_reservas) {
            modulos.push('reservas');
        }

        return modulos;
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

function mostrarAlertaPermiso(accion) {
    const mensajes = {
        'editar_productos': 'Solo los administradores pueden editar productos.',
        'editar_precios': 'Solo los administradores pueden cambiar precios.',
        'cambiar_estado_pedido': 'Solo los administradores pueden cambiar el estado de pedidos.',
        'ver_todos_pedidos': 'Solo puedes ver tus propios pedidos.',
        'editar_configuracion': 'Solo los administradores pueden editar la configuración.',
        'ver_empleados': 'Solo el área de Recursos Humanos puede ver la lista de empleados.',
        'crear_empleados': 'Solo el área de Recursos Humanos puede registrar empleados.',
        'editar_empleados': 'Solo el área de Recursos Humanos puede editar empleados.',
        'ver_nominas': 'Solo el área de Recursos Humanos puede ver las nóminas.',
        'ver_asistencias': 'Solo el área de Recursos Humanos puede ver las asistir.',
        'ver_compras': 'Solo el área de Compras puede ver las órdenes de compra.',
        'crear_pedidos_compra': 'Solo el área de Compras puede crear órdenes de compra.',
        'ver_proveedores': 'Solo el área de Proveedores puede ver la lista de proveedores.',
        'crear_proveedores': 'Solo el área de Proveedores puede registrar proveedores.',
        'editar_proveedores': 'Solo el área de Proveedores puede editar proveedores.',
        'ver_gastos': 'Solo el área de Compras puede ver los gastos totales.'
    };

    const rol = authSystem?.currentUser?.userType || 'desconocido';
    const nombreRol = permissionSystem.obtenerNombreRol(rol);
    const mensaje = mensajes[accion] || 'No tienes permiso para realizar esta acción.';
    alert('⛔ Permiso denegado\n\nTu rol: ' + nombreRol + '\n\n' + mensaje);
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

// ============ RBAC - CONTROL DE MÓDULOS ============

function ocultarModulosPorRol() {
    const userType = authSystem.currentUser?.userType;
    if (!userType) return;

    // Ocultar por defecto todos los módulos del sidebar
    const sidebarSections = document.querySelectorAll('.sidebar-section');

    sidebarSections.forEach(section => {
        const buttons = section.querySelectorAll('.menu-btn');
        buttons.forEach(btn => {
            btn.style.display = 'none';
        });
    });

    // Mostrar según el rol
    if (permissionSystem.esAdmin(userType)) {
        // Admin ve todo
        document.querySelectorAll('.menu-btn').forEach(btn => btn.style.display = 'block');
    } else if (permissionSystem.esRH(userType)) {
        // RH ve: Dashboard, Empleados, Nóminas, Asistencias, Turnos, Reservas
        mostrarModuloSidebar('dashboard');
        mostrarModuloSidebar('empleados');
        mostrarModuloSidebar('reservas');
    } else if (permissionSystem.esCompras(userType)) {
        // Compras ve: Dashboard, Pedidos Compra, Productos, Proveedores (lectura)
        mostrarModuloSidebar('dashboard');
        mostrarModuloSidebar('compras');
        mostrarModuloSidebar('productos');
        mostrarModuloSidebar('proveedores');
    } else if (permissionSystem.esProveedores(userType)) {
        // Proveedores ve: Dashboard, Proveedores
        mostrarModuloSidebar('dashboard');
        mostrarModuloSidebar('proveedores');
    }
}

function mostrarModuloSidebar(modulo) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const buttons = sidebar.querySelectorAll('.menu-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(modulo) ||
            btn.getAttribute('data-modulo') === modulo) {
            btn.style.display = 'block';
        }
    });
}

function ocultarTabsPorRol() {
    const userType = authSystem.currentUser?.userType;
    if (!userType) return;

    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(tab => {
        tab.style.display = 'none';
    });

    if (permissionSystem.esAdmin(userType)) {
        tabButtons.forEach(tab => tab.style.display = 'block');
    } else if (permissionSystem.esRH(userType)) {
        mostrarTabAdmin('dashboard', null, true);
        mostrarTabAdmin('empleados', null, true);
        mostrarTabAdmin('reservas', null, true);
    } else if (permissionSystem.esCompras(userType)) {
        mostrarTabAdmin('dashboard', null, true);
        mostrarTabAdmin('compras', null, true);
        mostrarTabAdmin('productos', null, true);
        mostrarTabAdmin('proveedores', null, true);
    } else if (permissionSystem.esProveedores(userType)) {
        mostrarTabAdmin('dashboard', null, true);
        mostrarTabAdmin('proveedores', null, true);
    }
}

function mostrarTabAdmin(tabName, event, forceShow = false) {
    const userType = authSystem.currentUser?.userType;
    if (!forceShow && userType && !permissionSystem.tienePermiso(userType, 'acceder_panel_admin')) {
        return;
    }

    document.querySelectorAll('.admin-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));

    const tabMap = {
        'dashboard': 'adminDashboard',
        'productos': 'adminProductos',
        'pedidos': 'adminPedidos',
        'reservas': 'adminReservas',
        'proveedores': 'adminProveedores',
        'empleados': 'adminEmpleados',
        'compras': 'adminCompras',
        'usuarios': 'adminUsuarios',
        'reportes': 'adminReportes',
        'pipeline': 'adminPipeline',
        'notas': 'adminNotas',
        'facturas': 'adminFacturas',
        'auditoria': 'adminAuditoria'
    };

    const selectedTab = document.getElementById(tabMap[tabName]);
    if (selectedTab) selectedTab.classList.add('active');
    if (event && event.target) event.target.classList.add('active');

    // Verificar permisos específicos para cada tab
    if (userType && !forceShow) {
        const tabPermisos = {
            'productos': 'ver_productos',
            'pedidos': 'ver_todos_pedidos',
            'reservas': 'ver_reservas',
            'proveedores': 'ver_proveedores',
            'empleados': 'ver_empleados',
            'compras': 'ver_compras',
            'usuarios': 'ver_usuarios',
            'reportes': 'ver_reportes',
            'pipeline': 'ver_todos_pedidos',
            'notas': 'ver_todos_pedidos',
            'facturas': 'ver_todos_pedidos',
            'auditoria': 'ver_reportes'
        };

        if (tabPermisos[tabName] && !permissionSystem.tienePermiso(userType, tabPermisos[tabName])) {
            return;
        }
    }

    // Cargar datos según la tab
    if (tabName === 'productos') { cargarSelectProveedores(); cargarProductosAdmin(); }
    else if (tabName === 'pedidos') cargarPedidosAdmin();
    else if (tabName === 'reservas') cargarReservas();
    else if (tabName === 'proveedores') { cargarProveedoresAdmin(); }
    else if (tabName === 'empleados') { cargarEmpleadosAdmin(); }
    else if (tabName === 'compras') { cargarPedidosCompraAdmin(); }
    else if (tabName === 'usuarios') cargarUsuariosAdmin();
    else if (tabName === 'dashboard') actualizarDashboard();
    else if (tabName === 'pipeline') { cargarPipeline(); }
    else if (tabName === 'notas') { cargarNotasCliente(); }
    else if (tabName === 'facturas') { cargarFacturas(); }
}

function aplicarRBACAlDOM() {
    if (!authSystem.currentUser) return;

    const userType = authSystem.currentUser.userType;
    const userData = authSystem.currentUser;

    // Actualizar badge de rol en el sidebar
    const userStatus = document.getElementById('userStatus');
    if (userStatus) {
        const color = permissionSystem.obtenerColorRol(userType);
        const nombreRol = permissionSystem.obtenerNombreRol(userType);
        userStatus.innerHTML = `
            <strong>${userData.name || 'Usuario'}</strong><br>
            <span style="font-size:0.65rem;background:${color};padding:2px 6px;border-radius:3px;color:white;">${nombreRol}</span>
        `;
    }

    // Aplicar restricciones de módulos
    ocultarModulosPorRol();
    ocultarTabsPorRol();

    // Ejemplos de controles específicos:
    if (permissionSystem.esAdmin(userType)) {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
        }
    } else if (permissionSystem.esCliente(userType)) {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
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
window.addEventListener('load', function() {
    aplicarPermisosAlDOM();
    if (authSystem.currentUser) {
        aplicarRBACAlDOM();
    }
});
