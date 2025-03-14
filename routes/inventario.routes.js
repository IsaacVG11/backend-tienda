const express = require("express");
const router = express.Router();
const db = require("../db"); // Conexión a MySQL
const authMiddleware = require("../middleware/authMiddleware");

// 🟢 Registrar Movimiento de Inventario
router.post("/movimiento", authMiddleware, async (req, res) => {
    const { producto_id, cantidad, tipo, motivo } = req.body;
    const usuario_id = req.user.id;

    if (!producto_id || !cantidad || !tipo || !motivo) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (tipo !== "entrada" && tipo !== "salida") {
        return res.status(400).json({ error: "Tipo debe ser 'entrada' o 'salida'" });
    }

    try {
        // Actualizar stock en productos
        if (tipo === "entrada") {
            await db.promise().query("UPDATE productos SET stock = stock + ? WHERE id = ?", [cantidad, producto_id]);
        } else {
            // Verificar si hay stock suficiente
            const [producto] = await db.promise().query("SELECT stock FROM productos WHERE id = ?", [producto_id]);
            if (producto[0].stock < cantidad) {
                return res.status(400).json({ error: "Stock insuficiente" });
            }
            await db.promise().query("UPDATE productos SET stock = stock - ? WHERE id = ?", [cantidad, producto_id]);
        }

        // Insertar el movimiento en inventario
        await db.promise().query(
            "INSERT INTO inventario (producto_id, cantidad, tipo, motivo, usuario_id) VALUES (?, ?, ?, ?, ?)",
            [producto_id, cantidad, tipo, motivo, usuario_id]
        );

        res.json({ message: "Movimiento registrado exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🔵 Obtener el historial completo de inventario
router.get("/", authMiddleware, async (req, res) => {
    try {
        const [movimientos] = await db.promise().query(`
            SELECT i.*, p.nombre AS producto, u.nombre AS usuario
            FROM inventario i
            JOIN productos p ON i.producto_id = p.id
            JOIN usuarios u ON i.usuario_id = u.id
            ORDER BY i.fecha DESC
        `);
        res.json(movimientos);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🔵 Obtener movimientos de un producto específico
router.get("/:producto_id", authMiddleware, async (req, res) => {
    const { producto_id } = req.params;

    try {
        const [movimientos] = await db.promise().query(
            "SELECT * FROM inventario WHERE producto_id = ? ORDER BY fecha DESC",
            [producto_id]
        );
        res.json(movimientos);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Endpoint para hacer un gráfico de líneas sobre la evolución del stock
router.get("/stock-evolucion/:producto_id", authMiddleware, async (req, res) => {
    const { producto_id } = req.params;

    try {
        const [data] = await db.promise().query(`
            SELECT DATE(fecha) AS fecha, 
                   SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -cantidad END) AS stock_cambio
            FROM inventario
            WHERE producto_id = ?
            GROUP BY DATE(fecha)
            ORDER BY fecha ASC
        `, [producto_id]);

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

//Endpoint de entradas vs salidas y hacer un gráfico de líneas
router.get("/stock-evolucion/:producto_id", authMiddleware, async (req, res) => {
    const { producto_id } = req.params;

    try {
        const [data] = await db.promise().query(`
            SELECT DATE(fecha) AS fecha, 
                   SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -cantidad END) AS stock_cambio
            FROM inventario
            WHERE producto_id = ?
            GROUP BY DATE(fecha)
            ORDER BY fecha ASC
        `, [producto_id]);

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

//Endpoint para distribución de movimientos por producto y hacer un gráfico de pastel
router.get("/movimientos-productos", authMiddleware, async (req, res) => {
    try {
        const [data] = await db.promise().query(`
            SELECT p.nombre AS producto, SUM(i.cantidad) AS total_movimientos
            FROM inventario i
            JOIN productos p ON i.producto_id = p.id
            GROUP BY i.producto_id
        `);

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});


module.exports = router;
