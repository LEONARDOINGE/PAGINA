const db = require('./db');

console.log('\n=== USUARIOS ===');
console.table(db.prepare('SELECT * FROM users').all());

console.log('\n=== PRODUCTOS ===');
console.table(db.prepare('SELECT * FROM productos').all());

console.log('\n=== RESERVAS ===');
console.table(db.prepare(`
    SELECT r.*, p.nombre as producto_nombre 
    FROM reservas r 
    JOIN productos p ON r.producto_id = p.id
`).all());

console.log('\n✅ Done!\n');
