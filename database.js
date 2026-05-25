// ============ GESTIÓN DE BASE DE DATOS SIMULADA ============
// Simula una base de datos SQLite almacenada en localStorage
// CUMPLE CON: Tema 02 (SCM) y Tema 03 (ERP)

const database = {
    // ============ DATOS DE PRODUCTOS ============
    productos: JSON.parse(localStorage.getItem('fotovecProductos')) || [
        {
            id: 1,
            nombre: 'Sesión de Estudio - Fondo Blanco',
            descripcion: 'Fotografía profesional en fondo blanco',
            precio: 50,
            stock: 100,
            categoria: 'estudio',
            estrategia: 'pull',
            stockMinimo: 20,
            proveedorId: null,
            createdAt: new Date().toLocaleString('es-ES'),
            editableAdmin: true
        },
        {
            id: 2,
            nombre: 'Sesión de Boda (5 horas)',
            descripcion: 'Cobertura completa de matrimonio',
            precio: 300,
            stock: 50,
            categoria: 'boda',
            estrategia: 'pull',
            stockMinimo: 10,
            proveedorId: null,
            createdAt: new Date().toLocaleString('es-ES'),
            editableAdmin: true
        },
        {
            id: 3,
            nombre: 'Impresión Fine Art (24x36)',
            descripcion: 'Impresión de calidad ultraalta',
            precio: 80,
            stock: 200,
            categoria: 'impresion',
            estrategia: 'push',
            stockMinimo: 50,
            proveedorId: 1,
            createdAt: new Date().toLocaleString('es-ES'),
            editableAdmin: true
        }
    ],

    // ============ DATOS DE PEDIDOS (CRM) ============
    pedidos: JSON.parse(localStorage.getItem('fotovecPedidos')) || [
        {
            id: 101,
            clienteId: 1,
            clienteNombre: 'Cliente Test',
            estado: 'Pendiente',
            total: 150,
            productos: [{ id: 1, cantidad: 3 }],
            fechaCreacion: new Date().toLocaleString('es-ES'),
            fechaPago: null,
            notas: '',
            editableAdmin: true,
            protegido: false
        }
    ],

    // ============ DATOS DE PROVEEDORES (SCM) ============
    proveedores: JSON.parse(localStorage.getItem('fotovecProveedores')) || [
        {
            id: 1,
            nombre: 'Distribuidora de Insumos Fotográficos',
            contacto: 'Juan Pérez',
            telefono: '8991234567',
            email: 'proveedor1@fotografia.com',
            tipoInsumo: 'papel_fotografico',
            insumoDetalle: 'Papel Glossy, Mate y Fine Art',
            activo: true,
            createdAt: new Date().toLocaleString('es-ES')
        },
        {
            id: 2,
            nombre: 'Tech Photo Equipment',
            contacto: 'María López',
            telefono: '8999876543',
            email: 'contacto@techphoto.mx',
            tipoInsumo: 'equipo',
            insumoDetalle: 'Cámaras, lentes y accesorios',
            activo: true,
            createdAt: new Date().toLocaleString('es-ES')
        }
    ],

    // ============ DATOS DE EMPLEADOS (ERP - RH) ============
    empleados: JSON.parse(localStorage.getItem('fotovecEmpleados')) || [
        {
            id: 1,
            nombre: 'Carlos Rodríguez',
            puesto: 'Fotógrafo Principal',
            area: 'Producción',
            telefono: '8991112233',
            email: 'carlos@fototec.com',
            salario: 15000,
            fechaIngreso: '2022-01-15',
            activo: true,
            createdAt: new Date().toLocaleString('es-ES')
        },
        {
            id: 2,
            nombre: 'Ana Martínez',
            puesto: 'Editor Fotográfico',
            area: 'Post-producción',
            telefono: '8992223344',
            email: 'ana@fototec.com',
            salario: 12000,
            fechaIngreso: '2022-06-01',
            activo: true,
            createdAt: new Date().toLocaleString('es-ES')
        },
        {
            id: 3,
            nombre: 'Roberto Sánchez',
            puesto: 'Asistente de Studio',
            area: 'Producción',
            telefono: '8993334455',
            email: 'roberto@fototec.com',
            salario: 8000,
            fechaIngreso: '2023-03-10',
            activo: false,
            createdAt: new Date().toLocaleString('es-ES')
        }
    ],

    // ============ DATOS DE PEDIDOS DE COMPRA (SCM) ============
    pedidosCompra: JSON.parse(localStorage.getItem('fotovecPedidosCompra')) || [
        {
            id: 1,
            proveedorId: 1,
            proveedorNombre: 'Distribuidora de Insumos Fotográficos',
            estado: 'Pendiente',
            productos: [
                { productoId: 3, nombre: 'Impresión Fine Art (24x36)', cantidad: 50, costoUnitario: 40 }
            ],
            total: 2000,
            fechaCreacion: new Date().toLocaleString('es-ES'),
            fechaRecepcion: null,
            notas: 'Reabastecimiento automático por estrategia Push',
            creadoAutomatico: true
        }
    ],

    // ============ MÉTODOS PARA PRODUCTOS ============

    crearProducto(nombre, descripcion, precio, stock, categoria, estrategia = 'pull', stockMinimo = 10, proveedorId = null) {
        const nuevoProducto = {
            id: Math.max(...this.productos.map(p => p.id), 0) + 1,
            nombre,
            descripcion,
            precio: parseFloat(precio),
            stock: parseInt(stock),
            categoria,
            estrategia,
            stockMinimo: parseInt(stockMinimo),
            proveedorId: proveedorId ? parseInt(proveedorId) : null,
            createdAt: new Date().toLocaleString('es-ES'),
            editableAdmin: true
        };

        this.productos.push(nuevoProducto);
        this.guardarProductos();
        console.log('✅ Producto creado:', nuevoProducto);
        return { success: true, message: 'Producto creado exitosamente', producto: nuevoProducto };
    },

    editarProducto(productoId, datos) {
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) {
            return { success: false, message: 'Producto no encontrado' };
        }

        if (datos.nombre) producto.nombre = datos.nombre;
        if (datos.descripcion !== undefined) producto.descripcion = datos.descripcion;
        if (datos.precio !== undefined) producto.precio = parseFloat(datos.precio);
        if (datos.stock !== undefined) producto.stock = parseInt(datos.stock);
        if (datos.categoria) producto.categoria = datos.categoria;
        if (datos.estrategia) producto.estrategia = datos.estrategia;
        if (datos.stockMinimo !== undefined) producto.stockMinimo = parseInt(datos.stockMinimo);
        if (datos.proveedorId !== undefined) producto.proveedorId = datos.proveedorId ? parseInt(datos.proveedorId) : null;

        this.guardarProductos();
        console.log('✅ Producto actualizado:', producto);
        return { success: true, message: 'Producto actualizado', producto };
    },

    eliminarProducto(productoId) {
        const index = this.productos.findIndex(p => p.id === productoId);
        if (index === -1) {
            return { success: false, message: 'Producto no encontrado' };
        }

        const productoEliminado = this.productos[index];
        this.productos.splice(index, 1);
        this.guardarProductos();
        console.log('✅ Producto eliminado:', productoEliminado);
        return { success: true, message: 'Producto eliminado', producto: productoEliminado };
    },

    obtenerProductos() {
        return this.productos;
    },

    obtenerProducto(productoId) {
        return this.productos.find(p => p.id === productoId);
    },

    guardarProductos() {
        localStorage.setItem('fotovecProductos', JSON.stringify(this.productos));
    },

    // ============ MÉTODOS PARA PEDIDOS (CRM) ============

    crearPedido(clienteId, clienteNombre, productos) {
        const total = productos.reduce((sum, item) => {
            const producto = this.obtenerProducto(item.productoId);
            return sum + (producto.precio * item.cantidad);
        }, 0);

        const nuevoPedido = {
            id: Math.max(...this.pedidos.map(p => p.id), 0) + 1,
            clienteId,
            clienteNombre,
            estado: 'Pendiente',
            total,
            productos,
            fechaCreacion: new Date().toLocaleString('es-ES'),
            fechaPago: null,
            notas: '',
            editableAdmin: true,
            protegido: false
        };

        this.pedidos.push(nuevoPedido);
        this.guardarPedidos();
        console.log('✅ Pedido creado:', nuevoPedido);
        return { success: true, message: 'Pedido creado exitosamente', pedido: nuevoPedido };
    },

    cambiarEstadoPedido(pedidoId, nuevoEstado) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (!pedido) {
            return { success: false, message: 'Pedido no encontrado' };
        }

        const estadosValidos = ['Pendiente', 'Confirmado', 'Enviado', 'Entregado', 'Cancelado'];
        if (!estadosValidos.includes(nuevoEstado)) {
            return { success: false, message: 'Estado inválido' };
        }

        if (nuevoEstado === 'Entregado' && pedido.fechaPago) {
            pedido.protegido = true;
        }

        pedido.estado = nuevoEstado;
        this.guardarPedidos();
        console.log('✅ Estado de pedido actualizado:', pedido);
        return { success: true, message: 'Estado actualizado', pedido };
    },

    obtenerPedidos(clienteId = null) {
        if (clienteId) {
            return this.pedidos.filter(p => p.clienteId === clienteId);
        }
        return this.pedidos;
    },

    obtenerPedido(pedidoId) {
        return this.pedidos.find(p => p.id === pedidoId);
    },

    eliminarPedido(pedidoId) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);

        if (pedido && pedido.protegido) {
            return {
                success: false,
                message: 'No se pueden eliminar pedidos pagados y entregados (protección contable)'
            };
        }

        const index = this.pedidos.findIndex(p => p.id === pedidoId);
        if (index === -1) {
            return { success: false, message: 'Pedido no encontrado' };
        }

        const pedidoEliminado = this.pedidos[index];
        this.pedidos.splice(index, 1);
        this.guardarPedidos();
        console.log('✅ Pedido eliminado:', pedidoEliminado);
        return { success: true, message: 'Pedido eliminado', pedido: pedidoEliminado };
    },

    guardarPedidos() {
        localStorage.setItem('fotovecPedidos', JSON.stringify(this.pedidos));
    },

    // ============ MÉTODOS PARA PROVEEDORES (SCM) ============

    crearProveedor(nombre, contacto, telefono, email, tipoInsumo, insumoDetalle) {
        const nuevoProveedor = {
            id: Math.max(...this.proveedores.map(p => p.id), 0) + 1,
            nombre,
            contacto,
            telefono: telefono || '',
            email: email || '',
            tipoInsumo,
            insumoDetalle: insumoDetalle || '',
            activo: true,
            createdAt: new Date().toLocaleString('es-ES')
        };

        this.proveedores.push(nuevoProveedor);
        this.guardarProveedores();
        console.log('✅ Proveedor creado:', nuevoProveedor);
        return { success: true, message: 'Proveedor dado de alta exitosamente', proveedor: nuevoProveedor };
    },

    editarProveedor(proveedorId, datos) {
        const proveedor = this.proveedores.find(p => p.id === proveedorId);
        if (!proveedor) {
            return { success: false, message: 'Proveedor no encontrado' };
        }

        if (datos.nombre) proveedor.nombre = datos.nombre;
        if (datos.contacto) proveedor.contacto = datos.contacto;
        if (datos.telefono !== undefined) proveedor.telefono = datos.telefono;
        if (datos.email !== undefined) proveedor.email = datos.email;
        if (datos.tipoInsumo) proveedor.tipoInsumo = datos.tipoInsumo;
        if (datos.insumoDetalle !== undefined) proveedor.insumoDetalle = datos.insumoDetalle;
        if (datos.activo !== undefined) proveedor.activo = datos.activo;

        this.guardarProveedores();
        console.log('✅ Proveedor actualizado:', proveedor);
        return { success: true, message: 'Proveedor actualizado', proveedor };
    },

    eliminarProveedor(proveedorId) {
        const productosConProveedor = this.productos.filter(p => p.proveedorId === proveedorId);
        if (productosConProveedor.length > 0) {
            return {
                success: false,
                message: `No se puede eliminar. ${productosConProveedor.length} producto(s) están asociados a este proveedor.`
            };
        }

        const index = this.proveedores.findIndex(p => p.id === proveedorId);
        if (index === -1) {
            return { success: false, message: 'Proveedor no encontrado' };
        }

        const proveedorEliminado = this.proveedores[index];
        this.proveedores.splice(index, 1);
        this.guardarProveedores();
        console.log('✅ Proveedor eliminado:', proveedorEliminado);
        return { success: true, message: 'Proveedor eliminado', proveedor: proveedorEliminado };
    },

    obtenerProveedores(activo = null) {
        if (activo !== null) {
            return this.proveedores.filter(p => p.activo === activo);
        }
        return this.proveedores;
    },

    obtenerProveedor(proveedorId) {
        return this.proveedores.find(p => p.id === proveedorId);
    },

    guardarProveedores() {
        localStorage.setItem('fotovecProveedores', JSON.stringify(this.proveedores));
    },

    // ============ MÉTODOS PARA EMPLEADOS (ERP - RH) ============

    crearEmpleado(nombre, puesto, area, telefono, email, salario, fechaIngreso) {
        const nuevoEmpleado = {
            id: Math.max(...this.empleados.map(e => e.id), 0) + 1,
            nombre,
            puesto,
            area,
            telefono: telefono || '',
            email: email || '',
            salario: parseFloat(salario) || 0,
            fechaIngreso: fechaIngreso || new Date().toISOString().split('T')[0],
            activo: true,
            createdAt: new Date().toLocaleString('es-ES')
        };

        this.empleados.push(nuevoEmpleado);
        this.guardarEmpleados();
        console.log('✅ Empleado creado:', nuevoEmpleado);
        return { success: true, message: 'Empleado registrado exitosamente', empleado: nuevoEmpleado };
    },

    editarEmpleado(empleadoId, datos) {
        const empleado = this.empleados.find(e => e.id === empleadoId);
        if (!empleado) {
            return { success: false, message: 'Empleado no encontrado' };
        }

        if (datos.nombre) empleado.nombre = datos.nombre;
        if (datos.puesto) empleado.puesto = datos.puesto;
        if (datos.area) empleado.area = datos.area;
        if (datos.telefono !== undefined) empleado.telefono = datos.telefono;
        if (datos.email !== undefined) empleado.email = datos.email;
        if (datos.salario !== undefined) empleado.salario = parseFloat(datos.salario);
        if (datos.fechaIngreso !== undefined) empleado.fechaIngreso = datos.fechaIngreso;
        if (datos.activo !== undefined) empleado.activo = datos.activo;

        this.guardarEmpleados();
        console.log('✅ Empleado actualizado:', empleado);
        return { success: true, message: 'Empleado actualizado', empleado };
    },

    eliminarEmpleado(empleadoId) {
        const index = this.empleados.findIndex(e => e.id === empleadoId);
        if (index === -1) {
            return { success: false, message: 'Empleado no encontrado' };
        }

        const empleadoEliminado = this.empleados[index];
        this.empleados.splice(index, 1);
        this.guardarEmpleados();
        console.log('✅ Empleado eliminado:', empleadoEliminado);
        return { success: true, message: 'Empleado dado de baja', empleado: empleadoEliminado };
    },

    obtenerEmpleados(activo = null) {
        if (activo !== null) {
            return this.empleados.filter(e => e.activo === activo);
        }
        return this.empleados;
    },

    obtenerEmpleado(empleadoId) {
        return this.empleados.find(e => e.id === empleadoId);
    },

    guardarEmpleados() {
        localStorage.setItem('fotovecEmpleados', JSON.stringify(this.empleados));
    },

    // ============ MÉTODOS PARA PEDIDOS DE COMPRA (SCM - PUSH/PULL) ============

    generarPedidoCompra(productoId, cantidad, notas = '') {
        const producto = this.obtenerProducto(productoId);
        if (!producto) {
            return { success: false, message: 'Producto no encontrado' };
        }

        const proveedor = producto.proveedorId ? this.obtenerProveedor(producto.proveedorId) : null;

        const nuevoPedidoCompra = {
            id: Math.max(...this.pedidosCompra.map(p => p.id), 0) + 1,
            proveedorId: producto.proveedorId,
            proveedorNombre: proveedor ? proveedor.nombre : 'Sin proveedor asignado',
            estado: 'Pendiente',
            productos: [{
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: cantidad,
                costoUnitario: producto.precio * 0.6
            }],
            total: cantidad * (producto.precio * 0.6),
            fechaCreacion: new Date().toLocaleString('es-ES'),
            fechaRecepcion: null,
            notas: notas || `Pedido generado automáticamente - Estrategia ${producto.estrategia.toUpperCase()}`,
            creadoAutomatico: true
        };

        this.pedidosCompra.push(nuevoPedidoCompra);
        this.guardarPedidosCompra();
        console.log('✅ Pedido de compra creado:', nuevoPedidoCompra);
        return { success: true, message: 'Pedido de compra generado', pedido: nuevoPedidoCompra };
    },

    verificarStockYPush(productoId) {
        const producto = this.obtenerProducto(productoId);
        if (!producto) return { necesita: false };

        if (producto.estrategia === 'push' && producto.stock <= producto.stockMinimo) {
            const cantidadRecomendada = Math.max(producto.stockMinimo * 2, 20);
            const resultado = this.generarPedidoCompra(
                productoId,
                cantidadRecomendada,
                `Reabastecimiento automático - Stock actual: ${producto.stock}, Mínimo: ${producto.stockMinimo}`
            );
            return {
                necesita: true,
                tipo: 'push',
                mensaje: `Stock bajo detectado. Pedido de compra generado automáticamente.`,
                resultado
            };
        }

        return { necesita: false };
    },

    cambiarEstadoPedidoCompra(pedidoId, nuevoEstado) {
        const pedido = this.pedidosCompra.find(p => p.id === pedidoId);
        if (!pedido) {
            return { success: false, message: 'Pedido de compra no encontrado' };
        }

        const estadosValidos = ['Pendiente', 'Confirmado', 'Recibido', 'Cancelado'];
        if (!estadosValidos.includes(nuevoEstado)) {
            return { success: false, message: 'Estado inválido' };
        }

        if (nuevoEstado === 'Recibido') {
            pedido.fechaRecepcion = new Date().toLocaleString('es-ES');
            pedido.productos.forEach(item => {
                const producto = this.obtenerProducto(item.productoId);
                if (producto) {
                    producto.stock += item.cantidad;
                    console.log(`✅ Stock actualizado para ${producto.nombre}: +${item.cantidad} (nuevo stock: ${producto.stock})`);
                }
            });
            this.guardarProductos();
        }

        pedido.estado = nuevoEstado;
        this.guardarPedidosCompra();
        console.log('✅ Estado de pedido de compra actualizado:', pedido);
        return { success: true, message: `Pedido de compra ${nuevoEstado}`, pedido };
    },

    eliminarPedidoCompra(pedidoId) {
        const index = this.pedidosCompra.findIndex(p => p.id === pedidoId);
        if (index === -1) {
            return { success: false, message: 'Pedido de compra no encontrado' };
        }

        const pedidoEliminado = this.pedidosCompra[index];
        this.pedidosCompra.splice(index, 1);
        this.guardarPedidosCompra();
        console.log('✅ Pedido de compra eliminado:', pedidoEliminado);
        return { success: true, message: 'Pedido de compra eliminado', pedido: pedidoEliminado };
    },

    obtenerPedidosCompra(estado = null) {
        if (estado) {
            return this.pedidosCompra.filter(p => p.estado === estado);
        }
        return this.pedidosCompra;
    },

    obtenerPedidoCompra(pedidoId) {
        return this.pedidosCompra.find(p => p.id === pedidoId);
    },

    guardarPedidosCompra() {
        localStorage.setItem('fotovecPedidosCompra', JSON.stringify(this.pedidosCompra));
    },

    // ============ VALIDACIONES ============

    validarStock(productoId, cantidad) {
        const producto = this.obtenerProducto(productoId);
        if (!producto) return { valid: false, message: 'Producto no existe' };
        if (producto.stock < cantidad) {
            return { valid: false, message: `Stock insuficiente. Disponible: ${producto.stock}` };
        }
        if (producto.stock === 0) {
            return { valid: false, message: 'Producto agotado. El admin debe actualizar el stock.' };
        }
        return { valid: true, message: 'Stock disponible' };
    },

    // ============ REPORTES CONSOLIDADOS (SCM + ERP + CRM) ============

    generarReporte() {
        const empleadosActivos = this.empleados.filter(e => e.activo);
        const nominaTotal = empleadosActivos.reduce((sum, e) => sum + (e.salario || 0), 0);
        const productosPush = this.productos.filter(p => p.estrategia === 'push');
        const productosPull = this.productos.filter(p => p.estrategia === 'pull');
        const productosStockBajo = this.productos.filter(p => p.stock <= p.stockMinimo);
        const pedidosCompraPendientes = this.pedidosCompra.filter(p => p.estado === 'Pendiente' || p.estado === 'Confirmado');

        return {
            // CRM
            totalProductos: this.productos.length,
            totalPedidos: this.pedidos.length,
            ingresosTotales: this.pedidos.reduce((sum, p) => sum + p.total, 0),
            pedidosPendientes: this.pedidos.filter(p => p.estado === 'Pendiente').length,
            pedidosEntregados: this.pedidos.filter(p => p.estado === 'Entregado').length,
            productosAgotados: this.productos.filter(p => p.stock === 0).length,
            productosStockBajo: productosStockBajo.length,

            // SCM
            totalProveedores: this.proveedores.length,
            proveedoresActivos: this.proveedores.filter(p => p.activo).length,
            totalPedidosCompra: this.pedidosCompra.length,
            pedidosCompraPendientes: pedidosCompraPendientes.length,
            productosPush: productosPush.length,
            productosPull: productosPull.length,

            // ERP - RH
            totalEmpleados: this.empleados.length,
            empleadosActivos: empleadosActivos.length,
            empleadosInactivos: this.empleados.filter(e => !e.activo).length,
            nominaTotal: nominaTotal,
            costoEmpleadosArea: this.getNominaPorArea(),

            timestamp: new Date().toLocaleString('es-ES')
        };
    },

    getNominaPorArea() {
        const areas = {};
        this.empleados.filter(e => e.activo).forEach(e => {
            if (!areas[e.area]) areas[e.area] = 0;
            areas[e.area] += e.salario || 0;
        });
        return areas;
    }
};

// ============ INICIALIZAR DATOS ============
if (!localStorage.getItem('fotovecProductos')) {
    database.guardarProductos();
}
if (!localStorage.getItem('fotovecPedidos')) {
    database.guardarPedidos();
}
if (!localStorage.getItem('fotovecProveedores')) {
    database.guardarProveedores();
}
if (!localStorage.getItem('fotovecEmpleados')) {
    database.guardarEmpleados();
}
if (!localStorage.getItem('fotovecPedidosCompra')) {
    database.guardarPedidosCompra();
}
