// ============ GESTIÓN DE BASE DE DATOS SIMULADA ============
// Simula una base de datos SQLite almacenada en localStorage

const database = {
    // Datos de productos
    productos: JSON.parse(localStorage.getItem('fotovecProductos')) || [
        {
            id: 1,
            nombre: 'Sesión de Estudio - Fondo Blanco',
            descripcion: 'Fotografía profesional en fondo blanco',
            precio: 50,
            stock: 100,
            categoria: 'estudio',
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
            createdAt: new Date().toLocaleString('es-ES'),
            editableAdmin: true
        }
    ],

    // Datos de pedidos
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
            protegido: false // Si es true, no se puede eliminar
        }
    ],

    // ============ MÉTODOS PARA PRODUCTOS ============

    crearProducto(nombre, descripcion, precio, stock, categoria) {
        const nuevoProducto = {
            id: Math.max(...this.productos.map(p => p.id), 0) + 1,
            nombre,
            descripcion,
            precio: parseFloat(precio),
            stock: parseInt(stock),
            categoria,
            createdAt: new Date().toLocaleString('es-ES'),
            editableAdmin: true
        };

        this.productos.push(nuevoProducto);
        this.guardarProductos();
        console.log('✅ Producto creado:', nuevoProducto);
        return nuevoProducto;
    },

    editarProducto(productoId, datos) {
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) {
            console.error('Producto no encontrado');
            return { success: false, message: 'Producto no encontrado' };
        }

        // Actualizar datos
        if (datos.nombre) producto.nombre = datos.nombre;
        if (datos.descripcion) producto.descripcion = datos.descripcion;
        if (datos.precio !== undefined) producto.precio = parseFloat(datos.precio);
        if (datos.stock !== undefined) producto.stock = parseInt(datos.stock);
        if (datos.categoria) producto.categoria = datos.categoria;

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

    // ============ MÉTODOS PARA PEDIDOS ============

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
        return nuevoPedido;
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

        // Si el pedido fue entregado y pagado, protegerlo
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
        
        // Verificación de seguridad: No eliminar si está protegido
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

    // ============ REPORTES PARA ADMINISTRADOR ============

    generarReporte() {
        return {
            totalProductos: this.productos.length,
            totalPedidos: this.pedidos.length,
            ingresosTotales: this.pedidos.reduce((sum, p) => sum + p.total, 0),
            pedidosPendientes: this.pedidos.filter(p => p.estado === 'Pendiente').length,
            pedidosEntregados: this.pedidos.filter(p => p.estado === 'Entregado').length,
            productosAgotados: this.productos.filter(p => p.stock === 0).length,
            timestamp: new Date().toLocaleString('es-ES')
        };
    }
};

// Guardar datos iniciales si no existen
if (!localStorage.getItem('fotovecProductos')) {
    database.guardarProductos();
}
if (!localStorage.getItem('fotovecPedidos')) {
    database.guardarPedidos();
}
