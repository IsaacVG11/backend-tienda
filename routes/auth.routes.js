const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db"); // Conexión a MySQL
require("dotenv").config();

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Registro de usuario (solo para administradores)
router.post("/register", async (req, res) => {
    const { nombre, email, user_password } = req.body;

    if (!nombre || !email || !user_password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        // Verificar si el usuario ya existe
        const [userExists] = await db.promise().query("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (userExists.length > 0) {
            return res.status(400).json({ error: "El usuario ya existe" });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user_password, salt);

        // Insertar usuario en la base de datos
        await db.promise().query("INSERT INTO usuarios (nombre, email, user_password) VALUES (?, ?, ?)",
            [nombre, email, hashedPassword]);

        res.status(201).json({ message: "Usuario registrado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Inicio de sesión
router.post("/login", async (req, res) => {
    const { email, user_password } = req.body;

    if (!email || !user_password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        // Verificar si el usuario existe
        const [users] = await db.promise().query("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const usuario = users[0];

        // Comparar contraseña
        const passwordMatch = await bcrypt.compare(user_password, usuario.user_password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        // Generar JWT
        const token = jwt.sign({ id: usuario.id, email: usuario.email, rol: usuario.rol }, process.env.JWT_SECRET, {
            expiresIn: "2h",
        });

        res.json({ message: "Inicio de sesión exitoso", token });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Actualizar usuario (requiere autenticación)
router.put("/update/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { nombre, email, user_password } = req.body;

    try {
        // Verificar si el usuario existe
        const [userExists] = await db.promise().query("SELECT * FROM usuarios WHERE id = ?", [id]);
        if (userExists.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        let hashedPassword = userExists[0].user_password;
        if (user_password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(user_password, salt);
        }

        // Actualizar usuario
        await db.promise().query(
            "UPDATE usuarios SET nombre = ?, email = ?, user_password = ? WHERE id = ?",
            [nombre || userExists[0].nombre, email || userExists[0].email, hashedPassword, id]
        );

        res.json({ message: "Usuario actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Eliminar usuario (requiere autenticación)
router.delete("/delete/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar si el usuario existe
        const [userExists] = await db.promise().query("SELECT * FROM usuarios WHERE id = ?", [id]);
        if (userExists.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Eliminar usuario
        await db.promise().query("DELETE FROM usuarios WHERE id = ?", [id]);

        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

module.exports = router;
