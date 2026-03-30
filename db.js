const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        initDB();
    }
});

function initDB() {
    db.serialize(() => {
        // Tabla de Productos
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            oldPrice REAL,
            img TEXT,
            rating INTEGER DEFAULT 5,
            isOutOfStock INTEGER DEFAULT 0
        )`, () => {
            // Intentar añadir la columna a la base de datos existente (ignoramos el error si ya existe)
            db.run("ALTER TABLE products ADD COLUMN isOutOfStock INTEGER DEFAULT 0", (err) => {});
        });

        // Tabla de Órdenes
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            items TEXT NOT NULL, -- JSON string
            totalAmount REAL NOT NULL,
            currency TEXT DEFAULT 'COP',
            status TEXT DEFAULT 'PENDING',
            customerName TEXT,
            customerEmail TEXT,
            customerAddress TEXT,
            customerPhone TEXT,
            customerCity TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de Usuarios para Admin
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`);

        // Tabla de Clientes (registro público)
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Insertar productos iniciales si la tabla productos está vacía
        db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (row && row.count === 0) {
                console.log("Poblando base de datos con productos iniciales...");
                const stmt = db.prepare(`INSERT INTO products (name, price, oldPrice, img, rating) VALUES (?, ?, ?, ?, ?)`);
                const initialProducts = [
                    { name: "Audífonos Bluetooth Pro", price: 45000, oldPrice: 95000, img: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=300", rating: 5 },
                    { name: "Sartén Antiadherente", price: 80000, oldPrice: 120000, img: "https://images.unsplash.com/photo-1584990347449-a6e0aa14f24d?w=300", rating: 5 },
                    { name: "Cafetera de Filtro", price: 95000, oldPrice: 180000, img: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300", rating: 4 },
                    { name: "Set Home Goods", price: 45600, oldPrice: null, img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300", rating: 4 },
                    { name: "Hervidor Eléctrico", price: 56000, oldPrice: null, img: "https://images.unsplash.com/photo-1594803738096-7bb13c5ee918?w=300", rating: 5 },
                    { name: "Sudadera Gris", price: 45000, oldPrice: null, img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300", rating: 5 },
                    { name: "Camiseta Básica Navy", price: 33000, oldPrice: 45000, img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300", rating: 4 },
                    { name: "Pack Medias x3", price: 15000, oldPrice: null, img: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=300", rating: 5 }
                ];
                initialProducts.forEach(p => {
                    stmt.run(p.name, p.price, p.oldPrice, p.img, p.rating);
                });
                stmt.finalize();
            }
        });

        // Insertar usuario admin por defecto si no existe
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (row && row.count === 0) {
                console.log("Creando usuario admin por defecto...");
                db.run(`INSERT INTO users (username, password) VALUES ('admin', 'admin123')`);
            }
        });
    });
}

module.exports = db;
