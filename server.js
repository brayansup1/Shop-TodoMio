const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Servir archivos estáticos (index.html, admin.html)
app.use(express.static(path.join(__dirname)));

// ==========================================
// RUTAS DE LA TIENDA (PÚBLICO)
// ==========================================

// Obtener todos los productos
app.get('/v1/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Procesar pedido (Checkout)
app.post('/v1/checkout', (req, res) => {
    const { items, totalAmount, customerInfo } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ error: "El carrito está vacío" });
    }

    const itemsJson = JSON.stringify(items);
    const { name, email, address, phone, city } = customerInfo || {};

    const sql = `INSERT INTO orders (items, totalAmount, customerName, customerEmail, customerAddress, customerPhone, customerCity) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [itemsJson, totalAmount, name, email, address, phone, city], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ success: true, orderId: this.lastID, message: "Orden creada exitosamente" });
    });
});

// ==========================================
// RUTAS DE ADMINISTRACIÓN (PANEL ADMIN)
// ==========================================

const activeTokens = new Set();
const crypto = require('crypto');

// Login de Admin
app.post('/v1/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
        
        const token = crypto.randomBytes(32).toString('hex');
        activeTokens.add(token);
        res.json({ success: true, token });
    });
});

// Middleware de Autenticación
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: "Acceso no autorizado" });
    
    const token = authHeader.split(' ')[1];
    if (!activeTokens.has(token)) return res.status(401).json({ error: "Token inválido o expirado" });
    
    next();
};

// Aplicar middleware a todas las rutas de admin subsiguientes
app.use('/v1/admin', authenticateAdmin);

// Obtener todos los pedidos
app.get('/v1/admin/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Parsear items JSON para que sea más fácil en el frontend
        const parsedRows = rows.map(r => ({ ...r, items: JSON.parse(r.items) }));
        res.json(parsedRows);
    });
});

// Crear un nuevo producto
app.post('/v1/admin/products', (req, res) => {
    const { name, price, oldPrice, img, rating, isOutOfStock } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    const outOfStock = isOutOfStock ? 1 : 0;
    const sql = `INSERT INTO products (name, price, oldPrice, img, rating, isOutOfStock) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [name, price, oldPrice, img, rating || 5, outOfStock], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, name, price, oldPrice, img, rating, isOutOfStock: outOfStock });
    });
});

// Actualizar un producto existente
app.put('/v1/admin/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, oldPrice, img, rating, isOutOfStock } = req.body;
    
    const outOfStock = isOutOfStock ? 1 : 0;
    const sql = `UPDATE products SET name = ?, price = ?, oldPrice = ?, img = ?, rating = ?, isOutOfStock = ? WHERE id = ?`;
    db.run(sql, [name, price, oldPrice, img, rating, outOfStock, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Producto no encontrado" });
        res.json({ success: true, message: "Producto actualizado" });
    });
});

// Eliminar un producto
app.delete('/v1/admin/products/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = `DELETE FROM products WHERE id = ?`;
    db.run(sql, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Producto no encontrado" });
        res.json({ success: true, message: "Producto eliminado" });
    });
});

// Actualizar estado de una orden
app.put('/v1/admin/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const sql = `UPDATE orders SET status = ? WHERE id = ?`;
    db.run(sql, [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Estado de orden actualizado" });
    });
});


// ==========================================
// WEBHOOKS (EJ. DROPI)
// ==========================================
app.post('/v1/webhooks/dropi', (req, res) => {
    console.log("🔔 [Webhook Dropi] Recibido:", req.body);
    // Aquí puedes procesar la actualización de inventario o estado de pedido de Dropi.
    // Ej: Buscar la orden en la base de datos por el external_id y actualizar el estado
    
    // Devolver status 200 rápido para que Dropi sepa que lo recibimos
    res.status(200).send('OK');
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor TodoMío corriendo en http://localhost:${PORT}`);
});
