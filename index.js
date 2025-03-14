require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para procesar JSON
app.use(express.json());
app.use(require("cors")());

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error("Error conectando a la base de datos:", err);
        return;
    }
    console.log("✅ Conectado a MySQL");
});

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("¡Servidor funcionando!");
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const categoriasRoutes = require("./routes/categorias.routes");
app.use("/api/categorias", categoriasRoutes);

const productosRoutes = require("./routes/productos.routes");
app.use("/api/productos", productosRoutes);

const inventarioRoutes = require("./routes/inventario.routes");
app.use("/api/inventario", inventarioRoutes);
