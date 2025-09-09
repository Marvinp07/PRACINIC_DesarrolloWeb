import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const router = express.Router();

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// REGISTRO DE USUARIO
router.post('/registro', async (req, res) => {
    try {
        const { registro_academico, nombres, apellidos, correo, contrasena } = req.body;

        // Validaciones básicas
        if (!registro_academico || !nombres || !apellidos || !correo || !contrasena) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios' 
            });
        }

        // Verificar si ya existe el usuario
        const [existingUser] = await pool.execute(
            'SELECT * FROM USUARIOS WHERE REGISTRO_ACADEMICO = ? OR CORREO = ?',
            [registro_academico, correo]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ 
                error: 'El registro académico o correo ya están registrados' 
            });
        }

        // Encriptar contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

        // Insertar usuario
        const [result] = await pool.execute(
            'INSERT INTO USUARIOS (REGISTRO_ACADEMICO, NOMBRES, APELLIDOS, CORREO, CONTRASENA) VALUES (?, ?, ?, ?, ?)',
            [registro_academico, nombres, apellidos, correo, hashedPassword]
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// INICIO DE SESIÓN
router.post('/login', async (req, res) => {
    try {
        const { registro_academico, contrasena } = req.body;

        if (!registro_academico || !contrasena) {
            return res.status(400).json({ 
                error: 'Registro académico y contraseña son obligatorios' 
            });
        }

        // Buscar usuario
        const [users] = await pool.execute(
            'SELECT * FROM USUARIOS WHERE REGISTRO_ACADEMICO = ?',
            [registro_academico]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        const user = users[0];

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(contrasena, user.CONTRASENA);
        if (!passwordMatch) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        // Generar JWT
        const token = jwt.sign(
            { 
                userId: user.ID_USUARIO,
                registroAcademico: user.REGISTRO_ACADEMICO
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: user.ID_USUARIO,
                registro_academico: user.REGISTRO_ACADEMICO,
                nombres: user.NOMBRES,
                apellidos: user.APELLIDOS,
                correo: user.CORREO
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// RESTABLECER CONTRASEÑA
router.post('/restablecer-contrasena', async (req, res) => {
    try {
        const { registro_academico, correo, nueva_contrasena } = req.body;

        if (!registro_academico || !correo || !nueva_contrasena) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios' 
            });
        }

        // Verificar que el usuario existe con esos datos
        const [users] = await pool.execute(
            'SELECT * FROM USUARIOS WHERE REGISTRO_ACADEMICO = ? AND CORREO = ?',
            [registro_academico, correo]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                error: 'Los datos no coinciden con ningún usuario registrado' 
            });
        }

        // Encriptar nueva contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(nueva_contrasena, saltRounds);

        // Actualizar contraseña
        await pool.execute(
            'UPDATE USUARIOS SET CONTRASENA = ? WHERE REGISTRO_ACADEMICO = ? AND CORREO = ?',
            [hashedPassword, registro_academico, correo]
        );

        res.json({
            message: 'Contraseña restablecida exitosamente'
        });

    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// OBTENER PERFIL DEL USUARIO AUTENTICADO
router.get('/perfil', verifyToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT ID_USUARIO, REGISTRO_ACADEMICO, NOMBRES, APELLIDOS, CORREO FROM USUARIOS WHERE ID_USUARIO = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            usuario: users[0]
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// BUSCAR USUARIO POR REGISTRO ACADÉMICO
router.get('/buscar/:registro', verifyToken, async (req, res) => {
    try {
        const { registro } = req.params;

        const [users] = await pool.execute(
            'SELECT ID_USUARIO, REGISTRO_ACADEMICO, NOMBRES, APELLIDOS, CORREO FROM USUARIOS WHERE REGISTRO_ACADEMICO = ?',
            [registro]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado' 
            });
        }

        res.json({
            usuario: users[0]
        });

    } catch (error) {
        console.error('Error al buscar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ACTUALIZAR DATOS DEL USUARIO AUTENTICADO
router.put('/perfil', verifyToken, async (req, res) => {
    try {
        const { nombres, apellidos, correo } = req.body;

        if (!nombres || !apellidos || !correo) {
            return res.status(400).json({ 
                error: 'Nombres, apellidos y correo son obligatorios' 
            });
        }

        // Verificar que el correo no esté siendo usado por otro usuario
        const [existingUser] = await pool.execute(
            'SELECT * FROM USUARIOS WHERE CORREO = ? AND ID_USUARIO != ?',
            [correo, req.userId]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ 
                error: 'El correo ya está siendo usado por otro usuario' 
            });
        }

        // Actualizar datos
        await pool.execute(
            'UPDATE USUARIOS SET NOMBRES = ?, APELLIDOS = ?, CORREO = ? WHERE ID_USUARIO = ?',
            [nombres, apellidos, correo, req.userId]
        );

        res.json({
            message: 'Perfil actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// OBTENER TODOS LOS USUARIOS (para pruebas - quitar en producción)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT ID_USUARIO, REGISTRO_ACADEMICO, NOMBRES, APELLIDOS, CORREO FROM USUARIOS'
        );

        res.json({
            usuarios: users
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;