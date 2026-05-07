const db = require('./db');

// Productos de ejemplo
const productos = [
    {
        nombre: 'Sesión Estudio Blanco',
        descripcion: 'Fotografía profesional en fondo blanco',
        precio: 50,
        stock: 100,
        categoria: 'estudio'
    },
    {
        nombre: 'Sesión de Boda (5 horas)',
        descripcion: 'Cobertura completa de matrimonio',
        precio: 300,
        stock: 50,
        categoria: 'boda'
    },
    {
        nombre: 'Impresión Fine Art (24x36)',
        descripcion: 'Impresión de calidad ultraalta',
        precio: 80,
        stock: 200,
        categoria: 'impresion'
    }
];

console.log('\n📝 Agregando productos...\n');

productos.forEach(p => {
    const stmt = db.prepare(`
        INSERT INTO productos (nombre, descripcion, precio, stock, categoria)
        VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(p.nombre, p.descripcion, p.precio, p.stock, p.categoria);
    console.log(`✅ Agregado: ${p.nombre}`);
});

// Ahora mostrar la base de datos
console.log('\n=== USUARIOS ===');
console.table(db.prepare('SELECT id, name, username, email, role FROM users').all());

console.log('\n=== PRODUCTOS ===');
console.table(db.prepare('SELECT * FROM productos').all());

console.log('\n=== RESERVAS ===');
const reservas = db.prepare(`
    SELECT r.*, p.nombre as producto_nombre 
    FROM reservas r 
    JOIN productos p ON r.producto_id = p.id
`).all();

if (reservas.length === 0) {
    console.log('(No hay reservas aún)');
} else {
    console.table(reservas);
}

console.log('\n✅ Done!\n');
