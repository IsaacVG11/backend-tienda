const express = require("express");
const router = express.Router();
const db = require("../db"); // Conexión a MySQL
const authMiddleware = require("../middleware/authMiddleware"); // Middleware de autenticación

// 🟢 Crear un nuevo producto
router.post("/create", authMiddleware, async (req, res) => {
    const { nombre, descripcion, precio, imagen, stock, categoria_id } = req.body;

    if (!nombre || !precio || !stock) {
        return res.status(400).json({ error: "Nombre, precio y stock son obligatorios" });
    }

    try {
        await db.promise().query(
            "INSERT INTO productos (nombre, descripcion, precio, imagen, stock, categoria_id) VALUES (?, ?, ?, ?, ?, ?)",
            [nombre, descripcion, precio, imagen, stock, categoria_id]
        );

        res.json({ message: "Producto agregado exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🔵 Obtener todos los productos con su categoría
router.get("/", async (req, res) => {
    try {
        const [productos] = await db.promise().query(`
            SELECT p.*, c.nombre AS categoria 
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
        `);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🔵 Obtener un producto por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [producto] = await db.promise().query(`
            SELECT p.*, c.nombre AS categoria 
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = ?
        `, [id]);

        if (producto.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json(producto[0]);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🟡 Actualizar un producto
router.put("/update/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen, stock, categoria_id } = req.body;

    try {
        const [producto] = await db.promise().query("SELECT * FROM productos WHERE id = ?", [id]);

        if (producto.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        await db.promise().query(
            "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, imagen = ?, stock = ?, categoria_id = ? WHERE id = ?",
            [nombre, descripcion, precio, imagen, stock, categoria_id, id]
        );

        res.json({ message: "Producto actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🔴 Eliminar un producto
router.delete("/delete/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        await db.promise().query("DELETE FROM productos WHERE id = ?", [id]);
        res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

module.exports = router;
