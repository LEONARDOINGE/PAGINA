// ============ SISTEMA DE CARRITO PERSISTENTE CON API ============
// FotoTec - Carrito de compras conectado a GraphQL/Turso

const carritoSystem = {
    STORAGE_KEY: 'fototecCarrito',
    API_ENDPOINT: '/graphql',

    obtenerCarrito() {
        const carrito = localStorage.getItem(this.STORAGE_KEY);
        return carrito ? JSON.parse(carrito) : [];
    },

    guardarCarrito(carrito) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(carrito));
        this.actualizarContador();
    },

    agregarProducto(producto, cantidad = 1) {
        const carrito = this.obtenerCarrito();
        const productoId = producto.id || producto.productoId || producto.sku;

        const existente = carrito.find(item => item.productoId === productoId);

        if (existente) {
            existente.cantidad += cantidad;
            existente.subtotal = existente.cantidad * existente.precio;
        } else {
            carrito.push({
                productoId: productoId,
                sku: producto.sku || producto.id,
                nombre: producto.nombre || producto.name,
                descripcion: producto.descripcion || producto.description || '',
                precio: parseFloat(producto.precio || producto.price),
                cantidad: cantidad,
                subtotal: parseFloat(producto.precio || producto.price) * cantidad,
                categoria: producto.categoria || producto.category || 'servicio',
                tipo: producto.type || 'servicio',
                estrategia: producto.strategy || 'pull',
                fechaAgregado: new Date().toISOString()
            });
        }

        this.guardarCarrito(carrito);
        this.mostrarNotificacion(`${producto.nombre || producto.name} agregado al carrito`);
        return true;
    },

    quitarProducto(productoId) {
        let carrito = this.obtenerCarrito();
        carrito = carrito.filter(item => item.productoId !== productoId);
        this.guardarCarrito(carrito);
        this.mostrarNotificacion('Producto quitado del carrito');
    },

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

    limpiarCarrito() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.actualizarContador();
        this.mostrarNotificacion('Carrito vaciado');
    },

    obtenerTotal() {
        return this.obtenerCarrito().reduce((sum, item) => sum + item.subtotal, 0);
    },

    obtenerCantidadTotal() {
        return this.obtenerCarrito().reduce((sum, item) => sum + item.cantidad, 0);
    },

    obtenerIVA() {
        return this.obtenerTotal() * 0.16;
    },

    obtenerTotalConIVA() {
        return this.obtenerTotal() * 1.16;
    },

    hayProductos() {
        return this.obtenerCarrito().length > 0;
    },

    actualizarContador() {
        const contador = document.getElementById('carritoContador');
        if (contador) {
            const cantidad = this.obtenerCantidadTotal();
            contador.textContent = cantidad;
            contador.style.display = cantidad > 0 ? 'inline-block' : 'none';
        }
    },

    mostrarNotificacion(mensaje) {
        let notificacion = document.getElementById('carritoNotificacion');
        if (!notificacion) {
            notificacion = document.createElement('div');
            notificacion.id = 'carritoNotificacion';
            notificacion.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#27ae60;color:white;padding:15px 25px;border-radius:8px;font-weight:bold;z-index:100000;opacity:0;transition:opacity 0.3s;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
            document.body.appendChild(notificacion);
        }
        notificacion.textContent = mensaje;
        notificacion.style.opacity = '1';
        setTimeout(() => { notificacion.style.opacity = '0'; }, 2500);
    },

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

    async gql(query, variables = {}) {
        const token = localStorage.getItem('fototec_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(this.API_ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query, variables })
        });

        const data = await res.json();
        if (data.errors) throw new Error(data.errors[0].message);
        return data.data;
    },

    async procederAlPago() {
        const carrito = this.obtenerCarrito();
        if (carrito.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }

        const total = this.obtenerTotalConIVA();
        const clienteNombre = prompt('Nombre del cliente:', '');
        if (!clienteNombre) return;

        const clienteEmail = prompt('Email del cliente:', '');
        const clienteTelefono = prompt('Teléfono:', '');

        try {
            let clientId = null;

            try {
                const clientData = await this.gql(`
                    mutation CreateClient($input: ClientInput!) {
                        createClient(input: $input) { id name }
                    }
                `, {
                    input: {
                        name: clienteNombre,
                        email: clienteEmail || null,
                        phone: clienteTelefono || null
                    }
                });
                clientId = clientData.createClient.id;
            } catch (e) {
                console.warn('No se pudo crear cliente:', e.message);
            }

            const items = carrito.map(item => ({
                description: item.nombre + (item.descripcion ? ' - ' + item.descripcion : ''),
                quantity: item.cantidad,
                price: item.precio
            }));

            const invoiceData = await this.gql(`
                mutation CreateInvoice($input: InvoiceInput!) {
                    createInvoice(input: $input) {
                        id folio status total
                        client { id name }
                    }
                }
            `, {
                input: {
                    clientId: clientId || 1,
                    items: items
                }
            });

            const invoice = invoiceData.createInvoice;
            this.limpiarCarrito();
            alert(`¡Cotización creada con éxito!\n\nFolio: ${invoice.folio}\nTotal: $${invoice.total.toFixed(2)} MXN\n\nNos pondremos en contacto contigo pronto.`);

        } catch (e) {
            console.error('Error al crear pedido:', e);
            this.guardarPedidoLocal(clienteNombre, carrito, total);
        }
    },

    guardarPedidoLocal(clienteNombre, carrito, total) {
        const pedidoLocal = {
            id: 'LOCAL-' + Date.now(),
            clienteNombre: clienteNombre,
            estado: 'Pendiente',
            total: total,
            productos: carrito.map(item => ({
                id: item.productoId,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio
            })),
            fechaCreacion: new Date().toLocaleString('es-ES')
        };

        const pedidosLocales = JSON.parse(localStorage.getItem('fototecPedidosLocal') || '[]');
        pedidosLocales.push(pedidoLocal);
        localStorage.setItem('fototecPedidosLocal', JSON.stringify(pedidosLocales));

        this.limpiarCarrito();
        alert(`¡Pedido guardado localmente!\n\nPedido #: ${pedidoLocal.id}\nTotal: $${total.toFixed(2)} MXN\n\nNota: El pedido será procesado cuando el servidor esté disponible.`);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (typeof carritoSystem !== 'undefined') {
        carritoSystem.actualizarContador();
    }
});
