const db = require('./db');

console.log('\n📝 Agregando reserva de ejemplo...\n');

// Crear un usuario cliente primero
const userStmt = db.prepare(`
    INSERT INTO users (name, username, email, password, role)
    VALUES (?, ?, ?, ?, ?)
`);

const bcrypt = require('bcryptjs');
const hashedPassword = bcrypt.hashSync('cliente123', 10);

try {
    const userResult = userStmt.run('Cliente Test', 'cliente1', 'cliente@test.com', hashedPassword, 'user');
    const usuarioId = userResult.lastInsertRowid;
    console.log(`✅ Usuario creado: cliente1 (ID: ${usuarioId})`);

    // Crear una reserva
    const reservaStmt = db.prepare(`
        INSERT INTO reservas (usuario_id, producto_id, cantidad, total_price, notas)
        VALUES (?, ?, ?, ?, ?)
    `);

    const result = reservaStmt.run(usuarioId, 1, 2, 100, 'Reserva urgente para evento');
    console.log(`✅ Reserva creada (ID: ${result.lastInsertRowid})`);

    // Actualizar stock del producto
    const updateStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
    updateStock.run(2, 1);
    console.log(`✅ Stock actualizado`);

} catch (err) {
    console.log(`⚠️  Usuario ya existe o error: ${err.message}`);
}

// Mostrar todo
console.log('\n=== USUARIOS ===');
console.table(db.prepare('SELECT id, name, username, email, role FROM users').all());

console.log('\n=== PRODUCTOS ===');
console.table(db.prepare('SELECT id, nombre, precio, stock FROM productos').all());

console.log('\n=== RESERVAS ===');
const reservas = db.prepare(`
    SELECT 
        r.id,
        r.usuario_id,
        u.name as cliente,
        r.producto_id,
        p.nombre as producto,
        r.cantidad,
        r.total_price,
        r.estado,
        r.fecha_reserva
    FROM reservas r
    JOIN users u ON r.usuario_id = u.id
    JOIN productos p ON r.producto_id = p.id
`).all();

if (reservas.length === 0) {
    console.log('(No hay reservas)');
} else {
    console.table(reservas);
}

console.log('\n✅ Done!\n');
