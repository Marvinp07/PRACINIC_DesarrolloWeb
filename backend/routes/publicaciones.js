import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const router = express.Router();

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
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

// CREAR UNA PUBLICACIÓN
router.post('/', verifyToken, async (req, res) => {
    try {
        const { CURSOS_ID_CURSO, PROFESORES_ID_PROFESOR, MENSAJE } = req.body;

        if (!MENSAJE) {
            return res.status(400).json({ error: 'El mensaje es obligatorio' });
        }

        // Validar curso si se envió
        if (CURSOS_ID_CURSO) {
            const [curso] = await pool.execute(
                "SELECT * FROM CURSOS WHERE ID_CURSO = ?",
                [CURSOS_ID_CURSO]
            );
            if (curso.length === 0) {
                return res.status(404).json({ error: "Curso no encontrado" });
            }
        }

        // Validar profesor si se envió
        if (PROFESORES_ID_PROFESOR) {
            const [profesor] = await pool.execute(
                "SELECT * FROM PROFESORES WHERE ID_PROFESOR = ?",
                [PROFESORES_ID_PROFESOR]
            );
            if (profesor.length === 0) {
                return res.status(404).json({ error: "Profesor no encontrado" });
            }
        }

        // Crear la publicación
        const [result] = await pool.execute(
            `INSERT INTO PUBLICACIONES 
             (MENSAJE, USUARIOS_ID_USUARIO, CURSOS_ID_CURSO, PROFESORES_ID_PROFESOR) 
             VALUES (?, ?, ?, ?)`,
            [
                MENSAJE,
                req.userId,
                CURSOS_ID_CURSO || null,
                PROFESORES_ID_PROFESOR || null
            ]
        );

        // Devolver la publicación creada
        const [nuevaPublicacion] = await pool.execute(
            `SELECT 
                p.*,
                u.NOMBRES as usuario_nombres,
                u.APELLIDOS as usuario_apellidos,
                c.NOMBRE_CURSO,
                pr.NOMBRES as profesor_nombres,
                pr.APELLIDOS as profesor_apellidos
             FROM PUBLICACIONES p
             JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
             LEFT JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
             LEFT JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
             WHERE p.ID_PUBLI = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: 'Publicación creada exitosamente',
            publicacion: nuevaPublicacion[0]
        });

    } catch (error) {
        console.error('Error al crear publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// OBTENER TODAS LAS PUBLICACIONES
router.get("/obtenerPublicaciones", async (req, res) => {
    try {
        const [rows] = await pool.query(`            
            SELECT p.ID_PUBLI, p.MENSAJE, p.FECHA,
            u.NOMBRES as estudiante, c.NOMBRE_CURSO, pr.NOMBRES AS profesor
            FROM Publicaciones p
            JOIN Usuarios u ON p.USUARIOS_ID_USUARIO= u.ID_USUARIO
            LEFT JOIN Cursos c on p.CURSOS_ID_CURSO = c.ID_CURSO
            LEFT JOIN Profesores pr on p.PROFESORES_ID_PROFESOR= pr.ID_PROFESOR
            ORDER BY p.FECHA DESC ;    `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// OBTENER LAS PUBLICACIONES DE UN USUARIO
router.get("/usuarios/:userId", verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Validar que el userId sea un número válido
        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ 
                error: 'ID de usuario inválido' 
            });
        }

        const [userExists] = await pool.execute(
            'SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?',
            [userId]
        );

        if (userExists.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        const [publicaciones] = await pool.execute(`
            SELECT 
                p.ID_PUBLI,
                p.MENSAJE,
                p.FECHA,
                u.NOMBRES,
                u.APELLIDOS,
                u.REGISTRO_ACADEMICO,
                p.CURSOS_ID_CURSO AS ID_CURSO,
                c.NOMBRE_CURSO,
                p.PROFESORES_ID_PROFESOR AS ID_PROFESOR,
                pr.NOMBRES AS NOMBRE,
                pr.APELLIDOS AS APELLIDO
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
            LEFT JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
            LEFT JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
            WHERE p.USUARIOS_ID_USUARIO = ?
            ORDER BY p.FECHA DESC
        `, [userId]);

        // Corregir el WHERE para que use USUARIOS_ID_USUARIO también aquí
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM PUBLICACIONES WHERE USUARIOS_ID_USUARIO = ?',
            [userId]
        );

        const totalPublicaciones = countResult[0].total;

        res.json({
            message: 'Publicaciones obtenidas exitosamente',
            total: totalPublicaciones,
            publicaciones: publicaciones.map(pub => ({
                id: pub.ID_PUBLI,
                mensaje: pub.MENSAJE,
                fecha_creacion: pub.FECHA,
                curso: pub.ID_CURSO ? {
                    id: pub.ID_CURSO,
                    nombre: pub.NOMBRE_CURSO,
                } : null,
                profesor: pub.ID_PROFESOR ? {
                    id: pub.ID_PROFESOR,
                    nombre: pub.NOMBRE,
                    apellido: pub.APELLIDO
                } : null,
                autor: {
                    nombres: pub.NOMBRES,
                    apellidos: pub.APELLIDOS,
                    registro_academico: pub.REGISTRO_ACADEMICO
                }
            }))
        });

    } catch (err) {
        console.error('Error al obtener publicaciones del usuario:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/cursos/:cursoId", verifyToken, async (req, res) => {
    try {
        const { cursoId } = req.params;

        // Validar que el cursoId sea un número válido
        if (isNaN(cursoId) || cursoId <= 0) {
            return res.status(400).json({ 
                error: 'ID de curso inválido' 
            });
        }

        const [cursoExists] = await pool.execute(
            'SELECT ID_CURSO FROM CURSOS WHERE ID_CURSO = ?',
            [cursoId]
        );

        if (cursoExists.length === 0) {
            return res.status(404).json({
                error: 'Curso no encontrado'
            });
        }

        const [publicaciones] = await pool.execute(`
            SELECT 
                p.ID_PUBLI,
                p.MENSAJE,
                p.FECHA,
                u.NOMBRES,
                u.APELLIDOS,
                u.REGISTRO_ACADEMICO,
                p.CURSOS_ID_CURSO AS ID_CURSO,
                c.NOMBRE_CURSO
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
            LEFT JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
            WHERE p.CURSOS_ID_CURSO = ?
            ORDER BY p.FECHA DESC
        `, [cursoId]);

        // Corregir el WHERE para que use USUARIOS_ID_USUARIO también aquí
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM PUBLICACIONES WHERE CURSOS_ID_CURSO = ?',
            [cursoId]
        );

        const totalPublicaciones = countResult[0].total;

        res.json({
            message: 'Publicaciones obtenidas exitosamente',
            total: totalPublicaciones,
            curso: cursoExists[0],
            publicaciones: publicaciones.map(pub => ({
                id: pub.ID_PUBLI,
                mensaje: pub.MENSAJE,
                fecha_creacion: pub.FECHA,
                curso: {
                    id: pub.ID_CURSO,
                    nombre: pub.NOMBRE_CURSO,
                },
                autor: {
                    nombres: pub.NOMBRES,
                    apellidos: pub.APELLIDOS,
                    registro_academico: pub.REGISTRO_ACADEMICO
                }
            }))
        });

    } catch (err) {
        console.error('Error al obtener publicaciones del curso:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/profesores/:profesorId", verifyToken, async (req, res) => {
    try {
        const { profesorId } = req.params;

        // Validar que el cursoId sea un número válido
        if (isNaN(profesorId) || profesorId <= 0) {
            return res.status(400).json({ 
                error: 'ID de profesor inválido' 
            });
        }

        const [profesorExists] = await pool.execute(
            'SELECT ID_PROFESOR FROM PROFESORES WHERE ID_PROFESOR = ?',
            [profesorId]
        );

        if (profesorExists.length === 0) {
            return res.status(404).json({
                error: 'Profesor no encontrado'
            });
        }

        const [publicaciones] = await pool.execute(`
            SELECT 
                p.ID_PUBLI,
                p.MENSAJE,
                p.FECHA,
                u.NOMBRES,
                u.APELLIDOS,
                u.REGISTRO_ACADEMICO,
                p.PROFESORES_ID_PROFESOR AS ID_PROFESOR,
                pr.NOMBRES AS NOMBRE,
                pr.APELLIDOS AS APELLIDO
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
            LEFT JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
            WHERE p.PROFESORES_ID_PROFESOR = ?
            ORDER BY p.FECHA DESC
        `, [profesorId]);

        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM PUBLICACIONES WHERE PROFESORES_ID_PROFESOR = ?',
            [profesorId]
        );

        const totalPublicaciones = countResult[0].total;

        res.json({
            message: 'Publicaciones obtenidas exitosamente',
            total: totalPublicaciones,
            profesor: profesorExists[0],
            publicaciones: publicaciones.map(pub => ({
                id: pub.ID_PUBLI,
                mensaje: pub.MENSAJE,
                fecha_creacion: pub.FECHA,
                profesor: {
                    id: pub.ID_PROFESOR,
                    nombre: pub.NOMBRE,
                    apellido: pub.APELLIDO
                },
                autor: {
                    nombres: pub.NOMBRES,
                    apellidos: pub.APELLIDOS,
                    registro_academico: pub.REGISTRO_ACADEMICO
                }
            }))
        });

    } catch (err) {
        console.error('Error al obtener publicaciones del curso:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;