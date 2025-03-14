const express = require("express");
const router = express.Router();
const db = require("../db");// Conexión a MySQL
const authMiddleware = require("../middleware/authMiddleware"); // Middleware de autenticación

// 🟢 Crear una nueva categoría
router.post("/create", authMiddleware, async (req, res) => {
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
    }

    try {
        await db.promise().query("INSERT INTO categorias (nombre) VALUES (?)", [nombre]);
        res.json({ message: "Categoría creada exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🔵 Obtener todas las categorías
router.get("/", async (req, res) => {
    try {
        const [categorias] = await db.promise().query("SELECT * FROM categorias");
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🟡 Actualizar una categoría
router.put("/update/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;

    try {
        const [categoria] = await db.promise().query("SELECT * FROM categorias WHERE id = ?", [id]);
        if (categoria.length === 0) {
            return res.status(404).json({ error: "Categoría no encontrada" });
        }

        await db.promise().query("UPDATE categorias SET nombre = ? WHERE id = ?", [nombre, id]);

        res.json({ message: "Categoría actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🔴 Eliminar una categoría (solo si no tiene productos asociados)
router.delete("/delete/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const [productos] = await db.promise().query("SELECT * FROM productos WHERE categoria_id = ?", [id]);

        if (productos.length > 0) {
            return res.status(400).json({ error: "No se puede eliminar la categoría porque tiene productos asociados" });
        }

        await db.promise().query("DELETE FROM categorias WHERE id = ?", [id]);
        res.json({ message: "Categoría eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

module.exports = router;
