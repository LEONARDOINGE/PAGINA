// ============ SISTEMA DE CARRITO PERSISTENTE ============
// FotoTec - Carrito de compras con persistencia en localStorage

const carritoSystem = {
    STORAGE_KEY: 'fotovecCarrito',

    // Obtener carrito del localStorage
    obtenerCarrito() {
        const carrito = localStorage.getItem(this.STORAGE_KEY);
        return carrito ? JSON.parse(carrito) : [];
    },

    // Guardar carrito en localStorage
    guardarCarrito(carrito) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(carrito));
        this.actualizarContador();
    },

    // Agregar producto/servicio al carrito
    agregarProducto(producto, cantidad = 1) {
        const carrito = this.obtenerCarrito();
        const productoId = producto.id || producto.productoId;

        const existente = carrito.find(item => item.productoId === productoId);

        if (existente) {
            existente.cantidad += cantidad;
            existente.subtotal = existente.cantidad * existente.precio;
        } else {
            carrito.push({
                productoId: productoId,
                nombre: producto.nombre,
                descripcion: producto.descripcion || '',
                precio: parseFloat(producto.precio),
                cantidad: cantidad,
                subtotal: parseFloat(producto.precio) * cantidad,
                categoria: producto.categoria || 'servicio',
                fechaAgregado: new Date().toISOString()
            });
        }

        this.guardarCarrito(carrito);
        this.mostrarNotificacion(`${producto.nombre} agregado al carrito`);
        return true;
    },

    // Quitar producto del carrito
    quitarProducto(productoId) {
        let carrito = this.obtenerCarrito();
        carrito = carrito.filter(item => item.productoId !== productoId);
        this.guardarCarrito(carrito);
        this.mostrarNotificacion('Producto quitado del carrito');
    },

    // Actualizar cantidad de un producto
    actualizarCantidad(productoId, cantidad) {
        const carrito = this.obtenerCarrito();
        const item = carrito.find(item => item.productoId === productoId);

        if (item) {
            if (cantidad <= 0) {
                this.quitarProducto(productoId);
            } else {
                item.cantidad = cantidad;
                item.subtotal = item.cantidad * item.precio;
                this.guardarCarrito(carrito);
            }
        }
    },

    // Limpiar carrito
    limpiarCarrito() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.actualizarContador();
        this.mostrarNotificacion('Carrito vaciado');
    },

    // Obtener total del carrito
    obtenerTotal() {
        const carrito = this.obtenerCarrito();
        return carrito.reduce((sum, item) => sum + item.subtotal, 0);
    },

    // Obtener cantidad total de items
    obtenerCantidadTotal() {
        const carrito = this.obtenerCarrito();
        return carrito.reduce((sum, item) => sum + item.cantidad, 0);
    },

    // Obtener impuesto (16% IVA)
    obtenerIVA() {
        return this.obtenerTotal() * 0.16;
    },

    // Obtener total con IVA
    obtenerTotalConIVA() {
        return this.obtenerTotal() * 1.16;
    },

    // Verificar si hay productos en el carrito
    hayProductos() {
        return this.obtenerCarrito().length > 0;
    },

    // Actualizar contador en el DOM
    actualizarContador() {
        const contador = document.getElementById('carritoContador');
        if (contador) {
            const cantidad = this.obtenerCantidadTotal();
            contador.textContent = cantidad;
            contador.style.display = cantidad > 0 ? 'inline-block' : 'none';
        }
    },

    // Mostrar notificación
    mostrarNotificacion(mensaje) {
        let notificacion = document.getElementById('carritoNotificacion');
        if (!notificacion) {
            notificacion = document.createElement('div');
            notificacion.id = 'carritoNotificacion';
            notificacion.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#27ae60;color:white;padding:15px 25px;border-radius:8px;font-weight:bold;z-index:10000;opacity:0;transition:opacity 0.3s;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
            document.body.appendChild(notificacion);
        }
        notificacion.textContent = mensaje;
        notificacion.style.opacity = '1';
        setTimeout(() => {
            notificacion.style.opacity = '0';
        }, 2500);
    },

    // Renderizar carrito en el DOM
    renderizarCarrito(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const carrito = this.obtenerCarrito();

        if (carrito.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:#999;"><p>🛒 Tu carrito está vacío</p></div>';
            return;
        }

        let html = `
            <div style="background:white;color:#333;border-radius:12px;padding:20px;">
                <h3 style="margin-top:0;border-bottom:1px solid #eee;padding-bottom:10px;">🛒 Carrito de Compras</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f5f5f5;">
                            <th style="padding:10px;text-align:left;">Servicio</th>
                            <th style="padding:10px;text-align:center;">Cant.</th>
                            <th style="padding:10px;text-align:right;">Precio</th>
                            <th style="padding:10px;text-align:right;">Subtotal</th>
                            <th style="padding:10px;"></th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        carrito.forEach(item => {
            html += `
                <tr>
                    <td style="padding:10px;border-bottom:1px solid #eee;">
                        <strong>${item.nombre}</strong>
                        ${item.descripcion ? '<br><small style="color:#666;">' + item.descripcion + '</small>' : ''}
                    </td>
                    <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">
                        <button onclick="carritoSystem.actualizarCantidad(${item.productoId}, ${item.cantidad - 1})" style="background:#eee;border:none;width:25px;height:25px;cursor:pointer;border-radius:4px;">-</button>
                        <span style="display:inline-block;min-width:30px;text-align:center;">${item.cantidad}</span>
                        <button onclick="carritoSystem.actualizarCantidad(${item.productoId}, ${item.cantidad + 1})" style="background:#eee;border:none;width:25px;height:25px;cursor:pointer;border-radius:4px;">+</button>
                    </td>
                    <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">$${item.precio.toFixed(2)}</td>
                    <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">$${item.subtotal.toFixed(2)}</td>
                    <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">
                        <button onclick="carritoSystem.quitarProducto(${item.productoId}); carritoSystem.renderizarCarrito('${containerId}');" style="background:#ff6b6b;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">×</button>
                    </td>
                </tr>
            `;
        });

        const subtotal = this.obtenerTotal();
        const iva = this.obtenerIVA();
        const total = this.obtenerTotalConIVA();

        html += `
                    </tbody>
                </table>
                <div style="margin-top:20px;padding-top:15px;border-top:2px solid #eee;text-align:right;">
                    <p>Subtotal: <strong>$${subtotal.toFixed(2)} MXN</strong></p>
                    <p>IVA (16%): <strong>$${iva.toFixed(2)} MXN</strong></p>
                    <p style="font-size:1.2em;">Total: <strong style="color:#27ae60;">$${total.toFixed(2)} MXN</strong></p>
                    <button onclick="carritoSystem.procederAlPago()" style="background:#27ae60;color:white;border:none;padding:15px 30px;border-radius:8px;font-size:1em;font-weight:bold;cursor:pointer;margin-top:10px;">Proceder al Pago</button>
                    <button onclick="carritoSystem.limpiarCarrito(); carritoSystem.renderizarCarrito('${containerId}');" style="background:#ff6b6b;color:white;border:none;padding:15px 30px;border-radius:8px;font-size:1em;font-weight:bold;cursor:pointer;margin-top:10px;margin-left:10px;">Vaciar Carrito</button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    // Proceder al pago (crear pedido)
    async procederAlPago() {
        const carrito = this.obtenerCarrito();
        if (carrito.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }

        const total = this.obtenerTotalConIVA();

        try {
            const res = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productos: carrito.map(item => ({
                        productoId: item.productoId,
                        nombre: item.nombre,
                        cantidad: item.cantidad,
                        precio: item.precio
                    })),
                    total: total,
                    estado: 'pendiente'
                })
            });

            const data = await res.json();

            if (data.success) {
                this.limpiarCarrito();
                alert('¡Pedido creado con éxito!\n\nFolio: ' + data.pedido.id + '\nTotal: $' + total.toFixed(2) + ' MXN\n\nNos pondremos en contacto contigo pronto.');
            } else {
                alert('Error al crear el pedido: ' + (data.error || 'Intenta de nuevo'));
            }
        } catch(e) {
            // Si no hay backend, guardar localmente
            if (typeof database !== 'undefined') {
                const pedidoLocal = {
                    id: Date.now(),
                    clienteNombre: 'Cliente Web',
                    estado: 'Pendiente',
                    total: total,
                    productos: carrito.map(item => ({
                        id: item.productoId,
                        cantidad: item.cantidad
                    })),
                    fechaCreacion: new Date().toLocaleString('es-ES')
                };
                database.pedidos.push(pedidoLocal);
                localStorage.setItem('fotovecPedidos', JSON.stringify(database.pedidos));

                this.limpiarCarrito();
                alert('¡Pedido guardado localmente!\n\nPedido #: ' + pedidoLocal.id + '\nTotal: $' + total.toFixed(2) + ' MXN\n\nNota: El pedido será procesado cuando el servidor esté disponible.');
            } else {
                alert('Error de conexión: ' + e.message);
            }
        }
    }
};

// Inicializar contador al cargar
document.addEventListener('DOMContentLoaded', function() {
    if (typeof carritoSystem !== 'undefined') {
        carritoSystem.actualizarContador();
    }
});
